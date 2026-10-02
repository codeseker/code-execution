import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isTerminalSubmissionStatus } from "../../types/domain";
import useSubmission from "./useSubmissions";
import useSubmissionSocket from "./useSubmissionSocket";
import { submissionKeys } from "./keys";
import type { SubmissionEvent, SubmissionResult } from "./types";

export type RunPhase = "idle" | "queued" | "processing" | "completed" | "failed";

export type RunProgress = {
    passed: number;
    completed: number;
    total: number;
    lastVerdict: string | null;
};

/**
 * Tracks one judging job from `JOB_QUEUED` to its verdict.
 *
 * Two transports feed the same state, because neither is sufficient alone:
 * the `/ws` gateway pushes lifecycle events (including per-testcase progress
 * and the failure reason), while `GET /submissions/{id}` is the documented
 * polling fallback and stays authoritative - it owns the full result payload
 * and stops polling as soon as the job is terminal. Terminal socket events
 * only invalidate the query.
 */
export default function useActiveSubmission(submissionId: string | null) {
    const queryClient = useQueryClient();
    const isLive = Boolean(submissionId);
    const [failureReason, setFailureReason] = useState<string | null>(null);
    const [progress, setProgress] = useState<RunProgress | null>(null);

    const { submission, loading, error, refetch } = useSubmission(submissionId ?? undefined, { live: isLive });

    const onEvent = useCallback(
        (event: SubmissionEvent) => {
            switch (event.event) {
                case "TESTCASE_PROGRESS":
                    setProgress({
                        passed: event.passed,
                        completed: event.completed,
                        total: event.total,
                        lastVerdict: event.lastVerdict,
                    });
                    return;
                case "JOB_FAILED":
                    setFailureReason(event.error);
                    void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(event.submissionId) });
                    return;
                case "JOB_COMPLETED":
                    setProgress(null);
                    setFailureReason(null);
                    // Pull the authoritative record (it carries the per-testcase
                    // IO the socket event omits for full submissions).
                    void queryClient.invalidateQueries({ queryKey: submissionKeys.detail(event.submissionId) });
                    return;
                default:
                    return;
            }
        },
        [queryClient],
    );

    const { live } = useSubmissionSocket(submissionId, onEvent, { enabled: isLive });

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

    return {
        submissionId,
        submission,
        status,
        result,
        phase,
        busy,
        terminal,
        live,
        progress,
        failureReason,
        loading: loading && isLive,
        error,
        refetch,
    };
}