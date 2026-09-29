package com.example.codeexecution.common.responses;

public record PaginationMeta(
        int page,
        int limit,
        long totalElements,
        int totalPages
) {
}