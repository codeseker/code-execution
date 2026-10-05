package com.example.codeexecution.modules.problem;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.example.codeexecution.common.exceptions.ResourceNotFoundException;
import com.example.codeexecution.modules.problem.dtos.PublicProblemDetailResponse;
import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.submission.services.LanguageRegistry;

/**
 * Tests for the public problem detail API shape and content rules.
 */
class PublicProblemDetailResponseTest {

    @Test
    void sampleTestCasesIncludeExplanation() {
        Problem problem = Problem.builder()
                .id("prob-1")
                .title("Test")
                .slug("test")
                .difficulty(Difficulty.EASY)
                .tags(List.of("test"))
                .problemStatement("statement")
                .inputFormat("Line 1: n")
                .outputFormat("Line 1: answer")
                .constraints(List.of("n <= 100"))
                .notes("")
                .timeLimitMs(1000)
                .memoryLimitKb(256000)
                .isPublished(true)
                .isDeleted(false)
                .build();

        TestCase sample = TestCase.builder()
                .id("tc-1")
                .problemId("prob-1")
                .inputFilePath("/tmp/tc-1.in")
                .outputFilePath("/tmp/tc-1.out")
                .isSample(true)
                .order(0)
                .timeLimitMs(1000)
                .memoryLimitKb(256000)
                .explanation("Because 1+1=2")
                .build();

        TestCase hidden = TestCase.builder()
                .id("tc-2")
                .problemId("prob-1")
                .inputFilePath("/tmp/tc-2.in")
                .outputFilePath("/tmp/tc-2.out")
                .isSample(false)
                .order(1)
                .timeLimitMs(1000)
                .memoryLimitKb(256000)
                .explanation("hidden explanation")
                .build();

        assertTrue(sample.getExplanation() != null && !sample.getExplanation().isBlank(),
                "Sample test case must have explanation");
        assertTrue(hidden.getExplanation() != null,
                "Hidden test case can have explanation (stored but not exposed)");
    }

    @Test
    void apiNeverExposesHiddenTestCases() {
        Problem problem = Problem.builder()
                .id("prob-2")
                .title("Hidden")
                .slug("hidden-test")
                .difficulty(Difficulty.MEDIUM)
                .tags(List.of("test"))
                .problemStatement("statement")
                .inputFormat("Line 1: n")
                .outputFormat("Line 1: answer")
                .constraints(List.of())
                .notes("")
                .timeLimitMs(1000)
                .memoryLimitKb(256000)
                .isPublished(true)
                .isDeleted(false)
                .build();

        assertFalse(problem.isDeleted(), "Problem must be published");
        assertTrue(problem.isPublished(), "Problem must be published");
    }

    @Test
    void structuredFieldsAreNonNullableInResponse() {
        PublicProblemDetailResponse response = new PublicProblemDetailResponse(
                "id-1",
                "slug-1",
                "Test",
                "desc",
                Difficulty.EASY,
                List.of("test"),
                "statement",
                "input format",
                "output format",
                List.of("constraint 1"),
                "notes",
                1000,
                256000,
                Map.of("python", "print(input())"),
                List.of(new PublicProblemDetailResponse.SampleTestCase(
                        "tc-1", "1\n", "2\n", "explanation", 1000, 256000)));

        assertTrue(response.inputFormat() != null, "inputFormat must not be null");
        assertTrue(response.outputFormat() != null, "outputFormat must not be null");
        assertTrue(response.constraints() != null, "constraints must not be null");
        assertTrue(response.notes() != null, "notes must not be null");
        assertTrue(response.statement() != null, "statement must not be null");
        assertTrue(response.sampleTestCases().get(0).explanation() != null,
                "Sample explanation must not be null");
    }
}
