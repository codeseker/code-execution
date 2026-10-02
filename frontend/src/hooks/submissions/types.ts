import type { Language, SubmissionStatus, SubmissionType, Verdict } from "../../types/domain";

/** `modules/submission/dtos/SubmitRequest` */
export type SubmitRequest = {
    code: string;
    language: Language;
};

/** `modules/submission/dtos/RunRequest` - the caller's own stdin. */
export type RunRequest = {
    code: string;
    language: Language;
    input?: string | null;
};

/** `modules/submission/dtos/SubmitResponse` - the JOB_QUEUED acknowledgement. */
export type SubmitAck = {
    submissionId: string;
    status: SubmissionStatus;
    queuePosition: number;
    language: Language;
    type: SubmissionType;
};

/** `SubmissionResultResponse.TestCaseResultResponse` */
export type TestCaseResult = {
    testCaseId: string | null;
    status: Verdict;
    executionTimeMs: number;
    memoryUsedKb: number;
    /** Only populated for EXAMPLE_EVAL / CUSTOM_RUN runs. */
    stdout: string | null;
    stderr: string | null;
    expectedOutput: string | null;
    actualOutput: string | null;
};

/** `modules/submission/dtos/SubmissionResultResponse` */
export type SubmissionResult = {
    submissionId: string;
    overallVerdict: Verdict;
    totalExecutionTimeMs: number;
    peakMemoryKb: number;
    passedTestCases: number;
    totalTestCases: number;
    /** Set only for COMPILE_ERROR. */
    compileErrorLogs: string | null;
    testCaseResults: TestCaseResult[];
};

/** `modules/submission/dtos/SubmissionResponse` - `GET /submissions/{id}`. */
export type SubmissionDetail = {
    id: string;
    problemId: string;
    language: Language;
    type: SubmissionType;
    status: SubmissionStatus;
    createdAt: string;
    /** null until the worker finishes. */
    result: SubmissionResult | null;
};

/** `modules/submission/dtos/SubmissionSummaryResponse` - history row. */
export type SubmissionSummary = {
    id: string;
    problemId: string;
    language: Language;
    type: SubmissionType;
    status: SubmissionStatus;
    /** null while queued or processing. */
    verdict: Verdict | null;
    createdAt: string;
};

/** Query params of `GET /users/me/submissions` (1-based page). */
export type SubmissionQuery = {
    problemId?: string;
    status?: SubmissionStatus;
    language?: Language;
    type?: SubmissionType;
    page?: number;
    limit?: number;
};

/** `SubmissionEventPublisher` frames pushed into `submission:<id>`. */
export type SubmissionEvent =
    | { event: "JOB_QUEUED"; submissionId: string; queuePosition: number; language: string }
    | { event: "JOB_PROCESSING"; submissionId: string }
    | {
          event: "TESTCASE_PROGRESS";
          submissionId: string;
          passed: number;
          completed: number;
          total: number;
          lastVerdict: string | null;
      }
    | { event: "JOB_COMPLETED"; submissionId: string; result: SubmissionResult | null }
    | { event: "JOB_FAILED"; submissionId: string; error: string }
    | { event: "ERROR"; message: string };

/** Drops empty filters so the backend keeps its own defaults. */
export function toSubmissionParams(query: SubmissionQuery): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== "" && value !== null),
    );
}