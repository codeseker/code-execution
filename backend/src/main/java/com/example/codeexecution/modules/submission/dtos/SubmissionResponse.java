package com.example.codeexecution.modules.submission.dtos;

import java.time.Instant;

import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;

/**
 * Client-facing view of one submission, as returned by
 * {@code GET /submissions/{id}}.
 *
 * <p>Unlike the history row it carries the <b>source code the caller
 * submitted</b> so an owner (or an admin holding {@code submission:read}) can
 * open any submission and read what was run. The endpoint is owner-scoped, so
 * this never leaks another user's code.
 */
public record SubmissionResponse(
        String id,
        String problemId,
        String problemTitle,
        Language language,
        SubmissionType type,
        SubmissionStatus status,
        /** The submitted source, as judged. */
        String code,
        Instant createdAt,
        SubmissionResultResponse result) {
}