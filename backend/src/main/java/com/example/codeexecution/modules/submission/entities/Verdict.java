package com.example.codeexecution.modules.submission.entities;

/**
 * The execution verdict matrix. The same values are used for the overall
 * result and for individual test cases ({@code COMPILE_ERROR} and
 * {@code SYSTEM_ERROR} only ever appear as overall verdicts).
 */
public enum Verdict {
    ACCEPTED,
    WRONG_ANSWER,
    COMPILE_ERROR,
    TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED,
    RUNTIME_ERROR,
    SYSTEM_ERROR
}
