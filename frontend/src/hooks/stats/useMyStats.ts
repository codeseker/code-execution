import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../utils/api/methods";
import { ENDPOINTS } from "./endpoints";
import type { UserStats } from "./types";

export const statsKeys = {
    mine: ["users", "me", "stats"] as const,
};

/** `GET /users/me/stats` - the counters a full submission moves. */
export default function useMyStats(options: { enabled?: boolean } = {}) {
    const enabled = options.enabled ?? true;

    const result = useQuery({
        queryKey: statsKeys.mine,
        queryFn: async (): Promise<UserStats> => {
            const response = await apiGet<UserStats>(ENDPOINTS.MINE);
            return response.data;
        },
        enabled,
        staleTime: 30_000,
    });

    return {
        stats: result.data,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}