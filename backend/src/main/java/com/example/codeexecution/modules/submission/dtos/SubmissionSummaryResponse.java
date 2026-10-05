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
 *
 * @param problemTitle resolved from {@code problemId} so the list needs no
 *                     extra request; null when the problem was removed
 * @param runtimeMs    summed wall clock of the whole run; null until judged
 * @param memoryKb     peak memory of the run; null until judged
 */
public record SubmissionSummaryResponse(
        String id,
        String problemId,
        String problemTitle,
        Language language,
        SubmissionType type,
        SubmissionStatus status,
        Verdict verdict,
        Long runtimeMs,
        Long memoryKb,
        Instant createdAt) {
}