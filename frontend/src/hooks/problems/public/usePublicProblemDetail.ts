import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { apiGet } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { problemKeys } from "../keys";
import type { PublicProblemDetail } from "../types";

/** `GET /problems/{slug}` - statement, limits, templates and samples only. */
export default function usePublicProblemDetail(slug: string | undefined) {
    const result = useQuery({
        queryKey: problemKeys.publicDetail(slug ?? ""),
        queryFn: async (): Promise<PublicProblemDetail> => {
            const response = await apiGet<PublicProblemDetail>(ENDPOINTS.PUBLIC_DETAIL(slug ?? ""));
            return response.data;
        },
        enabled: Boolean(slug),
        staleTime: 60_000,
        retry: false,
    });

    return {
        problem: result.data,
        loading: result.isPending,
        /** `ResourceNotFoundException` answers 404 for an unknown slug. */
        notFound: result.isError && (result.error as AxiosError | undefined)?.response?.status === 404,
        error: result.error,
        refetch: result.refetch,
    };
}