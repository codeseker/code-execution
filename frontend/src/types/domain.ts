/**
 * Enumerations mirrored 1:1 from the backend. Every member below exists as a
 * Java enum constant, so the wire values are used verbatim - never renamed.
 */

/** modules/problem/entities/Difficulty.java */
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export const DIFFICULTIES: readonly Difficulty[] = ["EASY", "MEDIUM", "HARD"] as const;

/** modules/submission/entities/Language.java - lowercase by design. */
export type Language = "cpp" | "java" | "python" | "javascript";
export const LANGUAGES: readonly Language[] = ["cpp", "java", "python", "javascript"] as const;

/** modules/submission/entities/SubmissionStatus.java */
export type SubmissionStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
export const SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
    "QUEUED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
] as const;

/** modules/submission/entities/SubmissionType.java */
export type SubmissionType = "EXAMPLE_EVAL" | "FULL_SUBMISSION" | "CUSTOM_RUN";
export const SUBMISSION_TYPES: readonly SubmissionType[] = [
    "EXAMPLE_EVAL",
    "FULL_SUBMISSION",
    "CUSTOM_RUN",
] as const;

/** modules/submission/entities/Verdict.java */
export type Verdict =
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "COMPILE_ERROR"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "SYSTEM_ERROR";
export const VERDICTS: readonly Verdict[] = [
    "ACCEPTED",
    "WRONG_ANSWER",
    "COMPILE_ERROR",
    "TIME_LIMIT_EXCEEDED",
    "MEMORY_LIMIT_EXCEEDED",
    "RUNTIME_ERROR",
    "SYSTEM_ERROR",
] as const;

/** modules/auth/entities/UserStatus.java */
export type UserStatus = "PENDING" | "ACTIVE";

/**
 * modules/rbac/entities/Role.java. `role` on the auth responses is the role
 * *name* resolved from `User.roleId`, never the raw id.
 */
export type UserRole = "ADMIN" | "PROBLEM_SETTER" | "USER";

/** Terminal queue states - a job in one of these will never change again. */
export const TERMINAL_SUBMISSION_STATUSES: readonly SubmissionStatus[] = ["COMPLETED", "FAILED"] as const;

export function isTerminalSubmissionStatus(status: SubmissionStatus): boolean {
    return TERMINAL_SUBMISSION_STATUSES.includes(status);
}

/** `modules/submission/entities/JudgeCaseKind` - visibility class of one case. */
export type TestCaseKind = "SAMPLE" | "CUSTOM" | "HIDDEN";
export const TEST_CASE_KINDS: readonly TestCaseKind[] = ["SAMPLE", "CUSTOM", "HIDDEN"] as const;

/**
 * Only hidden judge cases keep their data server-side; every run type reports
 * the IO of the public samples it ran, so a failed submission can still be
 * explained.
 */
export function exposesIo(kind: TestCaseKind | null | undefined): boolean {
    return kind !== "HIDDEN";
}