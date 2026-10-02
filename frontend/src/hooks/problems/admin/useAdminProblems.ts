import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { problemKeys } from "../keys";
import type { AdminProblem, AdminProblemQuery } from "../types";
import type { PaginationMeta } from "../../../types/api-response";
import { toQueryParams } from "../types";

/** `GET /admin/problems` - requires the `problem:read` permission. */
export default function useAdminProblems(query: AdminProblemQuery = {}) {
    const params = toQueryParams(query);

    const result = useQuery({
        queryKey: problemKeys.adminList(query),
        queryFn: async (): Promise<{ problems: AdminProblem[]; pagination: PaginationMeta | null }> => {
            const response = await apiGet<AdminProblem[]>(ENDPOINTS.ADMIN_LIST, params);
            return { problems: response.data ?? [], pagination: response.pagination };
        },
        staleTime: 15_000,
    });

    return {
        problems: result.data?.problems ?? [],
        pagination: result.data?.pagination ?? null,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}