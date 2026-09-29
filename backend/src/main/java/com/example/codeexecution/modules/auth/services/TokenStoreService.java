package com.example.codeexecution.modules.auth.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis-backed storage for token lifecycle state.
 *
 * - Active refresh tokens: one key per user holding a hash of the current
 *   refresh token (supports rotation and server-side revocation on logout).
 * - Access token denylist: tokens invalidated by logout, kept until their
 *   natural expiration.
 *
 * Tokens are stored as SHA-256 hashes so raw tokens never sit in Redis.
 */
@Service
public class TokenStoreService {

    private static final String REFRESH_KEY_PREFIX = "auth:refresh:";
    private static final String BLACKLIST_KEY_PREFIX = "auth:blacklist:accessToken:";

    private final StringRedisTemplate redisTemplate;
    private final long refreshTokenTtlMs;

    public TokenStoreService(
            StringRedisTemplate redisTemplate,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenTtlMs) {
        this.redisTemplate = redisTemplate;
        this.refreshTokenTtlMs = refreshTokenTtlMs;
    }

    /**
     * Stores the currently active refresh token for a user (overwrites any
     * previous one, so older refresh tokens become invalid).
     */
    public void saveRefreshToken(String userId, String refreshToken) {
        this.redisTemplate.opsForValue().set(
                REFRESH_KEY_PREFIX + userId,
                hash(refreshToken),
                refreshTokenTtlMs,
                TimeUnit.MILLISECONDS);
    }

    /**
     * Returns true only if the presented refresh token is the one currently
     * active for this user (not logged out, not rotated).
     */
    public boolean isRefreshTokenActive(String userId, String refreshToken) {
        String stored = this.redisTemplate.opsForValue().get(REFRESH_KEY_PREFIX + userId);
        return stored != null && stored.equals(hash(refreshToken));
    }

    /**
     * Server-side revocation: drops the user's active refresh token.
     */
    public void revokeRefreshToken(String userId) {
        this.redisTemplate.delete(REFRESH_KEY_PREFIX + userId);
    }

    /**
     * Denies an access token until its natural expiration (used on logout).
     */
    public void blacklistAccessToken(String accessToken, long ttlMs) {
        if (ttlMs <= 0) {
            return;
        }
        this.redisTemplate.opsForValue().set(
                BLACKLIST_KEY_PREFIX + hash(accessToken),
                "1",
                ttlMs,
                TimeUnit.MILLISECONDS);
    }

    /**
     * For use by a future JWT filter: checks whether a token was revoked.
     */
    public boolean isAccessTokenBlacklisted(String accessToken) {
        return Boolean.TRUE.equals(
                this.redisTemplate.hasKey(BLACKLIST_KEY_PREFIX + hash(accessToken)));
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
