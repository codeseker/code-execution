package com.example.codeexecution.modules.auth.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.InvalidOtpException;
import com.example.codeexecution.common.exceptions.RateLimitException;

/**
 * Redis-backed storage for email verification OTPs.
 *
 * Follows the same pattern as {@link TokenStoreService}:
 * - The OTP itself is stored as a SHA-256 hash with a TTL, so the raw code
 *   never sits in Redis and disappears automatically when it expires.
 * - A separate attempt counter protects the 6-digit code against brute
 *   force; the code is invalidated once too many wrong attempts are made.
 * - A resend cooldown key prevents spamming the mail box.
 */
@Service
public class OtpService {

    private static final String OTP_KEY_PREFIX = "auth:otp:";
    private static final String ATTEMPTS_KEY_PREFIX = "auth:otp:attempts:";
    private static final String COOLDOWN_KEY_PREFIX = "auth:otp:cooldown:";

    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    private final long otpTtlMs;
    private final int maxAttempts;
    private final long resendCooldownMs;

    public OtpService(
            StringRedisTemplate redisTemplate,
            @Value("${app.otp.ttl-ms:600000}") long otpTtlMs,
            @Value("${app.otp.max-attempts:5}") int maxAttempts,
            @Value("${app.otp.resend-cooldown-ms:60000}") long resendCooldownMs) {
        this.redisTemplate = redisTemplate;
        this.otpTtlMs = otpTtlMs;
        this.maxAttempts = maxAttempts;
        this.resendCooldownMs = resendCooldownMs;
    }

    /**
     * Generates a fresh 6-digit OTP for a user, stores its hash with a TTL
     * and starts the resend cooldown.
     *
     * @return the plaintext OTP, ready to be sent by email
     * @throws RateLimitException if a new OTP was already requested very recently
     */
    public String issue(String userId) {
        if (this.isCoolingDown(userId)) {
            throw new RateLimitException(
                    "A new OTP was requested too recently. Please wait a moment before trying again");
        }

        String otp = String.format("%06d", this.secureRandom.nextInt(1_000_000));

        this.redisTemplate.opsForValue().set(
                OTP_KEY_PREFIX + userId,
                hash(otp),
                otpTtlMs,
                TimeUnit.MILLISECONDS);
        this.redisTemplate.delete(ATTEMPTS_KEY_PREFIX + userId);
        this.redisTemplate.opsForValue().set(
                COOLDOWN_KEY_PREFIX + userId,
                "1",
                resendCooldownMs,
                TimeUnit.MILLISECONDS);

        return otp;
    }

    /**
     * Returns true while the user must wait before requesting another OTP.
     */
    public boolean isCoolingDown(String userId) {
        return Boolean.TRUE.equals(
                this.redisTemplate.hasKey(COOLDOWN_KEY_PREFIX + userId));
    }

    /**
     * Validates a presented OTP for a user.
     *
     * A successful verification consumes the OTP (it cannot be reused).
     * Every failure counts towards the attempt limit; once the limit is hit
     * both the OTP and the counter are dropped and a new OTP must be
     * requested.
     *
     * @throws InvalidOtpException if no OTP is stored anymore (expired or
     *                             already used) or the code does not match
     * @throws RateLimitException  if too many wrong attempts were made
     */
    public void verify(String userId, String otp) {
        String storedHash = this.redisTemplate.opsForValue().get(OTP_KEY_PREFIX + userId);

        if (storedHash == null) {
            throw new InvalidOtpException(
                    "OTP has expired or is no longer valid. Please request a new one");
        }

        if (storedHash.equals(hash(otp))) {
            this.redisTemplate.delete(OTP_KEY_PREFIX + userId);
            this.redisTemplate.delete(ATTEMPTS_KEY_PREFIX + userId);
            return;
        }

        Long attempts = this.redisTemplate.opsForValue()
                .increment(ATTEMPTS_KEY_PREFIX + userId);
        this.redisTemplate.expire(
                ATTEMPTS_KEY_PREFIX + userId,
                otpTtlMs,
                TimeUnit.MILLISECONDS);

        if (attempts != null && attempts >= maxAttempts) {
            this.redisTemplate.delete(OTP_KEY_PREFIX + userId);
            this.redisTemplate.delete(ATTEMPTS_KEY_PREFIX + userId);
            throw new RateLimitException(
                    "Too many incorrect attempts. The OTP has been invalidated, please request a new one");
        }

        long remaining = maxAttempts - (attempts == null ? 0 : attempts);
        throw new InvalidOtpException(
                "Invalid OTP. " + remaining + " attempt" + (remaining == 1 ? "" : "s") + " remaining");
    }

    private static String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
