package com.example.codeexecution.modules.problem.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filters for {@code GET /admin/problems}. Pagination uses {@code page}
 * (1-based) and {@code limit}.
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ProblemQueryDTO {

    /** Case-insensitive match against title, description and slug. */
    private String search;

    /** One of EASY / MEDIUM / HARD (ignored otherwise). */
    private String difficulty;

    /** Exact tag match. */
    private String tag;

    private int page = 1;

    private int limit = 10;
}
