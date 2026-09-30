package com.example.codeexecution.modules.submission.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filters for {@code GET /users/me/submissions}. Pagination uses
 * {@code page} (1-based) and {@code limit}. The enum filters are raw
 * query-param strings; invalid values are rejected with 400 by the
 * service when it parses them.
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SubmissionQueryDTO {

    /** Exact problem id match. */
    private String problemId;

    /** One of QUEUED / PROCESSING / COMPLETED / FAILED (ignored otherwise). */
    private String status;

    /** One of cpp / java / python / javascript (ignored otherwise). */
    private String language;

    /** One of EXAMPLE_EVAL / FULL_SUBMISSION / CUSTOM_RUN (ignored otherwise). */
    private String type;

    private int page = 1;

    private int limit = 10;
}
