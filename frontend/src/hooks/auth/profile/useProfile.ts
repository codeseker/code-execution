import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { authKeys } from "../keys";
import type { AuthUserResponse } from "../types";

/**
 * `GET /auth/profile`. Returns the caller's own account - used by the profile
 * page and to reconcile the persisted auth store against the server.
 */
export default function useProfile() {
    const query = useQuery({
        queryKey: authKeys.profile,
        queryFn: async (): Promise<AuthUserResponse> => {
            const response = await apiGet<AuthUserResponse>(ENDPOINTS.PROFILE);
            return response.data;
        },
        staleTime: 60_000,
        retry: false,
    });

    return { profile: query.data, loading: query.isPending, error: query.error };
}