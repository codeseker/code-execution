package com.example.codeexecution.modules.submission.mapper;

import java.util.List;

import com.example.codeexecution.modules.submission.dtos.SubmissionResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResultResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResultResponse.TestCaseResultResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionSummaryResponse;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionResult;
import com.example.codeexecution.modules.submission.entities.TestCaseResult;
import com.example.codeexecution.modules.submission.entities.Verdict;

/**
 * Maps Mongo documents to the client-facing DTO records.
 *
 * <p>No redaction happens here: the worker already decided, per case, what may
 * be stored (hidden cases are persisted without any IO), so this mapper is a
 * straight projection. That is what lets a full submission show the IO of the
 * public sample it failed on instead of an empty output box.
 */
public final class SubmissionResponseMapper {

    private SubmissionResponseMapper() {
    }

    public static SubmissionResponse toSubmissionResponse(
            Submission submission, SubmissionResult result, String problemTitle) {
        return new SubmissionResponse(
                submission.getId(),
                submission.getProblemId(),
                problemTitle,
                submission.getLanguage(),
                submission.getType(),
                submission.getStatus(),
                submission.getCode(),
                submission.getCreatedAt(),
                result == null ? null : toResultResponse(result));
    }

    /**
     * Lightweight history row for {@code GET /users/me/submissions}:
     * no code, no testcase output, just the verdict and resource summary.
     */
    public static SubmissionSummaryResponse toSummary(
            Submission submission,
            Verdict verdict,
            String problemTitle,
            Long runtimeMs,
            Long memoryKb) {
        return new SubmissionSummaryResponse(
                submission.getId(),
                submission.getProblemId(),
                problemTitle,
                submission.getLanguage(),
                submission.getType(),
                submission.getStatus(),
                verdict,
                runtimeMs,
                memoryKb,
                submission.getCreatedAt());
    }

    public static SubmissionResultResponse toResultResponse(SubmissionResult result) {
        return new SubmissionResultResponse(
                result.getSubmissionId(),
                result.getOverallVerdict(),
                result.getTotalExecutionTimeMs(),
                result.getPeakMemoryKb(),
                result.getPassedTestCases(),
                result.getTotalTestCases(),
                result.getCompileErrorLogs(),
                result.getFailedCaseIndex(),
                toTestCaseResponses(result.getTestCaseResults()));
    }

    private static List<TestCaseResultResponse> toTestCaseResponses(List<TestCaseResult> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream()
                .map(row -> new TestCaseResultResponse(
                        row.getTestCaseId(),
                        row.getCaseIndex(),
                        row.getKind(),
                        row.getStatus(),
                        row.getExecutionTimeMs(),
                        row.getMemoryUsedKb(),
                        row.getStdout(),
                        row.getStderr(),
                        row.getExpectedOutput(),
                        row.getActualOutput()))
                .toList();
    }
}