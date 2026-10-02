import type { AxiosError } from "axios";
import type { ErrorApiResponse } from "../../types/api-response";

export type ApiFieldErrors = Record<string, string>;

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

function payload(error: unknown): unknown {
    const axiosError = error as AxiosError<unknown> | undefined;
    return axiosError?.response?.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asErrorResponse<T>(error: unknown): ErrorApiResponse<T> | null {
    const body = payload(error);
    if (!isRecord(body)) return null;
    if (body.success !== false) return null;
    return {
        success: false,
        message: typeof body.message === "string" ? body.message : "",
        error: body.error as T,
        timestamp: typeof body.timestamp === "string" ? body.timestamp : "",
    };
}

/**
 * Human-readable message straight from the backend envelope. Falls back to
 * the HTTP status text when the response body is not an `ApiError` (proxy
 * errors, HTML error pages, aborted requests).
 */
export function apiErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
    const body = asErrorResponse<string>(error);
    const detail = body?.error;
    if (body) {
        if (typeof detail === "string" && detail.trim()) {
            // `ApiError.message` is the category ("Validation failed"),
            // `ApiError.error` the specific cause - show both.
            return body.message && body.message !== detail
                ? `${body.message}: ${detail}`
                : detail;
        }
        if (body.message.trim()) return body.message;
    }

    const status = (error as AxiosError | undefined)?.response?.status;
    if (status === 401) return "Your session expired. Please sign in again.";
    if (status === 403) return "You do not have permission to do that.";
    if (status === 404) return "That resource could not be found.";
    if (status === 409) return "That resource already exists.";
    if (status === 429) return "Too many requests. Please slow down and try again.";
    if (status !== undefined) return `${fallback} (HTTP ${status})`;
    return fallback;
}

/** Field-level messages produced by `MethodArgumentNotValidException`. */
export function apiFieldErrors(error: unknown): ApiFieldErrors {
    const body = asErrorResponse<ApiFieldErrors>(error);
    return isRecord(body?.error) ? (body.error as ApiFieldErrors) : {};
}

/**
 * `LoginAccountNotVerifiedException` is the only handler that answers with a
 * bare map instead of `ApiError`, adding `isVerified: false` so the client
 * can route the user into the OTP screen.
 */
export function isUnverifiedAccount(error: unknown): boolean {
    const body = payload(error);
    return isRecord(body) && body.isVerified === false;
}

export { DEFAULT_MESSAGE };