import type { Language, SubmissionStatus, SubmissionType, TestCaseKind, Verdict } from "../../types/domain";

/** `modules/submission/dtos/SubmitRequest` */
export type SubmitRequest = {
    code: string;
    language: Language;
};

/**
 * One entry of `customTestcases` - `modules/submission/dtos/CustomTestCaseRequest`.
 *
 * `expectedOutput` is optional: leave it empty to just see what the code
 * prints, fill it in to get a normal pass/fail verdict for the case.
 */
export type CustomTestcase = {
    customInput: string;
    expectedOutput: string;
};

/**
 * `modules/submission/dtos/RunRequest`, shared by
 * `POST /problems/{id}/run` and `POST /problems/{id}/example-eval`.
 *
 * The sample test cases are NOT sent: the judge loads them from storage so
 * they can never be overridden, injected or reordered from the client. Only
 * the caller's own "Custom N" cases travel with the request, in tab order,
 * and each one carries its input plus an optional expected output.
 */
export type RunRequest = {
    code: string;
    language: Language;
    customTestcases?: CustomTestcase[] | null;
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
    /** 1-based position in the run; null on results stored before it existed. */
    caseIndex?: number | null;
    /** Visibility class of the case; null on results stored before it existed. */
    kind?: TestCaseKind | null;
    status: Verdict;
    executionTimeMs: number;
    memoryUsedKb: number;
    /**
     * Populated for sample and custom cases. Always null for HIDDEN cases -
     * their input and expected output never leave the server. An empty string
     * means the program printed nothing, which is different from null.
     */
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
    /** Set only for COMPILE_ERROR, or the reason for SYSTEM_ERROR. */
    compileErrorLogs: string | null;
    /** 1-based index of the first failing case; null when accepted. */
    failedCaseIndex?: number | null;
    testCaseResults: TestCaseResult[];
};

/** `modules/submission/dtos/SubmissionResponse` - `GET /submissions/{id}`. */
export type SubmissionDetail = {
    id: string;
    problemId: string;
    /** Resolved server-side; null when the problem was removed. */
    problemTitle: string | null;
    language: Language;
    type: SubmissionType;
    status: SubmissionStatus;
    /** The source that was submitted, as judged. */
    code: string | null;
    createdAt: string;
    /** null until the worker finishes. */
    result: SubmissionResult | null;
};

/** `modules/submission/dtos/SubmissionSummaryResponse` - history row. */
export type SubmissionSummary = {
    id: string;
    problemId: string;
    /** Resolved server-side; null when the problem was removed. */
    problemTitle: string | null;
    language: Language;
    type: SubmissionType;
    status: SubmissionStatus;
    /** null while queued or processing. */
    verdict: Verdict | null;
    /** Summed wall clock of the run; null until judged. */
    runtimeMs: number | null;
    /** Peak memory of the run; null until judged. */
    memoryKb: number | null;
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

/**
 * Frames pushed into `submission:<id>` by `SubmissionEventPublisher`.
 *
 * Job lifecycle: JOB_QUEUED -> JOB_PROCESSING -> (CASE_RESULT / RUN_FINISHED)* ->
 * JOB_COMPLETED | JOB_FAILED. Run stream: RUN_STARTED -> CASE_RESULT per case ->
 * exactly one RUN_FINISHED. Every run-stream frame carries `runId` (equal to
 * the submission id, because one run == one submission), so a frame from an
 * earlier run can never overwrite the current one.
 */
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
    | { event: "RUN_STARTED"; submissionId: string; runId: string; totalCases: number }
    | {
          event: "CASE_RESULT";
          submissionId: string;
          runId: string;
          /** 1-based position in the run. */
          caseIndex: number;
          caseId: string;
          kind: TestCaseKind;
          status: Verdict;
          /** null for hidden cases, which must never expose their data. */
          input: string | null;
          /** null when the caller supplied no expected output for this
           *  custom case - the case ran, but was never graded. */
          expectedOutput: string | null;
          /** Empty string = the program printed nothing. null = not exposed. */
          actualOutput: string | null;
          stdout: string | null;
          stderr: string | null;
          runtimeMs: number;
          memoryKb: number;
      }
    | {
          event: "RUN_FINISHED";
          submissionId: string;
          runId: string;
          overallStatus: Verdict;
          passedCount: number;
          totalCount: number;
          failedCaseIndex: number | null;
          totalRuntimeMs: number;
          peakMemoryKb: number;
          compileError?: string | null;
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