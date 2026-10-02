import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import type { AuthSessionResponse } from "../types";
import { setAuthTokens } from "../../../utils/cookieService";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage, isUnverifiedAccount } from "../../../utils/api/errors";
import { useAuthStore } from "../../../stores/auth";

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export type LoginFormSchema = z.infer<typeof loginSchema>;

export default function useLogin() {
    const { actions: { setIsAuthenticated, setAuthUser } } = useAuthStore((s) => s);
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (data: LoginFormSchema): Promise<AuthSessionResponse> => {
            const response = await apiPost<AuthSessionResponse>(ENDPOINTS.LOGIN, data);
            return response.data;
        },
        onSuccess: (data) => {
            setIsAuthenticated(true);
            setAuthUser({ username: data.user.username, role: data.user.role });
            setAuthTokens(data.accessToken, data.refreshToken);
            successToast("Logged in successfully!");
        },
        onError: (mutationError: unknown) => {
            // `LoginAccountNotVerifiedException` is the only handler that
            // answers with a raw map carrying `isVerified: false`.
            if (isUnverifiedAccount(mutationError)) {
                errorToast("Your account is not verified. Enter the OTP we emailed you.");
                return;
            }
            errorToast(apiErrorMessage(mutationError, "Unable to log in. Check your credentials and try again."));
        },
    });

    return { login: mutateAsync, loading: isPending, error };
}