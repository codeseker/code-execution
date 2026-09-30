package com.example.codeexecution.modules.list.dtos;

import java.time.Instant;
import java.util.List;

/**
 * Client-facing view of a problem list: ids in insertion order plus a
 * precomputed count so listings need no hydration round-trip.
 */
public record ProblemListResponse(
        String _id,
        String name,
        String description,
        boolean system,
        int problemCount,
        List<String> problemIds,
        Instant createdAt,
        Instant updatedAt) {
}
