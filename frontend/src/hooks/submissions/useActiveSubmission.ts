import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isTerminalSubmissionStatus } from "../../types/domain";
import useSubmission from "./useSubmissions";
import useSubmissionSocket from "./useSubmissionSocket";
import { submissionKeys } from "./keys";
import type { SubmissionEvent, SubmissionResult } from "./types";
import type { TestCaseKind, Verdict } from "../../types/domain";

export type RunPhase = "idle" | "queued" | "processing" | "completed" | "failed";

export type RunProgress = {
    passed: number;
    completed: number;
    total: number;
    lastVerdict: string | null;
};

/** One finished case, exactly as `CASE_RESULT` reported it. */
export type RunCaseResult = {
    caseIndex: number;
    caseId: string;
    kind: TestCaseKind;
    status: Verdict;
    input: string | null;
    expectedOutput: string | null;
    actualOutput: string | null;
    stdout: string | null;
    stderr: string | null;
    runtimeMs: number;
    memoryKb: number;
};

/** Terminal summary of the run stream, from `RUN_FINISHED`. */
export type RunSummary = {
    overallStatus: Verdict;
    passedCount: number;
    totalCount: number;
    failedCaseIndex: number | null;
    totalRuntimeMs: number;
    peakMemoryKb: number;
    compileError: string | null;
};

/**
 * Everything the run stream produced for one submission. The state is tagged
 * with the run id so a frame from an older run can be discarded on read
 * instead of needing an effect to clear it.
 */
type RunStreamState = {
    runId: string | null;
    totalCases: number;
    cases: RunCaseResult[];
    summary: RunSummary | null;
    progress: RunProgress | null;
    failureReason: string | null;
};

const EMPTY_RUN: RunStreamState = {
    runId: null,
    totalCases: 0,
    cases: [],
    summary: null,
    progress: null,
    failureReason: null,
};

/**
 * Tracks one judging job from `JOB_QUEUED` to its verdict.
 *
 * Two transports feed the same state, because neither is sufficient alone:
 * the `/ws` gateway streams per-case results (`RUN_STARTED`, `CASE_RESULT`,
 * `RUN_FINISHED`) so each testcase tab can light up as its case lands, while
 * `GET /submissions/{id}` stays the authoritative record - it owns the final
 * verdict, the counts and stops polling once the job is terminal.
 *
 * **Run isolation.** One run is one submission, so the stream's `runId`
 * equals the submission id. Frames carrying a different `runId` are dropped,
 * and state left over from a previous run is filtered out on read, so a late
 * event can never repaint the current run.
 */
export default function useActiveSubmission(submissionId: string | null) {
    const queryClient = useQueryClient();
    const isLive = Boolean(submissionId);
    const [stream, setStream] = useState<RunStreamState>(EMPTY_RUN);

    // Read by the memoised event handler, which cannot depend on it.
    const runIdRef = useRef<string | null>(submissionId);
    runIdRef.current = submissionId;

    const onEvent = useCallback(
        (event: SubmissionEvent) => {
            switch (event.event) {
                case "RUN_STARTED": {
                    if (event.runId !== runIdRef.current) return;
                    // A new run starts from a clean slate.
                    setStream({
                        ...EMPTY_RUN,
                        runId: event.runId,
                        totalCases: event.totalCases,
                    });
                    return;
                }
                case "CASE_RESULT": {
                    if (event.runId !== runIdRef.current) return;
                    const result: RunCaseResult = {
                        caseIndex: event.caseIndex,
                        caseId: event.caseId,
                        kind: event.kind,
                        status: event.status,
                        input: event.input,
                        expectedOutput: event.expectedOutput,
                        actualOutput: event.actualOutput,
                        stdout: event.stdout,
                        stderr: event.stderr,
                        runtimeMs: event.runtimeMs,
                        memoryKb: event.memoryKb,
                    };
                    setStream((current) => {
                        const cases = current.runId === event.runId
                            ? current.cases.filter((item) => item.caseIndex !== result.caseIndex)
                            : [];
                        return {
                            ...current,
                            runId: event.runId,
                            cases: [...cases, result].sort((a, b) => a.caseIndex - b.caseIndex),
                        };
                    });
                    return;
                }
                case "RUN_FINISHED": {
                    if (event.runId !== runIdRef.current) return;
                    setStream((current) => ({
                        ...current,
                        runId: event.runId,
                        progress: null,
                        summary: {
                            overallStatus: event.overallStatus,
                            passedCount: event.passedCount,
                            totalCount: event.totalCount,
                            failedCaseIndex: event.failedCaseIndex ?? null,
                            totalRuntimeMs: event.totalRuntimeMs,
                            peakMemoryKb: event.peakMemoryKb,
                            compileError: event.compileError ?? null,
                        },
                    }));
                    return;
                }
                case "TESTCASE_PROGRESS":
                    if (event.submissionId !== runIdRef.current) return;
                    setStream((current) => ({
                        ...current,
                        progress: {
                            passed: event.passed,
                            completed: event.completed,
                            total: event.total,
                            lastVerdict: event.lastVerdict,
                        },
                    }));
                    return;
                case "JOB_FAILED":
                    setStream((current) => ({
                        ...current,
                        progress: null,
                        failureReason: event.error,
                    }));
                    void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(event.submissionId) });
                    return;
                case "JOB_COMPLETED":
                    setStream((current) => ({ ...current, progress: null, failureReason: null }));
                    // Pull the authoritative record (it owns the final verdict,
                    // the pass/fail counts and the failing case index).
                    void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(event.submissionId) });
                    return;
                default:
                    return;
            }
        },
        [queryClient],
    );

    const { live } = useSubmissionSocket(submissionId, onEvent, { enabled: isLive });

    const { submission, loading, error, refetch } = useSubmission(submissionId ?? undefined, {
        live: isLive,
    });

    const status = submission?.status ?? null;
    const result: SubmissionResult | null = submission?.result ?? null;

    const phase: RunPhase = !submissionId
        ? "idle"
        : status === "COMPLETED"
          ? "completed"
          : status === "FAILED"
            ? "failed"
            : status === "PROCESSING"
              ? "processing"
              : "queued";

    const busy = phase === "queued" || phase === "processing";
    const terminal = Boolean(status && isTerminalSubmissionStatus(status));
    // Anything streamed for a different run belongs to a previous submission.
    const current = stream.runId === submissionId ? stream : EMPTY_RUN;

    return {
        submissionId,
        submission,
        status,
        result,
        phase,
        busy,
        terminal,
        live,
        runId: current.runId,
        totalCases: current.totalCases,
        /** Live per-case results, in run order. */
        cases: current.cases,
        summary: current.summary,
        progress: current.progress,
        failureReason: current.failureReason,
        loading: loading && isLive,
        error,
        refetch,
    };
}