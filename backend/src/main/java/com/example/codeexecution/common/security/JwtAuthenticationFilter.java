package com.example.codeexecution.common.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.codeexecution.modules.auth.services.TokenService;
import com.example.codeexecution.modules.auth.services.TokenStoreService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authenticates every request that carries a {@code Bearer} access token.
 *
 * - Valid token: the userId is placed in the SecurityContext (controllers
 *   read it with {@code @AuthenticationPrincipal}) and the raw token is
 *   exposed as a request attribute for endpoints like logout.
 * - Invalid or revoked token: nothing is authenticated and the reason is
 *   kept in a request attribute so the entry point can report it as 401.
 * - No token: the request continues unauthenticated; public endpoints
 *   (register/login/refresh) are unaffected, protected ones are rejected
 *   by the entry point.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Raw access token, available to controllers after this filter ran. */
    public static final String ACCESS_TOKEN_ATTRIBUTE = "jwtAccessToken";

    /** Reason a presented token was rejected (read by the entry point). */
    public static final String AUTH_ERROR_ATTRIBUTE = "jwtAuthError";

    private static final String BEARER_PREFIX = "Bearer ";

    private final TokenService tokenService;
    private final TokenStoreService tokenStoreService;

    public JwtAuthenticationFilter(
            TokenService tokenService,
            TokenStoreService tokenStoreService) {
        this.tokenService = tokenService;
        this.tokenStoreService = tokenStoreService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = authorization.substring(BEARER_PREFIX.length()).trim();

        if (accessToken.isEmpty() || !this.tokenService.validateToken(accessToken)) {
            request.setAttribute(AUTH_ERROR_ATTRIBUTE, "Invalid or expired token");
            filterChain.doFilter(request, response);
            return;
        }

        if (this.tokenStoreService.isAccessTokenBlacklisted(accessToken)) {
            request.setAttribute(AUTH_ERROR_ATTRIBUTE, "Token has been revoked. Please log in again");
            filterChain.doFilter(request, response);
            return;
        }

        String userId = this.tokenService.getUserIdFromToken(accessToken);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.setAttribute(ACCESS_TOKEN_ATTRIBUTE, accessToken);

        filterChain.doFilter(request, response);
    }
}
