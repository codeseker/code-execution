package com.example.codeexecution.modules.problem;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.mock.env.MockEnvironment;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;

/**
 * Validates the seed data files on the classpath: schema, required fields,
 * sample count, explanation presence, and newline sanity.
 */
class ProblemSeederSchemaTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern ESCAPED_NEWLINE = Pattern.compile("\\\\n");

    @Test
    void allSeedFilesAreValidJson() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

        assertTrue(resources.length >= 25,
                "Expected at least 25 seed problems, found " + resources.length);

        for (Resource resource : resources) {
            assertDoesNotThrow(() -> readSeedData(resource),
                    "Invalid JSON: " + resource.getFilename());
        }
    }

    @Test
    void everyProblemHasRequiredFields() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

        for (Resource resource : resources) {
            ProblemSeeder.SeedData data = readSeedData(resource);

            assertTrue(data.title() != null && !data.title().isBlank(),
                    "Missing title in " + resource.getFilename());
            assertTrue(data.statement() != null && !data.statement().isBlank(),
                    "Missing statement in " + resource.getFilename());
            assertTrue(data.inputFormat() != null && !data.inputFormat().isBlank(),
                    "Missing inputFormat in " + resource.getFilename());
            assertTrue(data.outputFormat() != null && !data.outputFormat().isBlank(),
                    "Missing outputFormat in " + resource.getFilename());
            assertTrue(data.difficulty() != null,
                    "Missing difficulty in " + resource.getFilename());
            assertTrue(data.tags() != null && !data.tags().isEmpty(),
                    "Missing tags in " + resource.getFilename());
            assertTrue(data.testCases() != null && data.testCases().size() >= 2,
                    "Need at least 2 test cases in " + resource.getFilename());
        }
    }

    @Test
    void everySampleTestCaseHasExplanation() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

        for (Resource resource : resources) {
            ProblemSeeder.SeedData data = readSeedData(resource);
            long samplesWithoutExplanation = data.testCases().stream()
                    .filter(ProblemSeeder.SeedTestCaseData::isSample)
                    .filter(tc -> tc.explanation() == null || tc.explanation().isBlank())
                    .count();

            assertTrue(samplesWithoutExplanation == 0,
                    "Sample test cases without explanation in " + resource.getFilename()
                            + ": " + samplesWithoutExplanation);
        }
    }

    @Test
    void noTestCaseContainsEscapedNewlineLiterals() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

        for (Resource resource : resources) {
            ProblemSeeder.SeedData data = readSeedData(resource);

            for (ProblemSeeder.SeedTestCaseData tc : data.testCases()) {
                String input = tc.input();
                String output = tc.expectedOutput();

                assertTrue(input == null || !ESCAPED_NEWLINE.matcher(input).find(),
                        "Input contains escaped newline literal in " + resource.getFilename());
                assertTrue(output == null || !ESCAPED_NEWLINE.matcher(output).find(),
                        "Output contains escaped newline literal in " + resource.getFilename());
            }
        }
    }

    @Test
    void atLeastTwoSampleTestCasesPerProblem() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

        for (Resource resource : resources) {
            ProblemSeeder.SeedData data = readSeedData(resource);
            long sampleCount = data.testCases().stream()
                    .filter(ProblemSeeder.SeedTestCaseData::isSample)
                    .count();

            assertTrue(sampleCount >= 2,
                    "Need at least 2 sample test cases in " + resource.getFilename()
                            + ", found " + sampleCount);
        }
    }

    @Test
    void correctDifficultyDistribution() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:seed/problems/*.json");

        long easy = 0, medium = 0, hard = 0;
        for (Resource resource : resources) {
            ProblemSeeder.SeedData data = readSeedData(resource);
            switch (data.difficulty()) {
                case EASY -> easy++;
                case MEDIUM -> medium++;
                case HARD -> hard++;
            }
        }

        assertTrue(easy >= 8 && easy <= 12,
                "Expected 8-12 Easy problems, found " + easy);
        assertTrue(medium >= 8 && medium <= 12,
                "Expected 8-12 Medium problems, found " + medium);
        assertTrue(hard >= 4 && hard <= 6,
                "Expected 4-6 Hard problems, found " + hard);
    }

    private ProblemSeeder.SeedData readSeedData(Resource resource) throws IOException {
        try (InputStream is = resource.getInputStream();
             InputStreamReader reader = new InputStreamReader(is, StandardCharsets.UTF_8)) {
            return MAPPER.readValue(reader, ProblemSeeder.SeedData.class);
        }
    }
}
