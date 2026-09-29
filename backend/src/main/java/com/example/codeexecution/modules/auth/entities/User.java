package com.example.codeexecution.modules.auth.entities;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    /** Account lifecycle: PENDING until the email OTP is verified, then ACTIVE. */
    private UserStatus status;

    /** Soft delete flag: deleted accounts can no longer log in. */
    @Field("isDeleted")
    @Builder.Default
    private boolean isDeleted = false;

    /** One-time token requested through the forgot-password flow. */
    private String passwordResetToken;

    /** Expiry instant of {@link #passwordResetToken}. */
    private Instant passwordResetExpires;

    /** Currently active refresh token (rotated on every refresh, cleared on logout). */
    private String refreshToken;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
