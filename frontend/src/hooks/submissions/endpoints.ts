/**
 * `SubmissionController` has no `@RequestMapping` prefix, so every route sits
 * at the application root.
 */
const problem = (id: string) => `/problems/${encodeURIComponent(id)}`;

export const ENDPOINTS = {
    /** All hidden and public test cases; affects stats. */
    SUBMIT: (id: string) => `${problem(id)}/submit`,
    /** Public sample cases only. */
    EXAMPLE_EVAL: (id: string) => `${problem(id)}/example-eval`,
    /** Caller-provided stdin, no stored cases, no stats. */
    RUN: (id: string) => `${problem(id)}/run`,
    DETAIL: (id: string) => `/submissions/${encodeURIComponent(id)}`,
    MINE: "/users/me/submissions",
} as const;