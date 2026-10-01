package com.example.codeexecution.modules.auth.mapper;

import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.codeexecution.modules.auth.dtos.RegisterUserDTO;
import com.example.codeexecution.modules.auth.dtos.TokenPair;
import com.example.codeexecution.modules.auth.entities.User;
import com.example.codeexecution.modules.auth.entities.UserStatus;

public class RegisterResponseMapper {

    /**
     * New accounts start as PENDING: they can only log in once the email
     * OTP has been verified and the status flipped to ACTIVE.
     */
    public static User toEntity(RegisterUserDTO user, PasswordEncoder passwordEncoder, String userRoleId) {
        User savedUser = new User();
        savedUser.setEmail(user.getEmail());
        savedUser.setPassword(passwordEncoder.encode(user.getPassword()));
        savedUser.setUsername(user.getUsername());
        savedUser.setStatus(UserStatus.PENDING);
        // New accounts get the default USER role so their responses can
        // immediately report a role name (null only if RBAC was never seeded).
        savedUser.setRoleId(userRoleId);
        savedUser.setDeleted(false);
        savedUser.setCreatedAt(Instant.now());
        savedUser.setUpdatedAt(Instant.now());

        return savedUser;
    }

    public static RegisterResponse toResponse(User user, TokenPair tokens, String roleName) {
        return new RegisterResponse(
                toUserResponse(user, roleName),
                tokens.accessToken(),
                tokens.refreshToken());
    }

    /**
     * @param roleName resolved role name (e.g. {@code USER}, {@code ADMIN})
     *                 for {@code User.roleId}; null when the account has no
     *                 role. Responses expose the name, never the raw id.
     */
    public static UserResponse toUserResponse(User user, String roleName) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getStatus(),
                roleName,
                user.getCreatedAt());
    }

    public record RegisterResponse(
            UserResponse user,
            String accessToken,
            String refreshToken) {
    }

    public record UserResponse(
            String _id,
            String email,
            String username,
            UserStatus status,
            /** Role NAME (e.g. USER, ADMIN) resolved from User.roleId - not the id. */
            String role,
            Instant createdAt) {
    }
}
