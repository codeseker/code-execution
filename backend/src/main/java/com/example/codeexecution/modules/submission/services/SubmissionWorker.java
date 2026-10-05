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
import com.example.codeexecution.modules.submission.entities.CustomTestCaseInput;
import com.example.codeexecution.modules.submission.entities.JudgeCaseKind;
import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionResult;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;
import com.example.codeexecution.modules.submission.entities.TestCaseResult;
import com.example.codeexecution.modules.submission.entities.Verdict;
import com.example.codeexecution.modules.submission.repositories.SubmissionRepository;
import com.example.codeexecution.modules.submission.repositories.SubmissionResultRepository;
import com.example.codeexecution.modules.submission.services.CaseJudge.CaseOutcome;
import com.example.codeexecution.modules.submission.services.DockerSandboxService.CompileOutcome;

import jakarta.annotation.PreDestroy;

/**
 * In-app queue workers: one polling thread per language ({@code queue:cpp},
 * {@code queue:java}, {@code queue:python}, {@code queue:javascript}) so a
 * slow runtime can never starve a fast one.
 *
 * Job pickup follows the "lightweight payload" rule - the Redis message
 * only carries ids; the worker fetches the source code from Mongo and the
 * testcase files from disk, runs them in Docker sandboxes, writes the
 * {@link SubmissionResult} and pushes the matching WebSocket events.
 *
 * <p><b>One judge loop for every run type.</b> Run, example-eval and submit
 * differ only in the {@link JudgeCase} plan built by {@link #buildPlan} and in
 * how much IO each case may expose; execution and comparison always go
 * through {@link CaseJudge}, so the paths cannot drift apart.
 */
@Component
public class SubmissionWorker {

    private static final Logger log = LoggerFactory.getLogger(SubmissionWorker.class);

    /** Fallback limits when the problem carries no test cases to inherit from. */
    private static final int DEFAULT_TIME_LIMIT_MS = 1000;
    private static final int DEFAULT_MEMORY_LIMIT_KB = 256000;

    private final SubmissionQueueService queueService;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final DockerSandboxService sandbox;
    private final CaseJudge caseJudge;
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
            CaseJudge caseJudge,
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
        this.caseJudge = caseJudge;
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

    /**
     * Full lifecycle of one job: PROCESSING -&gt; verdict -&gt;
     * COMPLETED/FAILED. Package-private so tests can drive a whole job
     * without a queue.
     */
    void process(JobMessage job) {
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

    /**
     * Builds the run plan, compiles, then judges every case in order through
     * {@link CaseJudge}, publishing one event per case as it lands.
     */
    private void evaluate(Submission submission, JobMessage job) {
        Problem problem = this.problemRepository.findById(job.problemId())
                .filter(found -> !found.isDeleted())
                .orElseThrow(() -> new IllegalStateException("Problem no longer exists"));
        if (!problem.isPublished()) {
            throw new IllegalStateException("Problem is not published");
        }

        // One run == one submission id, so the run id doubles as the
        // submission id: every run event is tagged with it and a stale frame
        // from an earlier run can never be mistaken for this one.
        String runId = submission.getId();

        List<JudgeCase> plan = buildPlan(submission, problem);
        int total = plan.size();
        this.eventPublisher.publishRunStarted(submission.getId(), runId, total);

        // Phase 1: compile (interpreted languages short-circuit to success).
        CompileOutcome compile = this.sandbox.compile(
                submission.getId(), submission.getLanguage(), submission.getCode());
        if (!compile.success()) {
            log.info("Submission {} compile failed: {}", submission.getId(), compile.errorLogs());
            // Compile errors short-circuit: one terminal event, no case results.
            // totalCount is 0 because no case was ever judged.
            this.eventPublisher.publishRunFinished(
                    submission.getId(), runId, Verdict.COMPILE_ERROR,
                    0, 0, null, 0, 0, compile.errorLogs());
            finish(submission, buildResult(submission, Verdict.COMPILE_ERROR,
                    0, 0, 0, 0, compile.errorLogs(), null, List.of()));
            return;
        }

        // Phase 2: one fresh sandbox exec per case, streamed as it completes.
        List<TestCaseResult> rows = new ArrayList<>();
        int passed = 0;
        long totalMs = 0;
        long peakKb = 0;
        Verdict firstFailure = null;
        Integer failedIndex = null;
        long deadline = System.nanoTime()
                + this.properties.getJobTimeoutMs() * 1_000_000L;

        for (JudgeCase testCase : plan) {
            if (System.nanoTime() > deadline) {
                // Overall budget exhausted: end the stream instead of leaving
                // the client spinning on an unterminated run.
                String reason = "Run exceeded the overall judge budget of "
                        + this.properties.getJobTimeoutMs() + " ms";
                log.warn("Submission {} hit the overall run timeout after {} cases: {}",
                        submission.getId(), rows.size(), reason);
                this.eventPublisher.publishRunFinished(
                        submission.getId(), runId, Verdict.SYSTEM_ERROR,
                        passed, total, failedIndex, totalMs, peakKb, reason);
                finish(submission, buildResult(submission, Verdict.SYSTEM_ERROR,
                        passed, total, totalMs, peakKb, reason, failedIndex, rows));
                return;
            }

            CaseOutcome outcome = this.caseJudge.judge(
                    submission.getId(), submission.getLanguage(), testCase);

            rows.add(toRow(outcome));
            if (outcome.verdict() == Verdict.ACCEPTED) {
                passed++;
            } else if (firstFailure == null) {
                firstFailure = outcome.verdict();
                failedIndex = testCase.caseIndex();
            }
            totalMs += outcome.runtimeMs();
            peakKb = Math.max(peakKb, outcome.memoryKb());

            // Stream this case before moving on, so the UI can light up the
            // matching testcase tab immediately.
            this.eventPublisher.publishCaseResult(submission.getId(), runId, outcome);
            this.eventPublisher.publishProgress(
                    submission.getId(), passed, rows.size(), total, outcome.verdict().name());

            if (outcome.verdict() != Verdict.ACCEPTED
                    && submission.getType().stopsAtFirstFailure()) {
                log.info("Submission {} stopped at case {} of {} with {}",
                        submission.getId(), testCase.caseIndex(), total, outcome.verdict());
                break;
            }
        }

        Verdict overall = firstFailure == null ? Verdict.ACCEPTED : firstFailure;
        this.eventPublisher.publishRunFinished(
                submission.getId(), runId, overall, passed, total,
                failedIndex, totalMs, peakKb, null);
        finish(submission, buildResult(
                submission, overall, passed, total, totalMs, peakKb, null, failedIndex, rows));
    }

    /**
     * The judge plan for one run. Sample cases always come from the problem's
     * own stored test cases - never from the request - so a client can neither
     * override, inject nor reorder them. The only client-influenced entries
     * are the custom cases a Run or an example-eval may add.
     *
     * <ul>
     *   <li>{@code EXAMPLE_EVAL} - the public sample cases, in storage order,
     *       then the caller's custom cases.</li>
     *   <li>{@code CUSTOM_RUN} - the same samples, then the caller's custom
     *       cases in the order they were sent.</li>
     *   <li>{@code FULL_SUBMISSION} - every stored case (samples and hidden).</li>
     * </ul>
     */
    private List<JudgeCase> buildPlan(Submission submission, Problem problem) {
        boolean fullSubmission = submission.getType() == SubmissionType.FULL_SUBMISSION;
        List<TestCase> stored = this.testCaseRepository.findByProblemId(problem.getId()).stream()
                .filter(testCase -> fullSubmission || testCase.isSample())
                .sorted(Comparator.comparing(TestCase::getId))
                .toList();

        List<JudgeCase> plan = new ArrayList<>();
        int index = 0;
        for (TestCase testCase : stored) {
            plan.add(new JudgeCase(
                    ++index,
                    testCase.getId(),
                    testCase.isSample() ? JudgeCaseKind.SAMPLE : JudgeCaseKind.HIDDEN,
                    Path.of(testCase.getInputFilePath()).toAbsolutePath(),
                    Path.of(testCase.getOutputFilePath()).toAbsolutePath(),
                    testCase.getTimeLimitMs(),
                    testCase.getMemoryLimitKb()));
        }

        if (submission.getType() == SubmissionType.CUSTOM_RUN
                || submission.getType() == SubmissionType.EXAMPLE_EVAL) {
            plan.addAll(customPlan(submission, index, problem));
        }

        if (plan.isEmpty()) {
            throw new IllegalStateException(fullSubmission
                    ? "Problem has no test cases"
                    : "Problem has no sample test cases");
        }
        return plan;
    }

    /**
     * Stages the caller's own test cases into the submission work dir and
     * appends them to the plan, in the order they were sent - so
     * {@code custom-N} lines up with the caller's "Custom N" tab.
     *
     * <p>A case that carries an expected output also gets a {@code .out} file
     * and is graded normally by {@link CaseJudge} (it can be WRONG_ANSWER).
     * A case without one is only executed, so its verdict can never be a
     * mismatch. Blank inputs are dropped; leftover ids are never reused.
     *
     * <p>Only {@link Submission#getCustomTestcases()} is read. The legacy
     * {@code customInput} field is deliberately ignored: a single client
     * supplied stdin must never be able to stand in for a stored sample.
     */
    private List<JudgeCase> customPlan(Submission submission, int alreadyIndexed, Problem problem) {
        List<CustomTestCaseInput> inputs = new ArrayList<>();
        if (submission.getCustomTestcases() != null) {
            for (CustomTestCaseInput input : submission.getCustomTestcases()) {
                if (input != null && input.input() != null && !input.input().isBlank()) {
                    inputs.add(input);
                }
            }
        }
        if (inputs.isEmpty()) {
            return List.of();
        }

        Path dir = this.sandbox.workDirFor(submission.getId());
        int max = this.properties.getMaxCustomTestCases();
        int timeLimitMs = problemTimeLimitMs(problem);
        long memoryLimitKb = problemMemoryLimitKb(problem);
        List<JudgeCase> cases = new ArrayList<>();
        int index = alreadyIndexed;
        try {
            Files.createDirectories(dir);
            for (CustomTestCaseInput input : inputs) {
                if (cases.size() >= max) {
                    log.warn("Submission {} sent more than {} custom cases; ignoring the rest",
                            submission.getId(), max);
                    break;
                }
                String caseId = "custom-" + (cases.size() + 1);
                Path file = dir.resolve(caseId + ".in");
                Files.writeString(file, input.input(), StandardCharsets.UTF_8);

                Path expectedFile = null;
                if (input.hasExpectedOutput()) {
                    expectedFile = dir.resolve(caseId + ".out");
                    Files.writeString(expectedFile, input.expectedOutput(), StandardCharsets.UTF_8);
                }

                cases.add(new JudgeCase(
                        ++index, caseId, JudgeCaseKind.CUSTOM,
                        file, expectedFile, timeLimitMs, memoryLimitKb));
            }
        } catch (IOException exception) {
            throw new DockerSandboxException("Could not stage custom testcase input", exception);
        }
        return cases;
    }

    /** Loosest time limit across the problem's test cases (defaults when none). */
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

    /**
     * Projects one graded case onto its persisted row. IO is kept for every
     * case the user is entitled to see (samples and their own custom inputs)
     * and dropped entirely for hidden cases, which is what a full submission
     * needs so a failed public sample is still explainable.
     */
    private TestCaseResult toRow(CaseOutcome outcome) {
        boolean visible = outcome.exposesIo();
        return TestCaseResult.builder()
                .testCaseId(outcome.testCase().caseId())
                .caseIndex(outcome.testCase().caseIndex())
                .kind(outcome.testCase().kind())
                .status(outcome.verdict())
                .executionTimeMs(outcome.runtimeMs())
                .memoryUsedKb(outcome.memoryKb())
                .stdout(visible ? outcome.stdout() : null)
                .stderr(visible ? outcome.stderr() : null)
                .expectedOutput(visible ? outcome.expectedOutput() : null)
                .actualOutput(visible ? outcome.actualOutput() : null)
                .build();
    }

    private SubmissionResult buildResult(
            Submission submission,
            Verdict verdict,
            int passed,
            int total,
            long totalMs,
            long peakKb,
            String compileErrorLogs,
            Integer failedCaseIndex,
            List<TestCaseResult> rows) {
        return SubmissionResult.builder()
                .submissionId(submission.getId())
                .overallVerdict(verdict)
                .totalExecutionTimeMs(totalMs)
                .peakMemoryKb(peakKb)
                .passedTestCases(passed)
                .totalTestCases(total)
                .failedCaseIndex(failedCaseIndex)
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

        this.eventPublisher.publishCompleted(submission.getId(), result);

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

    /**
     * Unrecoverable failure: FAILED status + SYSTEM_ERROR result + JOB_FAILED.
     * The run stream is terminated as well, so a client that is waiting on
     * {@code RUN_FINISHED} is never left hanging after an infrastructure
     * error or a worker crash.
     */
    private void fail(Submission submission, String message) {
        try {
            SubmissionResult result = buildResult(
                    submission, Verdict.SYSTEM_ERROR, 0, 0, 0, 0,
                    message == null ? null : message, null, List.of());
            this.resultRepository.save(result);
        } catch (Exception exception) {
            log.error("Could not persist SYSTEM_ERROR result for {}",
                    submission.getId(), exception);
        }
        submission.setStatus(SubmissionStatus.FAILED);
        submission.setUpdatedAt(Instant.now());
        this.submissionRepository.save(submission);
        this.eventPublisher.publishRunFinished(
                submission.getId(), submission.getId(), Verdict.SYSTEM_ERROR,
                0, 0, null, 0, 0, message == null ? "System error" : message);
        this.eventPublisher.publishFailed(submission.getId(), message);
    }
}