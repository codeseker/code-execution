package com.example.codeexecution.modules.list.dtos;

import java.util.List;

/** Full payload of {@code GET /users/me/lists/{id}}: metadata + problems. */
public record ListDetailResponse(
        ProblemListResponse list,
        List<ProblemSummaryResponse> problems) {
}
