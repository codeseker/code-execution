package com.example.codeexecution.modules.submission.entities;

/** What kind of evaluation the submission asks for. */
public enum SubmissionType {
    /** Runs only the public sample test cases (fast feedback loop). */
    EXAMPLE_EVAL,
    /** Runs all hidden and public test cases; affects statistics. */
    FULL_SUBMISSION,
    /**
     * LeetCode's "Run" button: executes the code against the problem's own
     * sample test cases plus the caller's own custom test cases - no stored
     * hidden case is used, no statistics change, and a custom case can never
     * be a WRONG_ANSWER (there is nothing to compare against).
     */
    CUSTOM_RUN;

    /**
     * Whether the judge stops at the first failing case. A full submission
     * does (standard judge behaviour, and it stops burning sandbox time once
     * the verdict is decided); the sample runs do not, because every tab in
     * the workspace must get its own pass/fail dot.
     */
    public boolean stopsAtFirstFailure() {
        return this == FULL_SUBMISSION;
    }
}
