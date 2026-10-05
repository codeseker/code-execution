package com.example.codeexecution.modules.problem.dtos;

import java.util.List;
import java.util.Map;

import com.example.codeexecution.modules.problem.entities.Difficulty;

/**
 * Full public payload of {@code GET /problems/{slug}}: structured statement,
 * limits, per-language starter templates, sample cases with explanations,
 * and input/output format hints.
 */
public record PublicProblemDetailResponse(
        String id,
        String slug,
        String title,
        String description,
        Difficulty difficulty,
        List<String> tags,
        String statement,
        String inputFormat,
        String outputFormat,
        List<String> constraints,
        String notes,
        int timeLimitMs,
        int memoryLimitKb,
        Map<String, String> starterCode,
        List<SampleTestCase> sampleTestCases) {

    /** A public sample case with its literal input/output text and explanation. */
    public record SampleTestCase(
            String id,
            String input,
            String output,
            String explanation,
            int timeLimitMs,
            int memoryLimitKb) {
    }
}
