package com.example.codeexecution.modules.submission.entities;

/**
 * Visibility class of one judged case, which decides how much of its IO may
 * leave the server. This is a property of the CASE, not of the submission
 * type: a full submission still shows the IO of every public sample case.
 *
 * <ul>
 *   <li>{@link #SAMPLE} - public sample, exposed by
 *       {@code GET /problems/{slug}}; input, expected and actual are safe to
 *       show on every run type.</li>
 *   <li>{@link #CUSTOM} - stdin the caller typed into a "Custom N" tab. When
 *       the caller also supplied an expected output the case is graded
 *       normally; otherwise it is executed only and can never be a
 *       WRONG_ANSWER.</li>
 *   <li>{@link #HIDDEN} - private judge case. Its input and expected output
 *       must never reach the client, through any event, response or log.</li>
 * </ul>
 */
public enum JudgeCaseKind {
    SAMPLE,
    CUSTOM,
    HIDDEN
}