package com.example.codeexecution.common.responses;

public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        PaginationMeta pagination
) {
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static <T> ApiResponse<T> success(
            String message,
            T data,
            PaginationMeta pagination
    ) {
        return new ApiResponse<>(true, message, data, pagination);
    }
}
