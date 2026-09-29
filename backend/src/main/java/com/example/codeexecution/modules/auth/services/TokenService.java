package com.example.codeexecution.modules.auth.services;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.codeexecution.modules.auth.dtos.TokenPair;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

/**
 * Responsible for everything related to JWT tokens.
 *
 * The token payload only carries the userId (as the JWT subject).
 */
@Service
public class TokenService {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public TokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration:900000}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Generates both tokens for a given userId.
     */
    public TokenPair generateTokens(String userId) {
        return new TokenPair(
                generateAccessToken(userId),
                generateRefreshToken(userId));
    }

    public String generateAccessToken(String userId) {
        return generateToken(userId, accessTokenExpirationMs);
    }

    public String generateRefreshToken(String userId) {
        return generateToken(userId, refreshTokenExpirationMs);
    }

    /**
     * Builds and signs a JWT whose only payload data is the userId.
     */
    private String generateToken(String userId, long expirationMs) {
        Date now = new Date();

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationMs))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Parses and decodes a token into its claims.
     *
     * @throws JwtException if the token is invalid, expired or tampered with
     */
    public Claims decodeToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Validates a token: checks signature and expiration.
     */
    public boolean validateToken(String token) {
        try {
            decodeToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    /**
     * Extracts the userId from the token payload.
     */
    public String getUserIdFromToken(String token) {
        return decodeToken(token).getSubject();
    }
}
