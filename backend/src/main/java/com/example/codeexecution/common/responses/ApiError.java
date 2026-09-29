package com.example.codeexecution.common.responses;

import java.time.Instant;

public record ApiError<T>(
        boolean success,
        String message,
        T error,
        Instant timestamp
) {

    public static <T> ApiError<T> of(
            String message,
            T error
    ) {
        return new ApiError<>(
                false,
                message,
                error,
                Instant.now()
        );
    }
}