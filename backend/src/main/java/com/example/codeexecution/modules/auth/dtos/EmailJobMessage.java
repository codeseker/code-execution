package com.example.codeexecution.modules.auth.dtos;

/**
 * Lightweight payload pushed onto the Redis email queue ({@code queue:email}).
 *
 * Only the rendered email inputs travel through Redis; templates and SMTP
 * details stay in {@code EmailService}. Every auth flow that mails the user
 * (register, resend-otp, forgot-password) enqueues its job here so the API
 * response never waits on the mail server.
 *
 * @param type     which email to render once the worker picks the job up
 * @param to       recipient address
 * @param username recipient display name used in the greeting
 * @param value    the OTP code or password-reset token shown in the body
 */
public record EmailJobMessage(
        Type type,
        String to,
        String username,
        String value) {

    /** Supported auth emails. */
    public enum Type {
        /** 6-digit verification OTP emailed at registration or resend-otp. */
        OTP,
        /** One-time password-reset token from the forgot-password flow. */
        PASSWORD_RESET
    }
}
