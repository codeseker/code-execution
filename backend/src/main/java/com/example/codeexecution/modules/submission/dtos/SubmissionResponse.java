package com.example.codeexecution.modules.submission.dtos;

import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;

import java.time.Instant;

/**
 * Client-facing view of a submission; {@code result} is null until the
 * worker finishes.
 */
public record SubmissionResponse(
        String id,
        String problemId,
        Language language,
        SubmissionType type,
        SubmissionStatus status,
        Instant createdAt,
        SubmissionResultResponse result) {
}
