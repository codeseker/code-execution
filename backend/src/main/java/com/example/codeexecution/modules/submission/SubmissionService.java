package com.example.codeexecution.modules.submission;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.common.exceptions.ForbiddenException;
import com.example.codeexecution.common.exceptions.ResourceNotFoundException;
import com.example.codeexecution.common.responses.PaginationMeta;
import com.example.codeexecution.modules.problem.ProblemRepository;
import com.example.codeexecution.modules.problem.TestCaseRepository;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.rbac.RbacService;
import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.dtos.JobMessage;
import com.example.codeexecution.modules.submission.dtos.RunRequest;
import com.example.codeexecution.modules.submission.dtos.SubmissionQueryDTO;
import com.example.codeexecution.modules.submission.dtos.SubmissionSummaryResponse;
import com.example.codeexecution.modules.submission.dtos.SubmitRequest;
import com.example.codeexecution.modules.submission.dtos.SubmitResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResponse;
import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;
import com.example.codeexecution.modules.submission.entities.Verdict;
import com.example.codeexecution.modules.submission.mapper.SubmissionResponseMapper;
import com.example.codeexecution.modules.submission.repositories.SubmissionRepository;
import com.example.codeexecution.modules.submission.repositories.SubmissionResultRepository;
import com.example.codeexecution.modules.submission.services.DockerSandboxService;
import com.example.codeexecution.modules.submission.services.SubmissionEventPublisher;
import com.example.codeexecution.modules.submission.services.SubmissionQueueService;

/**
 * Submission ingestion: validates against the problem, records the
 * {@link Submission} ledger row and pushes a lightweight job payload onto
 * the language-specific Redis queue. Execution itself happens entirely in
 * the workers.
 */
@Service
public class SubmissionService {

    private static final int MAX_LIMIT = 100;

    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionQueueService queueService;
    private final SubmissionEventPublisher eventPublisher;
    private final RbacService rbacService;
    private final ExecutionProperties properties;
    private final DockerSandboxService sandbox;
    private final MongoTemplate mongoTemplate;

    public SubmissionService(
            SubmissionRepository submissionRepository,
            SubmissionResultRepository resultRepository,
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            SubmissionQueueService queueService,
            SubmissionEventPublisher eventPublisher,
            RbacService rbacService,
            ExecutionProperties properties,
            DockerSandboxService sandbox,
            MongoTemplate mongoTemplate) {
        this.submissionRepository = submissionRepository;
        this.resultRepository = resultRepository;
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.queueService = queueService;
        this.eventPublisher = eventPublisher;
        this.rbacService = rbacService;
        this.properties = properties;
        this.sandbox = sandbox;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Creates a QUEUED submission and enqueues it.
     *
     * @param type EXAMPLE_EVAL (sample cases only) or FULL_SUBMISSION
     */
    public SubmitResponse submit(
            String problemId, SubmitRequest request, String userId, SubmissionType type) {

        Problem problem = findPublished(problemId);
        validateCode(request.getCode());
        requireRuntime(request.getLanguage());

        boolean isExample = type == SubmissionType.EXAMPLE_EVAL;
        long testCaseCount = this.testCaseRepository.findByProblemId(problem.getId()).stream()
                .filter(testCase -> !isExample || testCase.isSample())
                .count();
        if (testCaseCount == 0) {
            throw new BadRequestException(isExample
                    ? "This problem has no sample test cases to run"
                    : "This problem has no test cases yet");
        }

        return enqueue(problem, userId, request.getCode(), request.getLanguage(), type, null);
    }

    /**
     * The "Run" button: executes the caller's code against their own
     * stdin instead of the stored test cases. Architecturally identical
     * to an example evaluation (queue -> worker -> WebSocket), but the
     * worker has no expected output to compare against and none of the
     * statistics are touched.
     */
    public SubmitResponse run(String problemId, RunRequest request, String userId) {
        Problem problem = findPublished(problemId);
        validateCode(request.getCode());
        requireRuntime(request.getLanguage());

        String input = request.getInput() == null ? "" : request.getInput();
        if (input.length() > this.properties.getMaxInputChars()) {
            throw new BadRequestException(
                    "input exceeds the maximum length of "
                            + this.properties.getMaxInputChars() + " characters");
        }

        return enqueue(
                problem, userId, request.getCode(), request.getLanguage(),
                SubmissionType.CUSTOM_RUN, input);
    }

    /**
     * Shared back half of {@link #submit} and {@link #run}: records the
     * ledger row, pushes the lightweight job payload onto the language
     * queue and returns the QUEUED snapshot.
     */
    private SubmitResponse enqueue(
            Problem problem,
            String userId,
            String code,
            Language language,
            SubmissionType type,
            String customInput) {

        Instant now = Instant.now();
        Submission submission = Submission.builder()
                .userId(userId)
                .problemId(problem.getId())
                .code(code)
                .customInput(customInput)
                .language(language)
                .type(type)
                .status(SubmissionStatus.QUEUED)
                .createdAt(now)
                .updatedAt(now)
                .build();
        submission = this.submissionRepository.save(submission);

        JobMessage job = new JobMessage(
                submission.getId(),
                problem.getId(),
                userId,
                language,
                type == SubmissionType.EXAMPLE_EVAL);
        int queuePosition = this.queueService.enqueue(job);
        this.eventPublisher.publishQueued(job, queuePosition);

        return new SubmitResponse(
                submission.getId(),
                SubmissionStatus.QUEUED,
                queuePosition,
                language,
                type);
    }

    private void validateCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("code must not be blank");
        }
        if (code.length() > this.properties.getMaxCodeChars()) {
            throw new BadRequestException(
                    "code exceeds the maximum length of "
                            + this.properties.getMaxCodeChars() + " characters");
        }
    }

    /**
     * Fail fast when the language has no container on this machine
     * (e.g. javascript is not provisioned yet).
     */
    private void requireRuntime(Language language) {
        if (!this.sandbox.isRuntimeAvailable(language)) {
            throw new BadRequestException(
                    "Runtime '" + language + "' is not available on this server");
        }
    }

    /**
     * Submission + result lookup. Owners always see their own; anyone
     * holding {@code submission:read} (admin) may look up any.
     */
    public SubmissionResponse get(String submissionId, String userId) {
        Submission submission = this.submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Submission not found: " + submissionId));

        if (!submission.getUserId().equals(userId)) {
            // Throws 403 unless the caller holds submission:read.
            this.rbacService.checkPermission(userId, "submission:read");
        }

        boolean includeIo = submission.getType().exposesIo();
        var result = this.resultRepository.findBySubmissionId(submissionId).orElse(null);

        return SubmissionResponseMapper.toSubmissionResponse(submission, result, includeIo);
    }

    /**
     * Paginated history of the caller's own submissions, newest first.
     * Only ever looks at {@code userId}'s rows - there is no cross-user
     * lookup here, so no permission check is needed.
     */
    public SubmissionPage listMine(String userId, SubmissionQueryDTO query) {
        int page = Math.max(1, query.getPage());
        int limit = Math.min(MAX_LIMIT, Math.max(1, query.getLimit()));

        List<Criteria> conditions = new ArrayList<>();
        conditions.add(Criteria.where("userId").is(userId));

        if (query.getProblemId() != null && !query.getProblemId().isBlank()) {
            conditions.add(Criteria.where("problemId").is(query.getProblemId().trim()));
        }
        if (query.getStatus() != null && !query.getStatus().isBlank()) {
            conditions.add(Criteria.where("status").is(parseStatus(query.getStatus())));
        }
        if (query.getLanguage() != null && !query.getLanguage().isBlank()) {
            conditions.add(Criteria.where("language").is(parseLanguage(query.getLanguage())));
        }
        if (query.getType() != null && !query.getType().isBlank()) {
            conditions.add(Criteria.where("type").is(parseType(query.getType())));
        }

        Criteria criteria = new Criteria().andOperator(conditions.toArray(new Criteria[0]));

        long total = this.mongoTemplate.count(Query.query(criteria), Submission.class);
        List<Submission> submissions = this.mongoTemplate.find(
                Query.query(criteria)
                        .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                        .skip((long) (page - 1) * limit)
                        .limit(limit),
                Submission.class);

        // One batch lookup for the whole page instead of N+1 reads.
        Map<String, Verdict> verdicts = submissions.isEmpty()
                ? Map.of()
                : this.resultRepository.findBySubmissionIdIn(submissions.stream()
                        .map(Submission::getId)
                        .toList()).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                result -> result.getSubmissionId(),
                                result -> result.getOverallVerdict(),
                                (first, second) -> first));

        List<SubmissionSummaryResponse> items = submissions.stream()
                .map(submission -> SubmissionResponseMapper.toSummary(
                        submission, verdicts.get(submission.getId())))
                .toList();

        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / limit);
        return new SubmissionPage(items, new PaginationMeta(page, limit, total, totalPages));
    }

    private static SubmissionStatus parseStatus(String value) {
        try {
            return SubmissionStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "status must be one of QUEUED, PROCESSING, COMPLETED, FAILED");
        }
    }

    private static Language parseLanguage(String value) {
        try {
            // Language constants are lowercase (cpp, java, ...) so the
            // query param is normalised before the lookup.
            return Language.valueOf(value.trim().toLowerCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "language must be one of cpp, java, python, javascript");
        }
    }

    private static SubmissionType parseType(String value) {
        try {
            return SubmissionType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "type must be one of EXAMPLE_EVAL, FULL_SUBMISSION, CUSTOM_RUN");
        }
    }

    /** Page payload for {@code GET /users/me/submissions}. */
    public record SubmissionPage(
            List<SubmissionSummaryResponse> submissions,
            PaginationMeta pagination) {
    }

    private Problem findPublished(String problemId) {
        return this.problemRepository.findById(problemId)
                .filter(problem -> !problem.isDeleted() && problem.isPublished())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Published problem not found: " + problemId));
    }
}
