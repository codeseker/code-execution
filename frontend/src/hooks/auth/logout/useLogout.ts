import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";
import { useAuthStore } from "../../../stores/auth";

/**
 * `POST /auth/logout` blacklists the presented access token, so it fires
 * before the local session is dropped - but a network failure must never trap
 * the user in a signed-in shell, so the local session is cleared either way.
 */
export default function useLogout() {
    const queryClient = useQueryClient();
    const { actions: { logout } } = useAuthStore((s) => s);

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (): Promise<void> => {
            await apiPost<void>(ENDPOINTS.LOGOUT);
        },
        onSuccess: () => {
            logout();
            queryClient.clear();
            successToast("Logged out.");
        },
        onError: (mutationError: unknown) => {
            logout();
            queryClient.clear();
            errorToast(apiErrorMessage(mutationError, "Signed out locally, but the server rejected the token."));
        },
    });

    return { logout: mutateAsync, loading: isPending };
}