package com.example.codeexecution.modules.submission.mapper;

import java.util.List;

import com.example.codeexecution.modules.submission.dtos.SubmissionResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResultResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResultResponse.TestCaseResultResponse;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionResult;
import com.example.codeexecution.modules.submission.entities.TestCaseResult;

/**
 * Maps Mongo documents to the client-facing DTO records. Hidden test data
 * (stdout/expected/actual) is stripped unless {@code includeIo} is true,
 * i.e. the run was an example evaluation over public samples.
 */
public final class SubmissionResponseMapper {

    private SubmissionResponseMapper() {
    }

    public static SubmissionResponse toSubmissionResponse(
            Submission submission, SubmissionResult result, boolean includeIo) {
        return new SubmissionResponse(
                submission.getId(),
                submission.getProblemId(),
                submission.getLanguage(),
                submission.getType(),
                submission.getStatus(),
                submission.getCreatedAt(),
                result == null ? null : toResultResponse(result, includeIo));
    }

    public static SubmissionResultResponse toResultResponse(
            SubmissionResult result, boolean includeIo) {
        return new SubmissionResultResponse(
                result.getSubmissionId(),
                result.getOverallVerdict(),
                result.getTotalExecutionTimeMs(),
                result.getPeakMemoryKb(),
                result.getPassedTestCases(),
                result.getTotalTestCases(),
                result.getCompileErrorLogs(),
                toTestCaseResponses(result.getTestCaseResults(), includeIo));
    }

    private static List<TestCaseResultResponse> toTestCaseResponses(
            List<TestCaseResult> rows, boolean includeIo) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream()
                .map(row -> new TestCaseResultResponse(
                        row.getTestCaseId(),
                        row.getStatus(),
                        row.getExecutionTimeMs(),
                        row.getMemoryUsedKb(),
                        includeIo ? row.getStdout() : null,
                        includeIo ? row.getStderr() : null,
                        includeIo ? row.getExpectedOutput() : null,
                        includeIo ? row.getActualOutput() : null))
                .toList();
    }
}
