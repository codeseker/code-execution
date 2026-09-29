package com.example.codeexecution.modules.submission.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Per-testcase breakdown embedded in {@link SubmissionResult}.
 *
 * {@code stdout}/{@code expectedOutput}/{@code actualOutput} are stored for
 * sample cases (for the instant feedback loop) and left null for hidden
 * full-submission runs so they are never exposed to the client.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class TestCaseResult {

    private String testCaseId;

    private Verdict status;

    private long executionTimeMs;

    private long memoryUsedKb;

    private String stdout;

    private String stderr;

    private String expectedOutput;

    private String actualOutput;
}
