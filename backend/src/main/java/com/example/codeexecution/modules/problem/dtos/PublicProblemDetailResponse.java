package com.example.codeexecution.modules.problem.dtos;

import java.util.List;
import java.util.Map;

import com.example.codeexecution.modules.problem.entities.Difficulty;

/**
 * Full public payload of {@code GET /problems/{slug}}: markdown statement,
 * limits, per-language starter templates and <b>only</b> the public sample
 * test cases (with their actual input/output text, never file paths).
 */
public record PublicProblemDetailResponse(
        String id,
        String title,
        String slug,
        String description,
        String problemStatement,
        Difficulty difficulty,
        List<String> tags,
        int defaultTimeLimitMs,
        int defaultMemoryLimitKb,
        Map<String, String> languageTemplates,
        List<SampleTestCase> sampleTestCases) {

    /** A public sample case with its literal input/output text. */
    public record SampleTestCase(
            String id,
            String input,
            String output,
            int timeLimitMs,
            int memoryLimitKb) {
    }
}
