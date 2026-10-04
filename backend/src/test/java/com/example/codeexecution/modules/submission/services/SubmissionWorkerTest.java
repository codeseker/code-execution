package com.example.codeexecution.modules.submission.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.stubbing.Answer;

import com.example.codeexecution.modules.problem.ProblemRepository;
import com.example.codeexecution.modules.problem.TestCaseRepository;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.problem.services.ProblemStatsService;
import com.example.codeexecution.modules.stats.UserProblemStatService;
import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.dtos.JobMessage;
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
import com.example.codeexecution.modules.submission.services.DockerSandboxService.RunOutcome;

/**
 * Worker behaviour that Run, example-eval and submit all depend on: the plan
 * is built from storage (never from the request), every case is graded by the
 * one {@link CaseJudge}, each case streams its own event, and a full
 * submission stops at its first failure.
 *
 * <p>Only Docker is mocked; planning, verdict mapping, row projection and
 * event publishing are the real production code.
 */
class SubmissionWorkerTest {

    private static final String SUBMISSION_ID = "sub-1";
    private static final String PROBLEM_ID = "problem-1";
    private static final String CODE = "print('hi')";

    @TempDir
    Path tempDir;

    private SubmissionRepository submissionRepository;
    private SubmissionResultRepository resultRepository;
    private ProblemRepository problemRepository;
    private TestCaseRepository testCaseRepository;
    private DockerSandboxService sandbox;
    private SubmissionEventPublisher publisher;
    private UserProblemStatService statService;
    private ProblemStatsService problemStatsService;
    private SubmissionWorker worker;

    /** Input files handed to the sandbox, in the order the plan ran them. */
    private final List<String> executedInputs = new ArrayList<>();

    private Submission submission;

    @BeforeEach
    void setUp() {
        this.submissionRepository = mock(SubmissionRepository.class);
        this.resultRepository = mock(SubmissionResultRepository.class);
        this.problemRepository = mock(ProblemRepository.class);
        this.testCaseRepository = mock(TestCaseRepository.class);
        this.sandbox = mock(DockerSandboxService.class);
        this.publisher = mock(SubmissionEventPublisher.class);
        this.statService = mock(UserProblemStatService.class);
        this.problemStatsService = mock(ProblemStatsService.class);

        ExecutionProperties properties = new ExecutionProperties();
        this.worker = new SubmissionWorker(
                mock(SubmissionQueueService.class),
                this.submissionRepository,
                this.resultRepository,
                this.problemRepository,
                this.testCaseRepository,
                this.sandbox,
                new CaseJudge(this.sandbox, properties),
                this.publisher,
                this.statService,
                this.problemStatsService,
                properties);

        when(this.sandbox.workDirFor(anyString())).thenReturn(this.tempDir.resolve("work"));
        when(this.sandbox.compile(anyString(), any(), anyString()))
                .thenReturn(new CompileOutcome(true, null));
        // Default: the program runs clean and prints nothing.
        stubExecution(invocation -> new RunOutcome(false, false, 0, "", "", 5, 1024));

        this.problemRepositoryProblem();
    }

    /**
     * Records every executed input file and returns the canned outcome.
     * Uses {@code doAnswer} on purpose: re-stubbing through {@code when(...)}
     * would fire the previous answer once and pollute the recorded order.
     */
    private void stubExecution(Answer<RunOutcome> answer) {
        doAnswer(invocation -> {
                    this.executedInputs.add((String) invocation.getArgument(2));
                    return answer.answer(invocation);
                })
                .when(this.sandbox)
                .runTestCase(anyString(), any(), anyString(), anyLong(), anyLong());
    }

    private void problemRepositoryProblem() {
        when(this.problemRepository.findById(PROBLEM_ID)).thenReturn(Optional.of(
                Problem.builder()
                        .id(PROBLEM_ID)
                        .isPublished(true)
                        .isDeleted(false)
                        .build()));
    }

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private TestCase storedCase(String id, boolean sample, String input, String expected)
            throws IOException {
        Path in = this.tempDir.resolve(id + ".in");
        Path out = this.tempDir.resolve(id + ".out");
        Files.writeString(in, input, StandardCharsets.UTF_8);
        Files.writeString(out, expected, StandardCharsets.UTF_8);
        return TestCase.builder()
                .id(id)
                .problemId(PROBLEM_ID)
                .inputFilePath(in.toString())
                .outputFilePath(out.toString())
                .isSample(sample)
                .timeLimitMs(1000)
                .memoryLimitKb(256000)
                .build();
    }

    private void withCases(List<TestCase> cases) {
        when(this.testCaseRepository.findByProblemId(PROBLEM_ID)).thenReturn(cases);
    }

    private Submission submission(SubmissionType type, List<String> customTestcases) {
        this.submission = Submission.builder()
                .id(SUBMISSION_ID)
                .userId("user-1")
                .problemId(PROBLEM_ID)
                .code(CODE)
                .language(Language.python)
                .type(type)
                .status(SubmissionStatus.QUEUED)
                .customTestcases(customTestcases)
                .build();
        when(this.submissionRepository.findById(SUBMISSION_ID))
                .thenReturn(Optional.of(this.submission));
        when(this.submissionRepository.save(any(Submission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        return this.submission;
    }

    private void run() {
        this.worker.process(new JobMessage(
                SUBMISSION_ID, PROBLEM_ID, "user-1", Language.python, false));
    }

    private SubmissionResult savedResult() {
        ArgumentCaptor<SubmissionResult> captor = ArgumentCaptor.forClass(SubmissionResult.class);
        verify(this.resultRepository).save(captor.capture());
        return captor.getValue();
    }

    private List<CaseOutcome> streamedCases() {
        ArgumentCaptor<CaseOutcome> captor = ArgumentCaptor.forClass(CaseOutcome.class);
        verify(this.publisher, org.mockito.Mockito.atLeastOnce())
                .publishCaseResult(anyString(), anyString(), captor.capture());
        return captor.getAllValues();
    }

    // ------------------------------------------------------------------
    // Sample runs
    // ------------------------------------------------------------------

    @Test
    void sampleRunExecutesEverySampleInStoredOrder() throws Exception {
        withCases(List.of(
                storedCase("c1", true, "in-1", "out-1"),
                storedCase("c2", true, "in-2", "out-2"),
                storedCase("c3", true, "in-3", "out-3")));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        assertEquals(3, this.executedInputs.size());
        assertTrue(this.executedInputs.get(0).endsWith("c1.in"));
        assertTrue(this.executedInputs.get(1).endsWith("c2.in"));
        assertTrue(this.executedInputs.get(2).endsWith("c3.in"));

        SubmissionResult result = savedResult();
        assertEquals(Verdict.WRONG_ANSWER, result.getOverallVerdict());
        assertEquals(3, result.getTotalTestCases());
        assertEquals(1, result.getFailedCaseIndex().intValue());
        assertEquals(1, result.getTestCaseResults().get(0).getCaseIndex().intValue());
        assertEquals(JudgeCaseKind.SAMPLE, result.getTestCaseResults().get(0).getKind());
    }

    @Test
    void acceptedRunPassesEverySample() throws Exception {
        stubExecution(invocation -> new RunOutcome(false, false, 0, "ok\n", "", 5, 1024));
        withCases(List.of(
                storedCase("c1", true, "in-1", "ok\n"),
                storedCase("c2", true, "in-2", "ok\n")));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        SubmissionResult result = savedResult();
        assertEquals(Verdict.ACCEPTED, result.getOverallVerdict());
        assertEquals(2, result.getPassedTestCases());
        assertNull(result.getFailedCaseIndex());
    }

    @Test
    void clientSuppliedInputIsNeverUsedAsASample() throws Exception {
        withCases(List.of(storedCase("c1", true, "stored-input", "out-1")));
        Submission queued = submission(SubmissionType.CUSTOM_RUN, null);
        // A legacy client still posts a single stdin; it must be ignored.
        queued.setCustomInput("client-smuggled-input");

        run();

        assertEquals(1, this.executedInputs.size());
        assertTrue(this.executedInputs.get(0).endsWith("c1.in"));
        assertFalse(this.executedInputs.get(0).contains("client-smuggled-input"));
        assertEquals(JudgeCaseKind.SAMPLE, savedResult().getTestCaseResults().get(0).getKind());
    }

    @Test
    void customCasesRunAfterTheSamplesAndHaveNoExpectedOutput() throws Exception {
        withCases(List.of(
                storedCase("c1", true, "sample-1", "out-1"),
                storedCase("c2", true, "sample-2", "out-2")));
        submission(SubmissionType.CUSTOM_RUN, List.of("my own stdin", "", "second stdin"));

        run();

        // Two samples plus the two non-blank custom inputs, samples first.
        assertEquals(4, this.executedInputs.size());
        assertTrue(this.executedInputs.get(0).endsWith("c1.in"));
        assertTrue(this.executedInputs.get(1).endsWith("c2.in"));
        assertTrue(this.executedInputs.get(2).endsWith("custom-1.in"));
        assertTrue(this.executedInputs.get(3).endsWith("custom-2.in"));
        assertEquals("my own stdin", Files.readString(this.tempDir.resolve("work/custom-1.in")));
        assertEquals("second stdin", Files.readString(this.tempDir.resolve("work/custom-2.in")));

        List<TestCaseResult> rows = savedResult().getTestCaseResults();
        assertEquals(JudgeCaseKind.SAMPLE, rows.get(0).getKind());
        assertEquals(JudgeCaseKind.CUSTOM, rows.get(2).getKind());
        assertNull(rows.get(2).getExpectedOutput());
        // Nothing to compare against, so a custom case is never WRONG_ANSWER.
        assertEquals(Verdict.ACCEPTED, rows.get(2).getStatus());
        assertEquals(3, rows.get(2).getCaseIndex().intValue());
    }

    // ------------------------------------------------------------------
    // Verdict matrix
    // ------------------------------------------------------------------

    @Test
    void compileErrorShortCircuitsWithoutAnyCaseResult() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "out")));
        when(this.sandbox.compile(anyString(), any(), anyString()))
                .thenReturn(new CompileOutcome(false, "main.cpp:1: error: expected ';'"));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        assertEquals(List.of(), this.executedInputs);
        SubmissionResult result = savedResult();
        assertEquals(Verdict.COMPILE_ERROR, result.getOverallVerdict());
        assertTrue(result.getTestCaseResults().isEmpty());
        assertEquals("main.cpp:1: error: expected ';'", result.getCompileErrorLogs());
        verify(this.publisher, never()).publishCaseResult(anyString(), anyString(), any());
        // totalCount is 0: no case was ever judged.
        verify(this.publisher).publishRunFinished(
                eq(SUBMISSION_ID), eq(SUBMISSION_ID), eq(Verdict.COMPILE_ERROR),
                eq(0), eq(0), isNull(), eq(0L), eq(0L),
                eq("main.cpp:1: error: expected ';'"));
    }

    @Test
    void runtimeErrorIsNotReportedAsWrongAnswer() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "out")));
        stubExecution(invocation -> new RunOutcome(false, false, 1, "", "Traceback: boom", 5, 1024));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        SubmissionResult result = savedResult();
        assertEquals(Verdict.RUNTIME_ERROR, result.getOverallVerdict());
        assertEquals(Verdict.RUNTIME_ERROR, result.getTestCaseResults().get(0).getStatus());
    }

    @Test
    void timeLimitExceededIsReportedAsTle() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "out")));
        stubExecution(invocation -> new RunOutcome(true, false, 124, "", "", 1001, 1024));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        assertEquals(Verdict.TIME_LIMIT_EXCEEDED, savedResult().getOverallVerdict());
    }

    @Test
    void oomKillIsReportedAsMemoryLimitExceeded() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "out")));
        stubExecution(invocation -> new RunOutcome(false, true, 137, "", "", 5, 262144));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        assertEquals(Verdict.MEMORY_LIMIT_EXCEEDED, savedResult().getOverallVerdict());
    }

    @Test
    void programThatPrintsNothingKeepsAnEmptyActualOutput() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "expected\n")));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        TestCaseResult row = savedResult().getTestCaseResults().get(0);
        assertEquals(Verdict.WRONG_ANSWER, row.getStatus());
        // Empty, not null: the UI can tell "printed nothing" from "not shown".
        assertEquals("", row.getActualOutput());
    }

    // ------------------------------------------------------------------
    // Submit semantics
    // ------------------------------------------------------------------

    @Test
    void wrongAnswerOnCaseTwoOfThreeStopsTheSubmitAtCaseTwo() throws Exception {
        withCases(List.of(
                storedCase("c1", true, "in-1", "1"),
                storedCase("c2", true, "in-2", "2"),
                storedCase("c3", false, "in-3", "3")));
        // c1 passes, c2 fails, c3 would pass but must never run.
        stubExecution(invocation -> {
                    String path = (String) invocation.getArgument(2);
                    return path.endsWith("c2.in")
                            ? new RunOutcome(false, false, 0, "999", "", 5, 1024)
                            : new RunOutcome(false, false, 0, "1", "", 5, 1024);
                });
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        assertEquals(2, this.executedInputs.size(), "must stop at the first failure");
        SubmissionResult result = savedResult();
        assertEquals(Verdict.WRONG_ANSWER, result.getOverallVerdict());
        assertEquals(1, result.getPassedTestCases());
        assertEquals(3, result.getTotalTestCases(), "total counts the whole plan, not what ran");
        assertEquals(2, result.getFailedCaseIndex().intValue());
        assertEquals(2, result.getTestCaseResults().size());
    }

    @Test
    void sampleRunKeepsGoingAfterAFailureSoEveryTabGetsADot() throws Exception {
        withCases(List.of(
                storedCase("c1", true, "in-1", "1"),
                storedCase("c2", true, "in-2", "2"),
                storedCase("c3", true, "in-3", "3")));
        stubExecution(invocation -> new RunOutcome(false, false, 0, "nope", "", 5, 1024));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        assertEquals(3, this.executedInputs.size());
        assertEquals(3, savedResult().getTestCaseResults().size());
    }

    @Test
    void failedPublicSampleOfASubmissionKeepsItsIo() throws Exception {
        withCases(List.of(
                storedCase("c1", true, "1 2\n3 4\n", "0 1\n")));
        stubExecution(invocation -> new RunOutcome(false, false, 0, "1 0\n", "", 5, 1024));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        TestCaseResult row = savedResult().getTestCaseResults().get(0);
        assertEquals(JudgeCaseKind.SAMPLE, row.getKind());
        assertEquals("0 1\n", row.getExpectedOutput());
        assertEquals("1 0\n", row.getActualOutput());
        assertEquals(Verdict.WRONG_ANSWER, row.getStatus());
    }

    @Test
    void hiddenCaseRowsCarryNoIo() throws Exception {
        withCases(List.of(storedCase("hidden-1", false, "secret-input", "secret-output")));
        stubExecution(invocation -> new RunOutcome(false, false, 0, "wrong", "", 5, 1024));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        TestCaseResult row = savedResult().getTestCaseResults().get(0);
        assertEquals(JudgeCaseKind.HIDDEN, row.getKind());
        assertNull(row.getStdout());
        assertNull(row.getStderr());
        assertNull(row.getExpectedOutput());
        assertNull(row.getActualOutput());
        assertEquals(Verdict.WRONG_ANSWER, row.getStatus());
        assertTrue(row.getExecutionTimeMs() > 0, "runtime stays visible");
        assertTrue(row.getMemoryUsedKb() > 0, "memory stays visible");
    }

    @Test
    void hiddenCaseOutcomeIsNeverExposable() throws Exception {
        withCases(List.of(storedCase("hidden-1", false, "secret-input", "secret-output")));
        stubExecution(invocation -> new RunOutcome(false, false, 0, "wrong", "", 5, 1024));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        CaseOutcome published = streamedCases().get(0);
        assertFalse(published.exposesIo());
        assertEquals(JudgeCaseKind.HIDDEN, published.testCase().kind());
    }

    // ------------------------------------------------------------------
    // Streaming contract
    // ------------------------------------------------------------------

    @Test
    void everyCaseIsStreamedWithTheSubmissionIdAsRunId() throws Exception {
        withCases(List.of(
                storedCase("c1", true, "in-1", "1"),
                storedCase("c2", true, "in-2", "2")));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        verify(this.publisher).publishRunStarted(SUBMISSION_ID, SUBMISSION_ID, 2);
        ArgumentCaptor<CaseOutcome> captor = ArgumentCaptor.forClass(CaseOutcome.class);
        verify(this.publisher, times(2))
                .publishCaseResult(eq(SUBMISSION_ID), eq(SUBMISSION_ID), captor.capture());
        List<CaseOutcome> streamed = captor.getAllValues();
        assertEquals(1, streamed.get(0).testCase().caseIndex());
        assertEquals(2, streamed.get(1).testCase().caseIndex());
        verify(this.publisher).publishRunFinished(
                eq(SUBMISSION_ID), eq(SUBMISSION_ID), any(Verdict.class),
                anyInt(), eq(2), any(), anyLong(), anyLong(), isNull());
    }

    @Test
    void runStreamIsTaggedWithTheRunIdSoStaleFramesCanBeIgnored() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "1")));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        // Every run-stream frame carries the same runId, which equals the
        // submission id: a frame from an older run can never match.
        verify(this.publisher).publishRunStarted(SUBMISSION_ID, SUBMISSION_ID, 1);
        verify(this.publisher).publishCaseResult(eq(SUBMISSION_ID), eq(SUBMISSION_ID), any());
        verify(this.publisher).publishRunFinished(
                eq(SUBMISSION_ID), eq(SUBMISSION_ID), any(Verdict.class),
                anyInt(), eq(1), any(), anyLong(), anyLong(), isNull());
    }

    @Test
    void infrastructureFailureStillTerminatesTheRunStream() {
        when(this.testCaseRepository.findByProblemId(PROBLEM_ID))
                .thenThrow(new IllegalStateException("Mongo is down"));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        assertEquals(SubmissionStatus.FAILED, this.submission.getStatus());
        verify(this.publisher).publishFailed(anyString(), anyString());
        verify(this.publisher).publishRunFinished(
                eq(SUBMISSION_ID), eq(SUBMISSION_ID), eq(Verdict.SYSTEM_ERROR),
                eq(0), eq(0), isNull(), eq(0L), eq(0L), anyString());
    }

    @Test
    void emptyPlanIsReportedAsSystemError() {
        withCases(List.of());
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        assertEquals(SubmissionStatus.FAILED, this.submission.getStatus());
        verify(this.publisher).publishRunFinished(
                eq(SUBMISSION_ID), eq(SUBMISSION_ID), eq(Verdict.SYSTEM_ERROR),
                eq(0), eq(0), isNull(), eq(0L), eq(0L), anyString());
    }

    @Test
    void statisticsOnlyMoveForFullSubmissions() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "1")));
        stubExecution(invocation -> new RunOutcome(false, false, 0, "1", "", 5, 1024));
        submission(SubmissionType.EXAMPLE_EVAL, null);

        run();

        verify(this.statService, never()).recordSubmission(anyString());
        verify(this.problemStatsService, never()).recordJudged(anyString(), anyBoolean());
        verify(this.publisher).publishCompleted(anyString(), any(SubmissionResult.class));
    }

    @Test
    void fullSubmissionMovesTheAcceptanceStatistics() throws Exception {
        withCases(List.of(storedCase("c1", true, "in", "1")));
        stubExecution(invocation -> new RunOutcome(false, false, 0, "1", "", 5, 1024));
        submission(SubmissionType.FULL_SUBMISSION, null);

        run();

        verify(this.statService).recordSubmission("user-1");
        verify(this.statService).recordAccepted("user-1", PROBLEM_ID);
        verify(this.problemStatsService).recordJudged(PROBLEM_ID, true);
    }
}