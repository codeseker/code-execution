package com.example.codeexecution.modules.problem;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;

/**
 * One-off backfill runner that normalizes existing problem/testcase data
 * when the structured fields are added to the schema.
 *
 * <p>Runs after the seeder and only when {@code app.problem.backfill.enabled=true}.
 * It:
 * <ol>
 *   <li>Fills default values for new structured fields on existing problems
 *       that are missing them.</li>
 *   <li>Converts test case files containing literal escaped newline sequences
 *       (the two characters {@code \} and {@code n}) into real newlines.</li>
 * </ol>
 */
@Component
public class ProblemBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProblemBackfillRunner.class);
    private static final Pattern ESCAPED_NEWLINE = Pattern.compile("\\\\n");
    private static final Pattern ESCAPED_CRLF = Pattern.compile("\\\\r\\\\n");

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final MongoTemplate mongoTemplate;

    private final boolean enabled;

    public ProblemBackfillRunner(
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            MongoTemplate mongoTemplate,
            @Value("${app.problem.backfill.enabled:false}") boolean enabled) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.mongoTemplate = mongoTemplate;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Problem backfill disabled (app.problem.backfill.enabled=false)");
            return;
        }

        int problemsUpdated = 0;
        int testcasesNormalized = 0;

        // Backfill structured fields on problems missing them.
        List<Problem> legacyProblems = this.mongoTemplate.find(
                Query.query(Criteria.where("inputFormat").exists(false)),
                Problem.class);

        for (Problem problem : legacyProblems) {
            boolean changed = false;

            if (problem.getInputFormat() == null || problem.getInputFormat().isBlank()) {
                problem.setInputFormat("");
                changed = true;
            }
            if (problem.getOutputFormat() == null || problem.getOutputFormat().isBlank()) {
                problem.setOutputFormat("");
                changed = true;
            }
            if (problem.getConstraints() == null) {
                problem.setConstraints(new ArrayList<>());
                changed = true;
            }
            if (problem.getNotes() == null) {
                problem.setNotes("");
                changed = true;
            }
            if (problem.getTimeLimitMs() == 0) {
                problem.setTimeLimitMs(1000);
                changed = true;
            }
            if (problem.getMemoryLimitKb() == 0) {
                problem.setMemoryLimitKb(256000);
                changed = true;
            }
            if (problem.getStarterCode() == null) {
                problem.setStarterCode(new java.util.LinkedHashMap<>());
                changed = true;
            }

            if (changed) {
                problem.setUpdatedAt(Instant.now());
                this.problemRepository.save(problem);
                problemsUpdated++;
            }
        }

        // Normalize testcase files containing literal escaped newlines.
        List<TestCase> allTestCases = this.mongoTemplate.findAll(TestCase.class);
        for (TestCase tc : allTestCases) {
            boolean changed = false;

            String input = readFile(tc.getInputFilePath());
            if (input != null && (input.contains("\\n") || input.contains("\\r\\n"))) {
                String normalized = ESCAPED_CRLF.matcher(input).replaceAll("\n");
                normalized = ESCAPED_NEWLINE.matcher(normalized).replaceAll("\n");
                writeFile(tc.getInputFilePath(), normalized);
                changed = true;
            }

            String output = readFile(tc.getOutputFilePath());
            if (output != null && (output.contains("\\n") || output.contains("\\r\\n"))) {
                String normalized = ESCAPED_CRLF.matcher(output).replaceAll("\n");
                normalized = ESCAPED_NEWLINE.matcher(normalized).replaceAll("\n");
                writeFile(tc.getOutputFilePath(), normalized);
                changed = true;
            }

            if (changed) {
                testcasesNormalized++;
            }
        }

        log.info("Problem backfill completed: {} problems updated, {} test cases normalized",
                problemsUpdated, testcasesNormalized);
    }

    private static String readFile(String path) {
        if (path == null || path.isBlank()) return null;
        try {
            return Files.readString(Path.of(path), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Could not read testcase file {}: {}", path, e.getMessage());
            return null;
        }
    }

    private static void writeFile(String path, String content) {
        try {
            Files.writeString(Path.of(path), content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Could not write testcase file {}: {}", path, e.getMessage());
        }
    }
}
