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
 * every case the user is allowed to see (public samples and their own custom
 * inputs) and left null for hidden judge cases, so hidden data can never be
 * exposed to the client.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class TestCaseResult {

    private String testCaseId;

    /**
     * 1-based position of this case in the run. Optional: rows written before
     * per-case streaming existed do not carry it.
     */
    private Integer caseIndex;

    /** Visibility class of the case; null on rows written before this field. */
    private JudgeCaseKind kind;

    private Verdict status;

    private long executionTimeMs;

    private long memoryUsedKb;

    private String stdout;

    private String stderr;

    private String expectedOutput;

    private String actualOutput;
}
