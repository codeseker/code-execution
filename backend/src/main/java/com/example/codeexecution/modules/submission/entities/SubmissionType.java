package com.example.codeexecution.modules.submission.entities;

/** What kind of evaluation the submission asks for. */
public enum SubmissionType {
    /** Runs only the public sample test cases (fast feedback loop). */
    EXAMPLE_EVAL,
    /** Runs all hidden and public test cases; affects statistics. */
    FULL_SUBMISSION
}
