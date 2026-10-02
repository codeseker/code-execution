import { useMutation } from "@tanstack/react-query";
import { z } from "zod"
import { apiPost } from "../../../utils/api/methods";
import type { LoginResponse } from "./types";
import { ENDPOINTS } from "./endpoints";
import { setAuthTokens } from "../../../utils/cookieService";
import { errorToast, successToast } from "../../../toast";
import type { AxiosError } from "axios";
import { useAuthStore } from "../../../stores/auth";

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
})

export type LoginFormSchema = z.infer<typeof loginSchema>

export default function useLogin() {
    const { actions: { setIsAuthenticated, setAuthUser } } = useAuthStore((s) => s);
    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (data: LoginFormSchema) => {
            const response = await apiPost<LoginResponse>(ENDPOINTS.LOGIN, data);

            return response.data;
        },
        onSuccess: (data) => {
            setIsAuthenticated(true);
            setAuthUser({ username: data.user.username, role: data.user.role });
            setAuthTokens(data.accessToken, data.refreshToken);
            successToast("Logged in successfully!");
        },
        onError: (error: AxiosError) => {
            const err = error as AxiosError;
            const flag = (err?.response?.data as any)?.isVerified;
            if (!flag) {
                errorToast("Your account is not verified. Please check your email for the verification link.");
                return;
            }
            errorToast("Unable to log in. Check your credentials and try again.")
        }
    })

    return { login: mutateAsync, loading: isPending };
}