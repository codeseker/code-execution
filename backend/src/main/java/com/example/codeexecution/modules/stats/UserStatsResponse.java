package com.example.codeexecution.modules.stats;

import java.util.Set;

/**
 * Public shape of {@code GET /users/me/stats}.
 */
public record UserStatsResponse(
        int solvedCount,
        Set<String> solvedProblemIds,
        int totalSubmissions,
        int acceptedSubmissions,
        Double acceptanceRate) {
}
