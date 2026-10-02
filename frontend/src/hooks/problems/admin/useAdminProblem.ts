import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { problemKeys } from "../keys";
import type { AdminProblemDetails } from "../types";

/** `GET /admin/problems/{id}` - metadata plus the stored test cases. */
export default function useAdminProblem(id: string | undefined) {
    const result = useQuery({
        queryKey: problemKeys.adminDetail(id ?? ""),
        queryFn: async (): Promise<AdminProblemDetails> => {
            const response = await apiGet<AdminProblemDetails>(ENDPOINTS.ADMIN_DETAIL(id ?? ""));
            return response.data;
        },
        enabled: Boolean(id),
        staleTime: 15_000,
    });

    return {
        details: result.data,
        loading: result.isPending,
        error: result.error,
        refetch: result.refetch,
    };
}