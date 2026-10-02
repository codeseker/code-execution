import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import type { ResetPasswordPayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";

/** `ResetPasswordDTO.password` enforces `@Size(min = 8)`. */
export const resetPasswordSchema = z
    .object({
        token: z.string().trim().min(1, { message: "Enter the reset code we sent you" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters" }),
        confirmPassword: z.string().min(1, { message: "Re-enter your new password" }),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export type ResetPasswordFormSchema = z.infer<typeof resetPasswordSchema>;

export default function useResetPassword() {
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (values: ResetPasswordFormSchema): Promise<void> => {
            const payload: ResetPasswordPayload = {
                token: values.token,
                password: values.password,
            };
            await apiPost<void>(ENDPOINTS.RESET_PASSWORD, payload);
        },
        onSuccess: () => {
            successToast("Password updated. Log in with your new password.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "We could not reset your password."));
        },
    });

    return { resetPassword: mutateAsync, loading: isPending, error };
}