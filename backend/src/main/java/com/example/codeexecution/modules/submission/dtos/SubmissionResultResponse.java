package com.example.codeexecution.modules.submission.dtos;

import java.util.List;

import com.example.codeexecution.modules.submission.entities.JudgeCaseKind;
import com.example.codeexecution.modules.submission.entities.Verdict;

/**
 * Detailed post-evaluation analysis. {@code compileErrorLogs} is only set
 * for COMPILE_ERROR (and carries the failure reason for SYSTEM_ERROR).
 *
 * <p>Per-testcase IO is decided per CASE, not per submission type: sample and
 * custom rows carry input/expected/actual, hidden rows are always null.
 */
public record SubmissionResultResponse(
        String submissionId,
        Verdict overallVerdict,
        long totalExecutionTimeMs,
        long peakMemoryKb,
        int passedTestCases,
        int totalTestCases,
        String compileErrorLogs,
        /** 1-based index of the first failing case; null when accepted. */
        Integer failedCaseIndex,
        List<TestCaseResultResponse> testCaseResults) {

    /**
     * One per-testcase breakdown row. For hidden cases {@code stdout},
     * {@code stderr}, {@code expectedOutput} and {@code actualOutput} are
     * always null and only the status, runtime and memory are exposed.
     */
    public record TestCaseResultResponse(
            String testCaseId,
            /** 1-based position in the run; null on rows written before it existed. */
            Integer caseIndex,
            JudgeCaseKind kind,
            Verdict status,
            long executionTimeMs,
            long memoryUsedKb,
            String stdout,
            String stderr,
            String expectedOutput,
            String actualOutput) {
    }
}