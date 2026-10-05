package com.example.codeexecution.modules.problem;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.common.exceptions.ResourceNotFoundException;
import com.example.codeexecution.common.responses.PaginationMeta;
import com.example.codeexecution.modules.problem.dtos.CreateProblemDTO;
import com.example.codeexecution.modules.problem.dtos.ProblemQueryDTO;
import com.example.codeexecution.modules.problem.dtos.UpdateProblemDTO;
import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.ProblemPageResponse;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.ProblemDetailsResponse;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.ProblemResponse;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.TestCaseResponse;
import com.example.codeexecution.modules.problem.services.SlugService;
import com.example.codeexecution.modules.problem.services.TestCaseStorageService;
import com.example.codeexecution.modules.problem.services.TestCaseStorageService.StoredFiles;

/**
 * CRUD for the Problem Management module under {@code /admin/problems}.
 *
 * - Slugs are generated once from the title and never change, so external
 *   links stay stable.
 * - Deletes are soft ({@code isDeleted}); test cases and their files are
 *   kept for history.
 * - The list endpoint supports pagination, free-text search, difficulty
 *   and tag filters.
 */
@Service
public class ProblemService {

    private static final int MAX_LIMIT = 100;

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final MongoTemplate mongoTemplate;
    private final SlugService slugService;
    private final TestCaseStorageService storageService;

    public ProblemService(
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            MongoTemplate mongoTemplate,
            SlugService slugService,
            TestCaseStorageService storageService) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.mongoTemplate = mongoTemplate;
        this.slugService = slugService;
        this.storageService = storageService;
    }

    /** Creates a problem shell with a unique slug; test cases are added later. */
    public ProblemResponse create(CreateProblemDTO request, String userId) {
        String slug = uniqueSlug(request.getTitle());

        Instant now = Instant.now();
        Problem problem = Problem.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .description(request.getDescription())
                .problemStatement(request.getProblemStatement())
                .difficulty(request.getDifficulty())
                .tags(normalizeTags(request.getTags()))
                .testCases(new ArrayList<>())
                .createdBy(userId)
                .isPublished(Boolean.TRUE.equals(request.getIsPublished()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        Problem saved = this.problemRepository.save(problem);
        return ProblemResponseMapper.toProblemResponse(saved, 0);
    }

    /** Paginated list of non-deleted problems with optional filters. */
    public ProblemPageResponse list(ProblemQueryDTO query) {
        int page = Math.max(1, query.getPage());
        int limit = Math.min(MAX_LIMIT, Math.max(1, query.getLimit()));

        List<Criteria> conditions = new ArrayList<>();
        conditions.add(Criteria.where("isDeleted").is(false));

        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            String pattern = java.util.regex.Pattern.quote(query.getSearch().trim());
            conditions.add(new Criteria().orOperator(
                    Criteria.where("title").regex(pattern, "i"),
                    Criteria.where("description").regex(pattern, "i"),
                    Criteria.where("slug").regex(pattern, "i")));
        }

        if (query.getDifficulty() != null && !query.getDifficulty().isBlank()) {
            conditions.add(Criteria.where("difficulty").is(parseDifficulty(query.getDifficulty())));
        }

        if (query.getTag() != null && !query.getTag().isBlank()) {
            conditions.add(Criteria.where("tags").is(query.getTag().trim()));
        }

        Criteria criteria = new Criteria().andOperator(conditions.toArray(new Criteria[0]));

        long total = this.mongoTemplate.count(Query.query(criteria), Problem.class);
        List<Problem> problems = this.mongoTemplate.find(
                Query.query(criteria)
                        .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                        .skip((long) (page - 1) * limit)
                        .limit(limit),
                Problem.class);

        List<ProblemResponse> items = problems.stream()
                .map(problem -> ProblemResponseMapper.toProblemResponse(
                        problem, problem.getTestCases() == null ? 0 : problem.getTestCases().size()))
                .toList();

        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / limit);
        return new ProblemPageResponse(
                items,
                new PaginationMeta(page, limit, total, totalPages));
    }

    /** Full problem detail including its test cases. */
    public ProblemDetailsResponse get(String id) {
        Problem problem = findActive(id);
        List<TestCase> testCases = this.testCaseRepository.findByProblemId(problem.getId());
        return new ProblemDetailsResponse(
                ProblemResponseMapper.toProblemResponse(
                        problem, testCases.size()),
                ProblemResponseMapper.toTestCaseResponses(testCases));
    }

    /**
     * Updates metadata and the statement. The slug is intentionally not
     * touched (stable URLs); publishing is left as-is unless explicitly
     * provided.
     */
    public ProblemResponse update(String id, UpdateProblemDTO request) {
        Problem problem = findActive(id);

        problem.setTitle(request.getTitle().trim());
        problem.setDescription(request.getDescription());
        problem.setProblemStatement(request.getProblemStatement());
        problem.setDifficulty(request.getDifficulty());
        problem.setTags(normalizeTags(request.getTags()));
        if (request.getIsPublished() != null) {
            problem.setPublished(request.getIsPublished());
        }
        problem.setUpdatedAt(Instant.now());

        Problem saved = this.problemRepository.save(problem);
        long testCaseCount = this.testCaseRepository.countByProblemId(saved.getId());
        return ProblemResponseMapper.toProblemResponse(saved, testCaseCount);
    }

    /** Soft-deletes the problem; test cases and files are kept. */
    public void delete(String id) {
        Problem problem = findActive(id);
        problem.setDeleted(true);
        problem.setUpdatedAt(Instant.now());
        this.problemRepository.save(problem);
    }

    /** Uploads one input/output pair and links it to the problem. */
    public TestCaseResponse addTestCase(
            String problemId,
            MultipartFile input,
            MultipartFile output,
            boolean isSample,
            Integer timeLimitMs,
            Integer memoryLimitKb,
            String explanation) {

        Problem problem = findActive(problemId);

        StoredFiles files = this.storageService.save(problem.getId(), input, output);

        TestCase testCase = TestCase.builder()
                .problemId(problem.getId())
                .inputFilePath(files.inputFilePath())
                .outputFilePath(files.outputFilePath())
                .isSample(isSample)
                .timeLimitMs(timeLimitMs == null ? 1000 : timeLimitMs)
                .memoryLimitKb(memoryLimitKb == null ? 256000 : memoryLimitKb)
                .explanation(explanation == null || explanation.isBlank()
                        ? null
                        : explanation.trim())
                .build();

        TestCase saved = this.testCaseRepository.save(testCase);

        if (problem.getTestCases() == null) {
            problem.setTestCases(new ArrayList<>());
        }
        problem.getTestCases().add(saved.getId());
        problem.setUpdatedAt(Instant.now());
        this.problemRepository.save(problem);

        return ProblemResponseMapper.toTestCaseResponse(saved);
    }

    /** Removes a testcase document and its files from disk. */
    public void deleteTestCase(String problemId, String testCaseId) {
        Problem problem = findActive(problemId);

        TestCase testCase = this.testCaseRepository.findById(testCaseId)
                .filter(found -> found.getProblemId().equals(problem.getId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Testcase " + testCaseId + " not found for this problem"));

        this.testCaseRepository.deleteById(testCase.getId());
        this.storageService.delete(testCase.getInputFilePath(), testCase.getOutputFilePath());

        if (problem.getTestCases() != null) {
            problem.getTestCases().remove(testCase.getId());
        }
        problem.setUpdatedAt(Instant.now());
        this.problemRepository.save(problem);
    }

    private Problem findActive(String id) {
        return this.problemRepository.findById(id)
                .filter(problem -> !problem.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found: " + id));
    }

    /** Appends -2, -3, ... until the slug is free (uniqueness index backstops races). */
    private String uniqueSlug(String title) {
        String base = this.slugService.slugify(title);
        String candidate = base;
        int suffix = 2;

        while (this.problemRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private static Difficulty parseDifficulty(String value) {
        try {
            return Difficulty.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "difficulty must be one of EASY, MEDIUM, HARD");
        }
    }

    /** Trims, drops blanks and de-duplicates while preserving order. */
    private static List<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        return new ArrayList<>(new LinkedHashSet<>(tags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .toList()));
    }
}
