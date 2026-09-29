package com.example.codeexecution.modules.submission.dtos;

import com.example.codeexecution.modules.submission.entities.Language;

/**
 * The lightweight Redis queue payload. Heavy data (source code, testcase
 * files) is intentionally NOT included: workers fetch it from Mongo/disk
 * when they pick the job up.
 */
public record JobMessage(
        String submissionId,
        String problemId,
        String userId,
        Language language,
        boolean isExample) {
}
