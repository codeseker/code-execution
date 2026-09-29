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
    public static User toEntity(RegisterUserDTO user, PasswordEncoder passwordEncoder) {
        User savedUser = new User();
        savedUser.setEmail(user.getEmail());
        savedUser.setPassword(passwordEncoder.encode(user.getPassword()));
        savedUser.setUsername(user.getUsername());
        savedUser.setStatus(UserStatus.PENDING);
        savedUser.setDeleted(false);
        savedUser.setCreatedAt(Instant.now());
        savedUser.setUpdatedAt(Instant.now());

        return savedUser;
    }

    public static RegisterResponse toResponse(User user, TokenPair tokens) {
        return new RegisterResponse(
                toUserResponse(user),
                tokens.accessToken(),
                tokens.refreshToken());
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getStatus(),
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
            Instant createdAt) {
    }
}
