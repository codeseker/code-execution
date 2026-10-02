import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import type { AuthUserResponse, VerifyOtpPayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";

/** `VerifyOtpDTO.otp` is validated with `@Pattern("\\d{6}")` server-side. */
export const verifyOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    otp: z
        .string()
        .trim()
        .regex(/^\d{6}$/, { message: "Enter the 6-digit code from your email" }),
});

export type VerifyOtpFormSchema = z.infer<typeof verifyOtpSchema>;

export default function useVerifyOtp() {
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (data: VerifyOtpFormSchema): Promise<AuthUserResponse> => {
            const payload: VerifyOtpPayload = data;
            const response = await apiPost<AuthUserResponse>(ENDPOINTS.VERIFY_OTP, payload);
            return response.data;
        },
        onSuccess: () => {
            successToast("Email verified. You can log in now.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "That code could not be verified."));
        },
    });

    return { verifyOtp: mutateAsync, loading: isPending, error };
}