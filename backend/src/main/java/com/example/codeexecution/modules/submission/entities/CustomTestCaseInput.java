package com.example.codeexecution.modules.submission.entities;

/**
 * The persisted form of one caller-provided test case: exactly what the
 * worker stages on disk for a CUSTOM_RUN / EXAMPLE_EVAL job.
 *
 * <p>{@code expectedOutput} is null when the caller only wanted to see the
 * actual output, in which case {@link com.example.codeexecution.modules.submission.services.CaseJudge}
 * has nothing to compare and the case can only be ACCEPTED or an execution
 * verdict.
 */
public record CustomTestCaseInput(String input, String expectedOutput) {

    public boolean hasExpectedOutput() {
        return this.expectedOutput != null && !this.expectedOutput.isBlank();
    }
}