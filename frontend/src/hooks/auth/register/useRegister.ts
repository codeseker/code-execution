import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import type { AuthUserResponse, RegisterUserPayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage, apiFieldErrors } from "../../../utils/api/errors";

/** Mirrors the `@NotBlank`/`@Size`/`@Email` constraints on RegisterUserDTO. */
export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, { message: "Username must be at least 3 characters" })
        .max(50, { message: "Username must be at most 50 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export type RegisterFormSchema = z.infer<typeof registerSchema>;

export default function useRegister() {
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (data: RegisterFormSchema): Promise<AuthUserResponse> => {
            const payload: RegisterUserPayload = data;
            const response = await apiPost<AuthUserResponse>(ENDPOINTS.REGISTER, payload);
            return response.data;
        },
        onSuccess: () => {
            successToast("Account created. Check your inbox for the verification OTP.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to create your account."));
        },
    });

    return {
        register: mutateAsync,
        loading: isPending,
        error,
        /** `@Email`-style violations keyed by DTO field, from `Validation failed`. */
        fieldErrors: apiFieldErrors(error),
    };
}