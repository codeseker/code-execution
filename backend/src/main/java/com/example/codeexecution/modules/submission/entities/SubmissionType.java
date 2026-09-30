package com.example.codeexecution.modules.submission.entities;

/** What kind of evaluation the submission asks for. */
public enum SubmissionType {
    /** Runs only the public sample test cases (fast feedback loop). */
    EXAMPLE_EVAL,
    /** Runs all hidden and public test cases; affects statistics. */
    FULL_SUBMISSION,
    /**
     * LeetCode's "Run" button: executes the code against user-provided
     * input only - no stored test cases, no statistics, no WRONG_ANSWER
     * verdict (there is nothing to compare against).
     */
    CUSTOM_RUN;

    /**
     * Whether the raw per-testcase IO belongs in the public payload:
     * sample runs and custom runs expose their output, full submissions
     * keep hidden test data server-side only.
     */
    public boolean exposesIo() {
        return this == EXAMPLE_EVAL || this == CUSTOM_RUN;
    }
}
