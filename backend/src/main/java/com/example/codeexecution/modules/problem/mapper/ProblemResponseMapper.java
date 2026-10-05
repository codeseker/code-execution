package com.example.codeexecution.modules.problem.mapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.example.codeexecution.common.responses.PaginationMeta;
import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;

/**
 * Entity -&gt; response mapping for the problem module, mirroring the
 * style of {@code RegisterResponseMapper}.
 */
public class ProblemResponseMapper {

    public static ProblemResponse toProblemResponse(Problem problem, long testCaseCount) {
        return new ProblemResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getSlug(),
                problem.getDescription(),
                problem.getProblemStatement(),
                problem.getInputFormat(),
                problem.getOutputFormat(),
                problem.getConstraints() == null ? List.of() : problem.getConstraints(),
                problem.getNotes(),
                problem.getDifficulty(),
                problem.getTags() == null ? List.of() : problem.getTags(),
                problem.isPublished(),
                problem.isDeleted(),
                problem.getCreatedBy(),
                problem.getTimeLimitMs(),
                problem.getMemoryLimitKb(),
                problem.getStarterCode() == null ? Map.of() : problem.getStarterCode(),
                problem.getSource(),
                testCaseCount,
                problem.getTotalSubmissions(),
                problem.getAcceptedSubmissions(),
                problem.getCreatedAt(),
                problem.getUpdatedAt());
    }

    public static TestCaseResponse toTestCaseResponse(TestCase testCase) {
        return new TestCaseResponse(
                testCase.getId(),
                testCase.getProblemId(),
                testCase.getInputFilePath(),
                testCase.getOutputFilePath(),
                testCase.isSample(),
                testCase.getOrder(),
                testCase.getTimeLimitMs(),
                testCase.getMemoryLimitKb(),
                testCase.getExplanation());
    }

    public static List<TestCaseResponse> toTestCaseResponses(List<TestCase> testCases) {
        return testCases.stream().map(ProblemResponseMapper::toTestCaseResponse).toList();
    }

    /** Paginated list envelope for {@code GET /admin/problems}. */
    public record ProblemPageResponse(
            List<ProblemResponse> problems,
            PaginationMeta pagination) {
    }

    /** Full problem detail, including its test cases. */
    public record ProblemDetailsResponse(
            ProblemResponse problem,
            List<TestCaseResponse> testCases) {
    }

    public record ProblemResponse(
            String _id,
            String title,
            String slug,
            String description,
            String problemStatement,
            String inputFormat,
            String outputFormat,
            List<String> constraints,
            String notes,
            Difficulty difficulty,
            List<String> tags,
            boolean isPublished,
            boolean isDeleted,
            String createdBy,
            int timeLimitMs,
            int memoryLimitKb,
            Map<String, String> starterCode,
            String source,
            long testCaseCount,
            long totalSubmissions,
            long acceptedSubmissions,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record TestCaseResponse(
            String _id,
            String problemId,
            String inputFilePath,
            String outputFilePath,
            boolean isSample,
            int order,
            int timeLimitMs,
            int memoryLimitKb,
            String explanation) {
    }
}
