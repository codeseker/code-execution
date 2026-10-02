import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import type { ForgotPasswordPayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

export type ForgotPasswordFormSchema = z.infer<typeof forgotPasswordSchema>;

export default function useForgotPassword() {
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (data: ForgotPasswordFormSchema): Promise<string> => {
            const payload: ForgotPasswordPayload = data;
            const response = await apiPost<void>(ENDPOINTS.FORGOT_PASSWORD, payload);
            return response.message;
        },
        onSuccess: (message) => {
            successToast(message || "Password reset instructions sent.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to start password recovery."));
        },
    });

    return { forgotPassword: mutateAsync, loading: isPending, error };
}