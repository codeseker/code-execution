package com.example.codeexecution.modules.submission.dtos;

import tools.jackson.databind.annotation.JsonDeserialize;

/**
 * One caller-provided test case on {@code POST /problems/{id}/run} and
 * {@code POST /problems/{id}/example-eval}.
 *
 * <p>{@code customInput} is the raw stdin fed to the program.
 * {@code expectedOutput} is OPTIONAL: a caller who only wants to see what their
 * code prints leaves it empty and the judge reports the actual output without
 * a pass/fail verdict. Supplying it turns the case into a normal graded one
 * that can come back WRONG_ANSWER.
 *
 * <p>The problem's own sample cases are never part of this list - they are
 * loaded by the worker from storage so a client can neither override, inject
 * nor reorder them.
 *
 * <p>{@link CustomTestCaseDeserializer} keeps clients that still send a bare
 * string (the pre-2026 {@code customTestcases: ["2\n3"]} shape) working: the
 * string is read as the input and the case gets no expected output.
 */
@JsonDeserialize(using = CustomTestCaseDeserializer.class)
public record CustomTestCaseRequest(String customInput, String expectedOutput) {

    public static CustomTestCaseRequest of(String customInput, String expectedOutput) {
        return new CustomTestCaseRequest(customInput, expectedOutput);
    }

    /**
     * True when the caller supplied an expected output, i.e. when this case
     * is graded instead of only executed.
     */
    public boolean hasExpectedOutput() {
        return this.expectedOutput != null && !this.expectedOutput.isBlank();
    }
}