import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../utils/api/methods";
import { ENDPOINTS } from "./endpoints";
import type { AdminStats, AdminUser, AdminUserQuery } from "./types";
import type { PaginationMeta } from "../../types/api-response";

export const adminKeys = {
    usersRoot: ["admin", "users"] as const,
    users: (query: AdminUserQuery) => ["admin", "users", query] as const,
    stats: ["admin", "stats"] as const,
};

/** `GET /admin/users` - paginated directory, soft-deleted hidden by default. */
export function useAdminUsers(query: AdminUserQuery = {}) {
    const params = Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== "" && value !== null),
    );

    const result = useQuery({
        queryKey: adminKeys.users(query),
        queryFn: async (): Promise<{ users: AdminUser[]; pagination: PaginationMeta | null }> => {
            const response = await apiGet<AdminUser[]>(ENDPOINTS.USERS, params);
            return { users: response.data ?? [], pagination: response.pagination };
        },
        staleTime: 15_000,
        retry: false,
    });

    return {
        users: result.data?.users ?? [],
        pagination: result.data?.pagination ?? null,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}

/** `GET /admin/stats` - accounts, catalogue and judge throughput counters. */
export function useAdminStats() {
    const result = useQuery({
        queryKey: adminKeys.stats,
        queryFn: async (): Promise<AdminStats> => {
            const response = await apiGet<AdminStats>(ENDPOINTS.STATS);
            return response.data;
        },
        staleTime: 30_000,
        retry: false,
    });

    return { stats: result.data, loading: result.isPending, error: result.error, refetch: result.refetch };
}