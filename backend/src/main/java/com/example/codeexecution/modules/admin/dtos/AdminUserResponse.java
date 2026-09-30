package com.example.codeexecution.modules.admin.dtos;

import java.time.Instant;

import com.example.codeexecution.modules.auth.entities.UserStatus;

/**
 * One row of {@code GET /admin/users}. Deliberately exposes none of the
 * secret fields of {@code User} (password hash, reset/refresh tokens).
 */
public record AdminUserResponse(
        String _id,
        String username,
        String email,
        UserStatus status,
        String roleId,
        String roleName,
        boolean isDeleted,
        Instant createdAt,
        Instant updatedAt) {
}
