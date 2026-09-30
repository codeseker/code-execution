package com.example.codeexecution.modules.problem.dtos;

import java.util.List;

import com.example.codeexecution.modules.problem.entities.Difficulty;

/**
 * Public metadata of a published problem for {@code GET /problems}.
 * Deliberately excludes statement, test case paths and anything hidden.
 */
public record PublicProblemResponse(
        String id,
        String title,
        String slug,
        String description,
        Difficulty difficulty,
        List<String> tags,
        long totalSubmissions,
        long acceptedSubmissions,
        Double acceptanceRate) {
}
