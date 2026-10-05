import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../utils/api/methods";
import { ENDPOINTS } from "./endpoints";
import { submissionKeys } from "./keys";
import type { SubmissionDetail, SubmissionQuery, SubmissionSummary } from "./types";
import type { PaginationMeta } from "../../types/api-response";
import { isTerminalSubmissionStatus } from "../../types/domain";
import { toSubmissionParams } from "./types";

/** Poll interval for the non-websocket fallback (ms). */
const POLL_INTERVAL = 2_000;

/**
 * `GET /submissions/{id}` - the documented polling fallback for the WebSocket
 * lifecycle events. Polling stops as soon as the job reaches a terminal state,
 * which keeps the request count at one per finished job.
 */
export default function useSubmission(id: string | undefined, options: { live?: boolean } = {}) {
    const live = options.live ?? false;

    const result = useQuery({
        queryKey: submissionKeys.detail(id ?? ""),
        queryFn: async (): Promise<SubmissionDetail> => {
            const response = await apiGet<SubmissionDetail>(ENDPOINTS.DETAIL(id ?? ""));
            return response.data;
        },
        enabled: Boolean(id),
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status && isTerminalSubmissionStatus(status)) return false;
            return live ? POLL_INTERVAL : false;
        },
    });

    return {
        submission: result.data,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}

/** `GET /users/me/submissions` - the caller's own history, newest first. */
export function useMySubmissions(query: SubmissionQuery = {}, options: { enabled?: boolean } = {}) {
    const enabled = options.enabled ?? true;
    const params = toSubmissionParams(query);
    params["type"] = "FULL_SUBMISSION"; 

    const result = useQuery({
        queryKey: submissionKeys.list(query),
        queryFn: async (): Promise<{ submissions: SubmissionSummary[]; pagination: PaginationMeta | null }> => {
            const response = await apiGet<SubmissionSummary[]>(ENDPOINTS.MINE, params);
            return { submissions: response.data ?? [], pagination: response.pagination };
        },
        enabled,
        staleTime: 15_000,
    });

    return {
        submissions: result.data?.submissions ?? [],
        pagination: result.data?.pagination ?? null,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}