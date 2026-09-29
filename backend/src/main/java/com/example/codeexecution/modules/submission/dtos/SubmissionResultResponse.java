package com.example.codeexecution.modules.submission.dtos;

import java.util.List;

import com.example.codeexecution.modules.submission.entities.Verdict;

/**
 * Detailed post-evaluation analysis. {@code compileErrorLogs} is only set
 * for COMPILE_ERROR; per-testcase IO fields are only populated for
 * example-eval runs (hidden test data never leaves the server).
 */
public record SubmissionResultResponse(
        String submissionId,
        Verdict overallVerdict,
        long totalExecutionTimeMs,
        long peakMemoryKb,
        int passedTestCases,
        int totalTestCases,
        String compileErrorLogs,
        List<TestCaseResultResponse> testCaseResults) {

    /**
     * One per-testcase breakdown row. The last four fields are null for
     * full submissions over hidden test cases.
     */
    public record TestCaseResultResponse(
            String testCaseId,
            Verdict status,
            long executionTimeMs,
            long memoryUsedKb,
            String stdout,
            String stderr,
            String expectedOutput,
            String actualOutput) {
    }
}
