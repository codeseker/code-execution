package com.example.codeexecution.modules.list.dtos;

import java.util.List;

import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;

/**
 * Public-style problem summary used by list and bookmark payloads:
 * enough to render a row, never statement internals or test case paths.
 */
public record ProblemSummaryResponse(
        String _id,
        String title,
        String slug,
        String description,
        Difficulty difficulty,
        List<String> tags) {

    public static ProblemSummaryResponse from(Problem problem) {
        return new ProblemSummaryResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getSlug(),
                problem.getDescription(),
                problem.getDifficulty(),
                problem.getTags() == null ? List.of() : problem.getTags());
    }
}
