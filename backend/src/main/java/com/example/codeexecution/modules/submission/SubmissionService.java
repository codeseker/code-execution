package com.example.codeexecution.modules.submission;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.common.exceptions.ForbiddenException;
import com.example.codeexecution.common.exceptions.ResourceNotFoundException;
import com.example.codeexecution.modules.problem.ProblemRepository;
import com.example.codeexecution.modules.problem.TestCaseRepository;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.rbac.RbacService;
import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.dtos.JobMessage;
import com.example.codeexecution.modules.submission.dtos.SubmitRequest;
import com.example.codeexecution.modules.submission.dtos.SubmitResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResponse;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;
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

    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionQueueService queueService;
    private final SubmissionEventPublisher eventPublisher;
    private final RbacService rbacService;
    private final ExecutionProperties properties;
    private final DockerSandboxService sandbox;

    public SubmissionService(
            SubmissionRepository submissionRepository,
            SubmissionResultRepository resultRepository,
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            SubmissionQueueService queueService,
            SubmissionEventPublisher eventPublisher,
            RbacService rbacService,
            ExecutionProperties properties,
            DockerSandboxService sandbox) {
        this.submissionRepository = submissionRepository;
        this.resultRepository = resultRepository;
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.queueService = queueService;
        this.eventPublisher = eventPublisher;
        this.rbacService = rbacService;
        this.properties = properties;
        this.sandbox = sandbox;
    }

    /**
     * Creates a QUEUED submission and enqueues it.
     *
     * @param type EXAMPLE_EVAL (sample cases only) or FULL_SUBMISSION
     */
    public SubmitResponse submit(
            String problemId, SubmitRequest request, String userId, SubmissionType type) {

        Problem problem = findPublished(problemId);

        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new BadRequestException("code must not be blank");
        }
        if (request.getCode().length() > this.properties.getMaxCodeChars()) {
            throw new BadRequestException(
                    "code exceeds the maximum length of "
                            + this.properties.getMaxCodeChars() + " characters");
        }

        // Fail fast when the language has no container on this machine
        // (e.g. javascript is not provisioned yet).
        if (!this.sandbox.isRuntimeAvailable(request.getLanguage())) {
            throw new BadRequestException(
                    "Runtime '" + request.getLanguage()
                            + "' is not available on this server");
        }

        boolean isExample = type == SubmissionType.EXAMPLE_EVAL;
        long testCaseCount = this.testCaseRepository.findByProblemId(problem.getId()).stream()
                .filter(testCase -> !isExample || testCase.isSample())
                .count();
        if (testCaseCount == 0) {
            throw new BadRequestException(isExample
                    ? "This problem has no sample test cases to run"
                    : "This problem has no test cases yet");
        }

        Instant now = Instant.now();
        Submission submission = Submission.builder()
                .userId(userId)
                .problemId(problem.getId())
                .code(request.getCode())
                .language(request.getLanguage())
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
                request.getLanguage(),
                isExample);
        int queuePosition = this.queueService.enqueue(job);
        this.eventPublisher.publishQueued(job, queuePosition);

        return new SubmitResponse(
                submission.getId(),
                SubmissionStatus.QUEUED,
                queuePosition,
                request.getLanguage(),
                type);
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

        boolean includeIo = submission.getType() == SubmissionType.EXAMPLE_EVAL;
        var result = this.resultRepository.findBySubmissionId(submissionId).orElse(null);

        return SubmissionResponseMapper.toSubmissionResponse(submission, result, includeIo);
    }

    private Problem findPublished(String problemId) {
        return this.problemRepository.findById(problemId)
                .filter(problem -> !problem.isDeleted() && problem.isPublished())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Published problem not found: " + problemId));
    }
}
