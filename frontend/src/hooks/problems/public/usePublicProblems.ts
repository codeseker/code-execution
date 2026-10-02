import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { problemKeys } from "../keys";
import type { PublicProblemQuery } from "../types";
import type { PaginationMeta } from "../../../types/api-response";
import type { PublicProblem } from "../types";
import { toQueryParams } from "../types";

/**
 * `GET /problems` - published problems only, no token required.
 * Filtering and pagination are server-side, so the query key carries the
 * whole filter set and results stay cached per combination.
 */
export default function usePublicProblems(query: PublicProblemQuery = {}) {
    const params = toQueryParams(query);

    const result = useQuery({
        queryKey: problemKeys.publicList(query),
        queryFn: async (): Promise<{ problems: PublicProblem[]; pagination: PaginationMeta | null }> => {
            const response = await apiGet<PublicProblem[]>(ENDPOINTS.PUBLIC_LIST, params);
            return { problems: response.data ?? [], pagination: response.pagination };
        },
        staleTime: 30_000,
    });

    return {
        problems: result.data?.problems ?? [],
        pagination: result.data?.pagination ?? null,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}