package com.example.codeexecution.modules.submission.dtos;

import java.time.Instant;

import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;
import com.example.codeexecution.modules.submission.entities.Verdict;

/**
 * One row of {@code GET /users/me/submissions}: the lightweight history
 * view without source code or per-testcase output. {@code verdict} is the
 * overall verdict of the finished run and stays null while the job is
 * still queued or processing.
 */
public record SubmissionSummaryResponse(
        String id,
        String problemId,
        Language language,
        SubmissionType type,
        SubmissionStatus status,
        Verdict verdict,
        Instant createdAt) {
}
