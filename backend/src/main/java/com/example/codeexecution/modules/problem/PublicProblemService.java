package com.example.codeexecution.modules.problem;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.common.exceptions.ResourceNotFoundException;
import com.example.codeexecution.common.responses.PaginationMeta;
import com.example.codeexecution.modules.problem.dtos.PublicProblemDetailResponse;
import com.example.codeexecution.modules.problem.dtos.PublicProblemDetailResponse.SampleTestCase;
import com.example.codeexecution.modules.problem.dtos.PublicProblemResponse;
import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.submission.services.LanguageRegistry;

/**
 * User-facing problem discovery over <b>published, non-deleted</b>
 * problems only.
 *
 * - The list exposes public metadata only (never statement internals,
 *   never test case paths) plus the judge-maintained acceptance counters
 *   ({@code totalSubmissions} / {@code acceptedSubmissions} /
 *   {@code acceptanceRate}) that the workers bump after every full
 *   submission.
 * - The detail payload includes the markdown statement, limits, language
 *   starter templates and only the public sample test cases with their
 *   literal input/output text.
 */
@Service
public class PublicProblemService {

    private static final int MAX_LIMIT = 100;
    private static final int MAX_SAMPLE_CHARS = 64_000;
    private static final int DEFAULT_TIME_LIMIT_MS = 1000;
    private static final int DEFAULT_MEMORY_LIMIT_KB = 256000;

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final MongoTemplate mongoTemplate;
    private final LanguageRegistry languageRegistry;

    public PublicProblemService(
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            MongoTemplate mongoTemplate,
            LanguageRegistry languageRegistry) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.mongoTemplate = mongoTemplate;
        this.languageRegistry = languageRegistry;
    }

    /** Paginated public listing; {@code tags} is comma-separated (AND). */
    public PublicProblemPage list(
            String search, String difficulty, String tags, int page, int limit) {

        page = Math.max(1, page);
        limit = Math.min(MAX_LIMIT, Math.max(1, limit));

        List<Criteria> conditions = new ArrayList<>();
        conditions.add(Criteria.where("isDeleted").is(false));
        conditions.add(Criteria.where("isPublished").is(true));

        if (search != null && !search.isBlank()) {
            String pattern = java.util.regex.Pattern.quote(search.trim());
            conditions.add(new Criteria().orOperator(
                    Criteria.where("title").regex(pattern, "i"),
                    Criteria.where("description").regex(pattern, "i"),
                    Criteria.where("slug").regex(pattern, "i")));
        }
        if (difficulty != null && !difficulty.isBlank()) {
            conditions.add(Criteria.where("difficulty").is(parseDifficulty(difficulty)));
        }
        if (tags != null && !tags.isBlank()) {
            List<String> required = List.of(tags.split(",")).stream()
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .toList();
            if (!required.isEmpty()) {
                conditions.add(Criteria.where("tags").all(required));
            }
        }

        Criteria criteria = new Criteria().andOperator(conditions.toArray(new Criteria[0]));

        long total = this.mongoTemplate.count(Query.query(criteria), Problem.class);
        List<Problem> problems = this.mongoTemplate.find(
                Query.query(criteria)
                        .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                        .skip((long) (page - 1) * limit)
                        .limit(limit),
                Problem.class);

        List<PublicProblemResponse> items = problems.stream()
                .map(problem -> new PublicProblemResponse(
                        problem.getId(),
                        problem.getTitle(),
                        problem.getSlug(),
                        problem.getDescription(),
                        problem.getDifficulty(),
                        problem.getTags() == null ? List.of() : problem.getTags(),
                        problem.getTotalSubmissions(),
                        problem.getAcceptedSubmissions(),
                        acceptanceRate(problem)))
                .toList();

        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / limit);
        return new PublicProblemPage(items, new PaginationMeta(page, limit, total, totalPages));
    }

    /** Full detail by unique slug; only published, non-deleted problems. */
    public PublicProblemDetailResponse detail(String slug) {
        Problem problem = this.problemRepository.findBySlug(slug)
                .filter(found -> !found.isDeleted() && found.isPublished())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Problem not found: " + slug));

        List<TestCase> all = this.testCaseRepository.findByProblemId(problem.getId());

        int timeLimit = all.stream()
                .mapToInt(TestCase::getTimeLimitMs)
                .max()
                .orElse(DEFAULT_TIME_LIMIT_MS);
        int memoryLimit = all.stream()
                .mapToInt(TestCase::getMemoryLimitKb)
                .max()
                .orElse(DEFAULT_MEMORY_LIMIT_KB);

        // Sorted by id so the sample order shown here is exactly the order the judge
        // runs them in, which is what lets the UI map a streamed CASE_RESULT
        // straight onto a testcase tab.
        List<SampleTestCase> samples = all.stream()
                .filter(TestCase::isSample)
                .sorted(java.util.Comparator.comparing(TestCase::getId))
                .map(testCase -> new SampleTestCase(
                        testCase.getId(),
                        readCapped(testCase.getInputFilePath()),
                        readCapped(testCase.getOutputFilePath()),
                        testCase.getTimeLimitMs(),
                        testCase.getMemoryLimitKb()))
                .toList();

        return new PublicProblemDetailResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getSlug(),
                problem.getDescription(),
                problem.getProblemStatement(),
                problem.getDifficulty(),
                problem.getTags() == null ? List.of() : problem.getTags(),
                timeLimit,
                memoryLimit,
                this.languageRegistry.starterTemplates(),
                samples);
    }

    /**
     * acceptanceRate = acceptedSubmissions / totalSubmissions from the
     * judge-maintained counters, rounded to 4 decimals; null when the
     * problem has no completed full run yet.
     */
    private static Double acceptanceRate(Problem problem) {
        if (problem.getTotalSubmissions() <= 0) {
            return null;
        }
        double rate = (double) problem.getAcceptedSubmissions() / problem.getTotalSubmissions();
        return Math.round(rate * 10000.0) / 10000.0;
    }

    private static String readCapped(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return "";
        }
        try {
            String content = Files.readString(Path.of(filePath), StandardCharsets.UTF_8);
            return content.length() > MAX_SAMPLE_CHARS
                    ? content.substring(0, MAX_SAMPLE_CHARS) + "\n... [truncated]"
                    : content;
        } catch (Exception exception) {
            return "";
        }
    }

    private static Difficulty parseDifficulty(String value) {
        try {
            return Difficulty.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("difficulty must be one of EASY, MEDIUM, HARD");
        }
    }

    /** Page payload: items + pagination metadata. */
    public record PublicProblemPage(
            List<PublicProblemResponse> problems, PaginationMeta pagination) {
    }
}
