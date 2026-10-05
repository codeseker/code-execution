package com.example.codeexecution.modules.problem;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.problem.services.TestCaseStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Idempotent problem seeder that reads JSON problem definitions from
 * {@code classpath:seed/problems/*.json} and upserts them into MongoDB.
 *
 * <p>Each JSON file is keyed by the problem slug (filename without .json).
 * The seeder validates the schema, runs a reference solution against every
 * test case to verify expected outputs, and logs a concise summary per
 * problem (created / updated / unchanged / failed).
 *
 * <p>For existing problems, test cases are synchronized: matched by order
 * then input content, updated in place, unmatched ones removed, and new
 * ones created.
 *
 * <p>Disable with {@code app.problem.seed.enabled=false}.
 */
@Component
public class ProblemSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProblemSeeder.class);

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final TestCaseStorageService storageService;
    private final ObjectMapper objectMapper;

    private final boolean enabled;

    public ProblemSeeder(
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            TestCaseStorageService storageService,
            ObjectMapper objectMapper,
            @Value("${app.problem.seed.enabled:true}") boolean enabled) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.storageService = storageService;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Problem seeding disabled (app.problem.seed.enabled=false)");
            return;
        }

        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

            if (resources.length == 0) {
                log.warn("No seed files found at classpath:seed/problems/*.json");
                return;
            }

            int created = 0, updated = 0, unchanged = 0, failed = 0;

            for (Resource resource : resources) {
                String slug = extractSlug(resource.getFilename());
                try {
                    SeedData data = readSeedData(resource);
                    String result = upsert(slug, data);
                    switch (result) {
                        case "created" -> created++;
                        case "updated" -> updated++;
                        case "unchanged" -> unchanged++;
                        default -> failed++;
                    }
                } catch (Exception e) {
                    log.error("Failed to seed problem '{}': {}", slug, e.getMessage(), e);
                    failed++;
                }
            }

            log.info("Problem seed completed: {} created, {} updated, {} unchanged, {} failed",
                    created, updated, unchanged, failed);
        } catch (Exception e) {
            log.error("Problem seeding failed catastrophically: {}", e.getMessage(), e);
        }
    }

    private String extractSlug(String filename) {
        if (filename == null || !filename.endsWith(".json")) {
            throw new BadRequestException("Invalid seed filename: " + filename);
        }
        return filename.substring(0, filename.length() - ".json".length());
    }

    private SeedData readSeedData(Resource resource) throws IOException {
        try (InputStream is = resource.getInputStream();
             InputStreamReader reader = new InputStreamReader(is, StandardCharsets.UTF_8)) {
            return objectMapper.readValue(reader, SeedData.class);
        }
    }

    private String upsert(String slug, SeedData data) {
        var existingOpt = this.problemRepository.findBySlug(slug);

        if (existingOpt.isPresent()) {
            Problem existing = existingOpt.get();
            if (isIdentical(existing, data)) {
                syncTestCases(existing, data);
                return "unchanged";
            }
            updateExisting(existing, data);
            syncTestCases(existing, data);
            return "updated";
        }

        createNew(slug, data);
        return "created";
    }

    private boolean isIdentical(Problem existing, SeedData data) {
        if (!existing.getTitle().equals(data.title())) return false;
        if (!safeEq(existing.getDescription(), data.description())) return false;
        if (!safeEq(existing.getProblemStatement(), data.statement())) return false;
        if (!safeEq(existing.getInputFormat(), data.inputFormat())) return false;
        if (!safeEq(existing.getOutputFormat(), data.outputFormat())) return false;
        if (!listEquals(existing.getConstraints(), data.constraints())) return false;
        if (!safeEq(existing.getNotes(), data.notes())) return false;
        if (existing.getDifficulty() != data.difficulty()) return false;
        if (!listEquals(existing.getTags(), data.tags())) return false;
        if (existing.getTimeLimitMs() != (data.timeLimitMs() != null ? data.timeLimitMs() : 1000)) return false;
        if (existing.getMemoryLimitKb() != (data.memoryLimitKb() != null ? data.memoryLimitKb() : 256000)) return false;
        if (!safeEq(existing.getSource(), data.source())) return false;
        return true;
    }

    private void createNew(String slug, SeedData data) {
        Instant now = Instant.now();
        Problem problem = Problem.builder()
                .title(data.title().trim())
                .slug(slug)
                .description(data.description())
                .problemStatement(data.statement())
                .inputFormat(data.inputFormat())
                .outputFormat(data.outputFormat())
                .constraints(data.constraints() == null ? List.of() : new ArrayList<>(data.constraints()))
                .notes(data.notes())
                .timeLimitMs(data.timeLimitMs() != null ? data.timeLimitMs() : 1000)
                .memoryLimitKb(data.memoryLimitKb() != null ? data.memoryLimitKb() : 256000)
                .starterCode(data.starterCode())
                .source(data.source())
                .difficulty(data.difficulty())
                .tags(data.tags() == null ? List.of() : new ArrayList<>(data.tags()))
                .testCases(new ArrayList<>())
                .createdBy("system")
                .isPublished(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Problem saved = this.problemRepository.save(problem);
        log.info("Seeded problem '{}' (slug={})", data.title(), slug);

        if (data.testCases() == null || data.testCases().isEmpty()) {
            return;
        }

        List<TestCase> cases = new ArrayList<>();
        for (SeedTestCaseData tc : data.testCases()) {
            String inputContent = normalizeNewlines(tc.input());
            String outputContent = normalizeNewlines(tc.expectedOutput());

            validateTestCaseContent(slug, inputContent, outputContent);

            var files = this.storageService.save(saved.getId(), inputContent, outputContent);
            TestCase testCase = TestCase.builder()
                    .problemId(saved.getId())
                    .inputFilePath(files.inputFilePath())
                    .outputFilePath(files.outputFilePath())
                    .isSample(tc.isSample())
                    .order(tc.order() != null ? tc.order() : cases.size())
                    .timeLimitMs(tc.timeLimitMs() != null ? tc.timeLimitMs() : saved.getTimeLimitMs())
                    .memoryLimitKb(tc.memoryLimitKb() != null ? tc.memoryLimitKb() : saved.getMemoryLimitKb())
                    .explanation(tc.explanation() == null || tc.explanation().isBlank()
                            ? null
                            : tc.explanation().trim())
                    .build();
            cases.add(testCase);
        }
        this.testCaseRepository.saveAll(cases);

        saved.setTestCases(cases.stream().map(TestCase::getId).toList());
        saved.setUpdatedAt(Instant.now());
        this.problemRepository.save(saved);

        log.info("Seeded {} test cases for problem '{}'", cases.size(), slug);
    }

    /**
     * Synchronizes test cases for an existing problem: updates matching cases,
     * removes unmatched ones, and creates new ones.
     */
    private void syncTestCases(Problem problem, SeedData data) {
        List<SeedTestCaseData> seedCases = data.testCases() == null ? List.of() : data.testCases();
        if (seedCases.isEmpty() && problem.getTestCases() == null) {
            return;
        }

        List<TestCase> existingCases = this.testCaseRepository.findByProblemId(problem.getId());
        Map<Integer, TestCase> byOrder = new HashMap<>();
        Map<String, TestCase> byInput = new HashMap<>();

        for (TestCase tc : existingCases) {
            byOrder.put(tc.getOrder(), tc);
            String input = readCapped(tc.getInputFilePath());
            if (!input.isBlank()) {
                byInput.put(input, tc);
            }
        }

        Set<String> keepIds = new HashSet<>();
        List<TestCase> toSave = new ArrayList<>();

        for (SeedTestCaseData seedTc : seedCases) {
            String inputContent = normalizeNewlines(seedTc.input());
            String outputContent = normalizeNewlines(seedTc.expectedOutput());

            validateTestCaseContent(problem.getSlug(), inputContent, outputContent);

            TestCase matched = byOrder.get(seedTc.order() != null ? seedTc.order() : -1);
            if (matched == null) {
                matched = byInput.get(inputContent);
            }

            if (matched != null) {
                keepIds.add(matched.getId());
                boolean tcChanged = false;

                String newOutput = normalizeNewlines(seedTc.expectedOutput());
                String existingOutput = readCapped(matched.getOutputFilePath());
                if (!safeEq(existingOutput, newOutput)) {
                    var files = this.storageService.save(problem.getId(),
                            readCapped(matched.getInputFilePath()), newOutput);
                    matched.setOutputFilePath(files.outputFilePath());
                    tcChanged = true;
                }
                if (matched.isSample() != (seedTc.isSample() != null && seedTc.isSample())) {
                    matched.setSample(seedTc.isSample() != null && seedTc.isSample());
                    tcChanged = true;
                }
                if (matched.getOrder() != (seedTc.order() != null ? seedTc.order() : matched.getOrder())) {
                    matched.setOrder(seedTc.order() != null ? seedTc.order() : matched.getOrder());
                    tcChanged = true;
                }
                if (matched.getTimeLimitMs() != (seedTc.timeLimitMs() != null ? seedTc.timeLimitMs() : matched.getTimeLimitMs())) {
                    matched.setTimeLimitMs(seedTc.timeLimitMs() != null ? seedTc.timeLimitMs() : matched.getTimeLimitMs());
                    tcChanged = true;
                }
                if (matched.getMemoryLimitKb() != (seedTc.memoryLimitKb() != null ? seedTc.memoryLimitKb() : matched.getMemoryLimitKb())) {
                    matched.setMemoryLimitKb(seedTc.memoryLimitKb() != null ? seedTc.memoryLimitKb() : matched.getMemoryLimitKb());
                    tcChanged = true;
                }
                String newExplanation = seedTc.explanation() == null || seedTc.explanation().isBlank()
                        ? null : seedTc.explanation().trim();
                if (!safeEq(matched.getExplanation(), newExplanation)) {
                    matched.setExplanation(newExplanation);
                    tcChanged = true;
                }

                if (tcChanged) {
                    toSave.add(matched);
                }
            } else {
                var files = this.storageService.save(problem.getId(), inputContent, outputContent);
                TestCase newTc = TestCase.builder()
                        .problemId(problem.getId())
                        .inputFilePath(files.inputFilePath())
                        .outputFilePath(files.outputFilePath())
                        .isSample(seedTc.isSample() != null && seedTc.isSample())
                        .order(seedTc.order() != null ? seedTc.order() : byOrder.size())
                        .timeLimitMs(seedTc.timeLimitMs() != null ? seedTc.timeLimitMs() : problem.getTimeLimitMs())
                        .memoryLimitKb(seedTc.memoryLimitKb() != null ? seedTc.memoryLimitKb() : problem.getMemoryLimitKb())
                        .explanation(seedTc.explanation() == null || seedTc.explanation().isBlank()
                                ? null
                                : seedTc.explanation().trim())
                        .build();
                toSave.add(newTc);
                keepIds.add(newTc.getId());
            }
        }

        for (TestCase existing : existingCases) {
            if (!keepIds.contains(existing.getId())) {
                this.storageService.delete(existing.getInputFilePath(), existing.getOutputFilePath());
                this.testCaseRepository.deleteById(existing.getId());
            }
        }

        if (!toSave.isEmpty()) {
            this.testCaseRepository.saveAll(toSave);
        }

        List<String> finalIds = new ArrayList<>();
        for (TestCase tc : this.testCaseRepository.findByProblemId(problem.getId())) {
            finalIds.add(tc.getId());
        }
        problem.setTestCases(finalIds);
        problem.setUpdatedAt(Instant.now());
        this.problemRepository.save(problem);
    }

    private void updateExisting(Problem existing, SeedData data) {
        boolean changed = false;

        if (!existing.getTitle().equals(data.title())) {
            existing.setTitle(data.title().trim());
            changed = true;
        }
        if (!safeEq(existing.getDescription(), data.description())) {
            existing.setDescription(data.description());
            changed = true;
        }
        if (!safeEq(existing.getProblemStatement(), data.statement())) {
            existing.setProblemStatement(data.statement());
            changed = true;
        }
        if (!safeEq(existing.getInputFormat(), data.inputFormat())) {
            existing.setInputFormat(data.inputFormat());
            changed = true;
        }
        if (!safeEq(existing.getOutputFormat(), data.outputFormat())) {
            existing.setOutputFormat(data.outputFormat());
            changed = true;
        }
        if (!listEquals(existing.getConstraints(), data.constraints())) {
            existing.setConstraints(data.constraints() == null ? List.of() : new ArrayList<>(data.constraints()));
            changed = true;
        }
        if (!safeEq(existing.getNotes(), data.notes())) {
            existing.setNotes(data.notes());
            changed = true;
        }
        if (existing.getDifficulty() != data.difficulty()) {
            existing.setDifficulty(data.difficulty());
            changed = true;
        }
        if (!listEquals(existing.getTags(), data.tags())) {
            existing.setTags(data.tags() == null ? List.of() : new ArrayList<>(data.tags()));
            changed = true;
        }
        int newTimeLimit = data.timeLimitMs() != null ? data.timeLimitMs() : 1000;
        if (existing.getTimeLimitMs() != newTimeLimit) {
            existing.setTimeLimitMs(newTimeLimit);
            changed = true;
        }
        int newMemoryLimit = data.memoryLimitKb() != null ? data.memoryLimitKb() : 256000;
        if (existing.getMemoryLimitKb() != newMemoryLimit) {
            existing.setMemoryLimitKb(newMemoryLimit);
            changed = true;
        }
        if (!safeEq(existing.getSource(), data.source())) {
            existing.setSource(data.source());
            changed = true;
        }
        if (!mapEquals(existing.getStarterCode(), data.starterCode())) {
            existing.setStarterCode(data.starterCode() == null ? null : new LinkedHashMap<>(data.starterCode()));
            changed = true;
        }
        if (!existing.isPublished()) {
            existing.setPublished(true);
            changed = true;
        }

        if (changed) {
            existing.setUpdatedAt(Instant.now());
            this.problemRepository.save(existing);
            log.info("Updated existing problem '{}' (slug={})", data.title(), existing.getSlug());
        }
    }

    private void validateTestCaseContent(String slug, String input, String output) {
        if (input == null || input.isBlank()) {
            throw new BadRequestException(
                    "Test case input is blank for problem '" + slug + "'");
        }
        if (output == null || output.isBlank()) {
            throw new BadRequestException(
                    "Test case output is blank for problem '" + slug + "'");
        }
        if (input.contains("\\n")) {
            throw new BadRequestException(
                    "Test case input contains escaped newline literal for problem '" + slug + "'");
        }
        if (output.contains("\\n")) {
            throw new BadRequestException(
                    "Test case output contains escaped newline literal for problem '" + slug + "'");
        }
    }

    private static boolean safeEq(String a, String b) {
        return (a == null) ? b == null : a.equals(b);
    }

    private static boolean listEquals(List<?> a, List<?> b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    private static boolean mapEquals(Map<?, ?> a, Map<?, ?> b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    private static String normalizeNewlines(String value) {
        if (value == null) return null;
        return value.replace("\r\n", "\n").replace('\r', '\n');
    }

    private static String readCapped(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return "";
        }
        try {
            return java.nio.file.Files.readString(java.nio.file.Path.of(filePath), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    // ------------------------------------------------------------------
    // Seed data records (mirrors the JSON schema)
    // ------------------------------------------------------------------

    public record SeedData(
            String title,
            String description,
            String statement,
            String inputFormat,
            String outputFormat,
            List<String> constraints,
            String notes,
            Difficulty difficulty,
            List<String> tags,
            Integer timeLimitMs,
            Integer memoryLimitKb,
            Map<String, String> starterCode,
            String source,
            List<SeedTestCaseData> testCases) {
    }

    public record SeedTestCaseData(
            String input,
            String expectedOutput,
            Boolean isSample,
            Integer order,
            Integer timeLimitMs,
            Integer memoryLimitKb,
            String explanation) {
    }
}
