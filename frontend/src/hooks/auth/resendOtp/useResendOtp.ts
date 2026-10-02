import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiPost } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import type { ResendOtpPayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";

export const resendOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

export type ResendOtpFormSchema = z.infer<typeof resendOtpSchema>;

export default function useResendOtp() {
    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (data: ResendOtpFormSchema): Promise<string> => {
            const payload: ResendOtpPayload = data;
            const response = await apiPost<void>(ENDPOINTS.RESEND_OTP, payload);
            return response.message;
        },
        onSuccess: (message) => {
            successToast(message || "A new OTP is on its way.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "We could not send a new code."));
        },
    });

    return { resendOtp: mutateAsync, loading: isPending };
}