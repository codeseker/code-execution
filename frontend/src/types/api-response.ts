/**
 * Wire formats for the backend envelope classes.
 *
 * - `ApiResponse<T>` (backend/common/responses/ApiResponse.java) is a record of
 *   `success, message, data, pagination` - there is NO `statusCode` field.
 * - `ApiError<T>` (backend/common/responses/ApiError.java) is a record of
 *   `success, message, error, timestamp` - the detail lives under `error`,
 *   not `errors`.
 */

export type PaginationMeta = {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
};

/** @deprecated kept as the historic name of {@link PaginationMeta}. */
export type PaginationResponse = PaginationMeta;

export type SuccessApiResponse<T> = {
    success: true;
    message: string;
    data: T;
    pagination: PaginationMeta | null;
};

export type ErrorApiResponse<T = string> = {
    success: false;
    message: string;
    error: T;
    timestamp: string;
};

/**
 * The one non-`ApiError` shape produced by the backend:
 * `GlobalExceptionHandler#handleLoginAccountNotVerified` builds a raw map that
 * adds an `isVerified` flag on top of the usual envelope.
 */
export type UnverifiedAccountResponse = ErrorApiResponse<string> & {
    isVerified: false;
};

/** Validation failures carry a field -> message map under `error`. */
export type FieldErrorResponse = ErrorApiResponse<Record<string, string>>;