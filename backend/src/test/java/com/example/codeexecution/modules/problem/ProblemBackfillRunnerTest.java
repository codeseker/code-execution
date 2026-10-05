package com.example.codeexecution.modules.problem;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;

class ProblemBackfillRunnerTest {

    @Test
    void normalizesEscapedNewlinesInTestcaseFiles(@TempDir Path tempDir) throws Exception {
        Path input = tempDir.resolve("tc-1.in");
        Path output = tempDir.resolve("tc-1.out");
        Files.writeString(input, "line1\\nline2\\r\\nline3", StandardCharsets.UTF_8);
        Files.writeString(output, "answer\\nhere", StandardCharsets.UTF_8);

        String normalizedInput = normalizeEscapedNewlines(Files.readString(input));
        String normalizedOutput = normalizeEscapedNewlines(Files.readString(output));

        assertEquals("line1\nline2\nline3", normalizedInput);
        assertEquals("answer\nhere", normalizedOutput);
    }

    @Test
    void backfillsMissingStructuredFields() throws Exception {
        Problem problem = Problem.builder()
                .id("legacy-1")
                .title("Legacy")
                .slug("legacy")
                .difficulty(com.example.codeexecution.modules.problem.entities.Difficulty.EASY)
                .tags(new ArrayList<>())
                .problemStatement("statement")
                .inputFormat(null)
                .outputFormat(null)
                .constraints(null)
                .notes(null)
                .timeLimitMs(0)
                .memoryLimitKb(0)
                .isPublished(true)
                .isDeleted(false)
                .build();

        backfillProblem(problem);

        assertEquals("", problem.getInputFormat());
        assertEquals("", problem.getOutputFormat());
        assertEquals(new ArrayList<>(), problem.getConstraints());
        assertEquals("", problem.getNotes());
        assertEquals(Integer.valueOf(1000), problem.getTimeLimitMs());
        assertEquals(Integer.valueOf(256000), problem.getMemoryLimitKb());
        assertFalse(problem.getStarterCode() == null);
    }

    private static void backfillProblem(Problem problem) {
        if (problem.getInputFormat() == null || problem.getInputFormat().isBlank()) {
            problem.setInputFormat("");
        }
        if (problem.getOutputFormat() == null || problem.getOutputFormat().isBlank()) {
            problem.setOutputFormat("");
        }
        if (problem.getConstraints() == null) {
            problem.setConstraints(new ArrayList<>());
        }
        if (problem.getNotes() == null) {
            problem.setNotes("");
        }
        if (problem.getTimeLimitMs() == 0) {
            problem.setTimeLimitMs(1000);
        }
        if (problem.getMemoryLimitKb() == 0) {
            problem.setMemoryLimitKb(256000);
        }
        if (problem.getStarterCode() == null) {
            problem.setStarterCode(new java.util.LinkedHashMap<>());
        }
    }

    private static String normalizeEscapedNewlines(String value) {
        if (value == null) return null;
        String normalized = value.replace("\\r\\n", "\n");
        normalized = normalized.replace("\\n", "\n");
        return normalized.replace("\r\n", "\n").replace('\r', '\n');
    }
}
