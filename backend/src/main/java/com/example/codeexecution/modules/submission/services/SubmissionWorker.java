package com.example.codeexecution.modules.submission.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.example.codeexecution.common.exceptions.DockerSandboxException;
import com.example.codeexecution.modules.problem.ProblemRepository;
import com.example.codeexecution.modules.problem.TestCaseRepository;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.problem.services.ProblemStatsService;
import com.example.codeexecution.modules.stats.UserProblemStatService;
import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.dtos.JobMessage;
import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionResult;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;
import com.example.codeexecution.modules.submission.entities.TestCaseResult;
import com.example.codeexecution.modules.submission.entities.Verdict;
import com.example.codeexecution.modules.submission.repositories.SubmissionRepository;
import com.example.codeexecution.modules.submission.repositories.SubmissionResultRepository;
import com.example.codeexecution.modules.submission.services.DockerSandboxService.CompileOutcome;
import com.example.codeexecution.modules.submission.services.DockerSandboxService.RunOutcome;

import jakarta.annotation.PreDestroy;

/**
 * In-app queue workers: one polling thread per language ({@code queue:cpp},
 * {@code queue:java}, {@code queue:python}, {@code queue:javascript}) so a
 * slow runtime can never starve a fast one.
 *
 * Job pickup follows the "lightweight payload" rule - the Redis message
 * only carries ids; the worker fetches the source code from Mongo and the
 * testcase files from disk, runs them in Docker sandboxes, writes the
 * {@link SubmissionResult} and pushes the matching WebSocket event.
 */
@Component
public class SubmissionWorker {

    private static final Logger log = LoggerFactory.getLogger(SubmissionWorker.class);

    /** Fallback limits when the problem carries no test cases to inherit from. */
    private static final int DEFAULT_TIME_LIMIT_MS = 1000;
    private static final int DEFAULT_MEMORY_LIMIT_KB = 256000;

    /** Synthetic testcase id reported for a custom-input run row. */
    private static final String CUSTOM_INPUT_CASE_ID = "custom-input";

    private final SubmissionQueueService queueService;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final DockerSandboxService sandbox;
    private final SubmissionEventPublisher eventPublisher;
    private final UserProblemStatService statService;
    private final ProblemStatsService problemStatsService;
    private final ExecutionProperties properties;

    private final List<Thread> threads = new ArrayList<>();
    private volatile boolean running;

    public SubmissionWorker(
            SubmissionQueueService queueService,
            SubmissionRepository submissionRepository,
            SubmissionResultRepository resultRepository,
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            DockerSandboxService sandbox,
            SubmissionEventPublisher eventPublisher,
            UserProblemStatService statService,
            ProblemStatsService problemStatsService,
            ExecutionProperties properties) {
        this.queueService = queueService;
        this.submissionRepository = submissionRepository;
        this.resultRepository = resultRepository;
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.sandbox = sandbox;
        this.eventPublisher = eventPublisher;
        this.statService = statService;
        this.problemStatsService = problemStatsService;
        this.properties = properties;
    }

    /** Starts one worker thread per language once the app is ready. */
    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!this.properties.isWorkersEnabled() || this.running) {
            return;
        }
        this.running = true;
        for (Language language : Language.values()) {
            Thread thread = new Thread(() -> loop(language),
                    "judge-worker-" + language.name());
            thread.setDaemon(true);
            thread.start();
            this.threads.add(thread);
        }
        log.info("Started {} judge worker threads (queues: {})",
                this.threads.size(), this.properties.getQueuePrefix() + "*");
    }

    @PreDestroy
    public void stop() {
        this.running = false;
        this.threads.forEach(Thread::interrupt);
    }

    private void loop(Language language) {
        long idleMillis = this.properties.getWorkerPollIntervalMs();
        while (this.running && !Thread.currentThread().isInterrupted()) {
            try {
                JobMessage job = this.queueService.poll(language);
                if (job == null) {
                    Thread.sleep(idleMillis); // idle: keep the shared Redis connection free
                    continue;
                }
                process(job);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception exception) {
                log.error("Worker {} crashed on a job: {}", language, exception.getMessage());
                try {
                    Thread.sleep(1000); // back off instead of hot-looping
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    /** Full lifecycle of one job: PROCESSING -> verdict -> COMPLETED/FAILED. */
    private void process(JobMessage job) {
        Submission submission = this.submissionRepository.findById(job.submissionId()).orElse(null);
        if (submission == null) {
            log.warn("Dropping job for missing submission {}", job.submissionId());
            return;
        }

        submission.setStatus(SubmissionStatus.PROCESSING);
        submission.setUpdatedAt(Instant.now());
        this.submissionRepository.save(submission);
        this.eventPublisher.publishProcessing(submission.getId());

        try {
            evaluate(submission, job);
        } catch (Exception exception) {
            log.error("Submission {} failed", submission.getId(), exception);
            fail(submission, exception.getMessage());
        } finally {
            this.sandbox.cleanup(submission.getId());
        }
    }

    private void evaluate(Submission submission, JobMessage job) {
        Problem problem = this.problemRepository.findById(job.problemId())
                .filter(found -> !found.isDeleted())
                .orElseThrow(() -> new IllegalStateException("Problem no longer exists"));

        boolean isExample = submission.getType() == SubmissionType.EXAMPLE_EVAL;
        if (!problem.isPublished()) {
            throw new IllegalStateException("Problem is not published");
        }

        // "Run" button: no stored test cases, no comparison, no stats.
        if (submission.getType() == SubmissionType.CUSTOM_RUN) {
            evaluateCustomRun(submission, problem);
            return;
        }

        List<TestCase> testCases = this.testCaseRepository.findByProblemId(problem.getId()).stream()
                .filter(testCase -> !isExample || testCase.isSample())
                .sorted(Comparator.comparing(TestCase::getId))
                .toList();
        if (testCases.isEmpty()) {
            throw new IllegalStateException(
                    isExample ? "Problem has no sample test cases" : "Problem has no test cases");
        }

        // Phase 1: compile (interpreted languages short-circuit to success).
        CompileOutcome compile = this.sandbox.compile(
                submission.getId(), submission.getLanguage(), submission.getCode());
        if (!compile.success()) {
            finish(submission, buildResult(submission, Verdict.COMPILE_ERROR,
                    0, 0, 0, 0, compile.errorLogs(), List.of()));
            return;
        }

        // Phase 2: one fresh sandbox per testcase.
        List<TestCaseResult> rows = new ArrayList<>();
        int passed = 0;
        long totalMs = 0;
        long peakKb = 0;
        Verdict firstFailure = null;
        int index = 0;

        for (TestCase testCase : testCases) {
            index++;
            RunOutcome outcome = this.sandbox.runTestCase(
                    submission.getId(),
                    submission.getLanguage(),
                    testCase.getInputFilePath(),
                    testCase.getTimeLimitMs(),
                    testCase.getMemoryLimitKb());

            Verdict verdict = grade(testCase, outcome, isExample);
            rows.add(toRow(testCase, outcome, verdict, isExample));

            if (verdict == Verdict.ACCEPTED) {
                passed++;
            } else if (firstFailure == null) {
                firstFailure = verdict;
            }
            totalMs += outcome.elapsedMs();
            peakKb = Math.max(peakKb, outcome.memoryUsedKb());

            this.eventPublisher.publishProgress(
                    submission.getId(), passed, index, testCases.size(), verdict.name());
        }

        Verdict overall = firstFailure == null ? Verdict.ACCEPTED : firstFailure;
        finish(submission, buildResult(
                submission, overall, passed, testCases.size(), totalMs, peakKb, null, rows));
    }

    /**
     * Custom-input run: compile, feed the caller's own stdin to the
     * program and report what came out. With no expected output the
     * verdict can only describe execution itself, so WRONG_ANSWER is
     * impossible and statistics stay untouched.
     */
    private void evaluateCustomRun(Submission submission, Problem problem) {
        CompileOutcome compile = this.sandbox.compile(
                submission.getId(), submission.getLanguage(), submission.getCode());
        if (!compile.success()) {
            finish(submission, buildResult(submission, Verdict.COMPILE_ERROR,
                    0, 0, 0, 0, compile.errorLogs(), List.of()));
            return;
        }

        Path input = writeCustomInput(submission);
        RunOutcome outcome = this.sandbox.runTestCase(
                submission.getId(),
                submission.getLanguage(),
                input.toString(),
                problemTimeLimitMs(problem),
                problemMemoryLimitKb(problem));

        Verdict verdict = runVerdict(outcome);
        boolean accepted = verdict == Verdict.ACCEPTED;

        TestCaseResult row = TestCaseResult.builder()
                .testCaseId(CUSTOM_INPUT_CASE_ID)
                .status(verdict)
                .executionTimeMs(outcome.elapsedMs())
                .memoryUsedKb(outcome.memoryUsedKb())
                .stdout(truncateIo(outcome.stdout()))
                .stderr(truncateIo(outcome.stderr()))
                .expectedOutput(null)
                .actualOutput(accepted ? truncateIo(outcome.stdout()) : null)
                .build();

        finish(submission, buildResult(
                submission, verdict,
                accepted ? 1 : 0, 1,
                outcome.elapsedMs(), outcome.memoryUsedKb(), null, List.of(row)));
    }

    /** Writes the caller's stdin into the submission's host work dir. */
    private Path writeCustomInput(Submission submission) {
        try {
            Path dir = this.sandbox.workDirFor(submission.getId());
            Files.createDirectories(dir);
            Path input = dir.resolve("custom.in");
            Files.writeString(
                    input,
                    submission.getCustomInput() == null ? "" : submission.getCustomInput(),
                    StandardCharsets.UTF_8);
            return input;
        } catch (IOException exception) {
            throw new DockerSandboxException("Could not stage custom input", exception);
        }
    }

    /** Same matrix as {@link #grade} minus WRONG_ANSWER (nothing to compare). */
    private Verdict runVerdict(RunOutcome outcome) {
        if (outcome.timedOut()) {
            return Verdict.TIME_LIMIT_EXCEEDED;
        }
        if (outcome.oomKilled()) {
            return Verdict.MEMORY_LIMIT_EXCEEDED;
        }
        if (outcome.exitCode() != 0) {
            return Verdict.RUNTIME_ERROR;
        }
        return Verdict.ACCEPTED;
    }

    /** Loosest limit across the problem's test cases (defaults when none). */
    private int problemTimeLimitMs(Problem problem) {
        return this.testCaseRepository.findByProblemId(problem.getId()).stream()
                .mapToInt(TestCase::getTimeLimitMs)
                .max()
                .orElse(DEFAULT_TIME_LIMIT_MS);
    }

    private long problemMemoryLimitKb(Problem problem) {
        return this.testCaseRepository.findByProblemId(problem.getId()).stream()
                .mapToLong(TestCase::getMemoryLimitKb)
                .max()
                .orElse(DEFAULT_MEMORY_LIMIT_KB);
    }

    /** Maps one raw container outcome onto the verdict matrix. */
    private Verdict grade(TestCase testCase, RunOutcome outcome, boolean includeIo) {
        if (outcome.timedOut()) {
            return Verdict.TIME_LIMIT_EXCEEDED;
        }
        if (outcome.oomKilled()) {
            return Verdict.MEMORY_LIMIT_EXCEEDED;
        }
        if (outcome.exitCode() != 0) {
            return Verdict.RUNTIME_ERROR;
        }
        String expected = readExpectedOutput(testCase);
        return OutputComparator.matches(expected, outcome.stdout())
                ? Verdict.ACCEPTED
                : Verdict.WRONG_ANSWER;
    }

    private TestCaseResult toRow(
            TestCase testCase, RunOutcome outcome, Verdict verdict, boolean includeIo) {
        boolean runnable = !outcome.timedOut();
        Verdict status = verdict;
        String stdout = includeIo ? truncateIo(outcome.stdout()) : null;
        String stderr = includeIo ? truncateIo(outcome.stderr()) : null;
        String expected = includeIo ? truncateIo(safeExpected(testCase)) : null;
        String actual = includeIo && runnable ? stdout : null;

        return TestCaseResult.builder()
                .testCaseId(testCase.getId())
                .status(status)
                .executionTimeMs(outcome.elapsedMs())
                .memoryUsedKb(outcome.memoryUsedKb())
                .stdout(stdout)
                .stderr(stderr)
                .expectedOutput(expected)
                .actualOutput(actual)
                .build();
    }

    private String safeExpected(TestCase testCase) {
        try {
            return readExpectedOutput(testCase);
        } catch (RuntimeException exception) {
            return "";
        }
    }

    private String readExpectedOutput(TestCase testCase) {
        try {
            java.nio.file.Path path = java.nio.file.Path.of(testCase.getOutputFilePath());
            return java.nio.file.Files.readString(path, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new DockerSandboxException(
                    "Expected output file unreadable for testcase " + testCase.getId(), exception);
        }
    }

    private String truncateIo(String value) {
        int max = this.properties.getIoTruncateChars();
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max) + "\n... [truncated]";
    }

    private SubmissionResult buildResult(
            Submission submission,
            Verdict verdict,
            int passed,
            int total,
            long totalMs,
            long peakKb,
            String compileErrorLogs,
            List<TestCaseResult> rows) {
        return SubmissionResult.builder()
                .submissionId(submission.getId())
                .overallVerdict(verdict)
                .totalExecutionTimeMs(totalMs)
                .peakMemoryKb(peakKb)
                .passedTestCases(passed)
                .totalTestCases(total)
                .compileErrorLogs(compileErrorLogs)
                .testCaseResults(rows)
                .createdAt(Instant.now())
                .build();
    }

    /** Persists the result, marks COMPLETED and pushes JOB_COMPLETED. */
    private void finish(Submission submission, SubmissionResult result) {
        this.resultRepository.save(result);

        submission.setStatus(SubmissionStatus.COMPLETED);
        submission.setUpdatedAt(Instant.now());
        this.submissionRepository.save(submission);

        boolean includeIo = submission.getType().exposesIo();
        this.eventPublisher.publishCompleted(submission.getId(), result, includeIo);

        if (submission.getType() == SubmissionType.FULL_SUBMISSION) {
            this.statService.recordSubmission(submission.getUserId());
            boolean accepted = result.getOverallVerdict() == Verdict.ACCEPTED;
            if (accepted) {
                this.statService.recordAccepted(
                        submission.getUserId(), submission.getProblemId());
            }
            // Per-problem acceptance counters shown in the listings.
            this.problemStatsService.recordJudged(submission.getProblemId(), accepted);
        }
    }

    /** Unrecoverable failure: FAILED status + SYSTEM_ERROR result + JOB_FAILED. */
    private void fail(Submission submission, String message) {
        try {
            SubmissionResult result = buildResult(
                    submission, Verdict.SYSTEM_ERROR, 0, 0, 0, 0,
                    message == null ? null : message, List.of());
            this.resultRepository.save(result);
        } catch (Exception exception) {
            log.error("Could not persist SYSTEM_ERROR result for {}",
                    submission.getId(), exception);
        }
        submission.setStatus(SubmissionStatus.FAILED);
        submission.setUpdatedAt(Instant.now());
        this.submissionRepository.save(submission);
        this.eventPublisher.publishFailed(submission.getId(), message);
    }
}
