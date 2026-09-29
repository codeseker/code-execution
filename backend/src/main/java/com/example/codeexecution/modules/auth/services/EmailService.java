package com.example.codeexecution.modules.auth.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.EmailSendException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Sends the auth-related emails (OTP verification code and password reset
 * token) through the SMTP server configured via {@code spring.mail.*}.
 *
 * Failures are wrapped in {@link EmailSendException} so the API reports a
 * clear 500 instead of a generic error.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String from;
    private final long otpTtlMs;
    private final long passwordResetTtlMs;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.from:noreply@example.com}") String from,
            @Value("${app.otp.ttl-ms:600000}") long otpTtlMs,
            @Value("${app.password-reset.ttl-ms:900000}") long passwordResetTtlMs) {
        this.mailSender = mailSender;
        this.from = from;
        this.otpTtlMs = otpTtlMs;
        this.passwordResetTtlMs = passwordResetTtlMs;
    }

    /**
     * Emails a 6-digit verification OTP to the given address.
     */
    public void sendOtpEmail(String to, String username, String otp) {
        long minutes = Math.max(1, otpTtlMs / 60_000);

        String subject = "Verify your email address";
        String plain = "Hello " + username + ",\n\n"
                + "Your verification code is: " + otp + "\n\n"
                + "The code expires in " + minutes + " minutes.\n"
                + "If you did not request this code you can safely ignore this email.\n";
        String html = emailTemplate(
                "Verify your email address",
                "<p>Hello <strong>" + escape(username) + "</strong>,</p>"
                        + "<p>Your verification code is:</p>"
                        + otpBlock(otp)
                        + "<p>The code expires in <strong>" + minutes + " minutes</strong>. "
                        + "If you did not request this code you can safely ignore this email.</p>");

        send(to, subject, plain, html);
    }

    /**
     * Emails a one-time password reset token to the given address.
     */
    public void sendPasswordResetEmail(String to, String username, String token) {
        long minutes = Math.max(1, passwordResetTtlMs / 60_000);

        String subject = "Reset your password";
        String plain = "Hello " + username + ",\n\n"
                + "Someone requested a password reset for your account.\n"
                + "Your password reset token is: " + token + "\n\n"
                + "It expires in " + minutes + " minutes and can only be used once.\n"
                + "If you did not request this, you can safely ignore this email.\n";
        String html = emailTemplate(
                "Reset your password",
                "<p>Hello <strong>" + escape(username) + "</strong>,</p>"
                        + "<p>Someone requested a password reset for your account. "
                        + "Use the token below to choose a new password:</p>"
                        + otpBlock(token)
                        + "<p>It expires in <strong>" + minutes + " minutes</strong> and can only be used once. "
                        + "If you did not request this, you can safely ignore this email.</p>");

        send(to, subject, plain, html);
    }

    private void send(String to, String subject, String plain, String html) {
        try {
            MimeMessage message = this.mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(this.from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plain, html);

            this.mailSender.send(message);
        } catch (MessagingException exception) {
            throw new EmailSendException(
                    "Failed to send the email. Please try again later", exception);
        }
    }

    /** Minimal shared HTML layout so both emails look the same. */
    private static String emailTemplate(String heading, String bodyHtml) {
        return "<!DOCTYPE html><html><body style=\"margin:0;padding:24px;"
                + "font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;\">"
                + "<div style=\"max-width:480px;margin:0 auto;background:#ffffff;"
                + "border-radius:8px;padding:32px;\">"
                + "<h2 style=\"margin:0 0 16px;color:#111111;\">" + heading + "</h2>"
                + "<div style=\"color:#333333;font-size:15px;line-height:1.6;\">" + bodyHtml + "</div>"
                + "</div></body></html>";
    }

    /** Big centered code/token block used inside the email body. */
    private static String otpBlock(String value) {
        return "<p style=\"margin:24px 0;text-align:center;\">"
                + "<span style=\"display:inline-block;padding:14px 28px;background:#111111;"
                + "color:#ffffff;font-size:24px;letter-spacing:6px;border-radius:6px;\">"
                + escape(value) + "</span></p>";
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
