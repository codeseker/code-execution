package com.example.codeexecution.modules.submission.dtos;

import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;

/**
 * Acknowledgement returned as soon as the job is accepted into Redis.
 * Mirrors the {@code JOB_QUEUED} WebSocket event.
 */
public record SubmitResponse(
        String submissionId,
        SubmissionStatus status,
        int queuePosition,
        Language language,
        SubmissionType type) {
}
