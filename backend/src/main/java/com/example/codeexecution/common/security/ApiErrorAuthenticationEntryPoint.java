package com.example.codeexecution.common.security;

import java.io.IOException;
import java.time.Instant;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Writes a 401 in the project's {@code ApiError} shape whenever a protected
 * route is reached without authentication (missing token, invalid token or
 * token revoked by logout).
 *
 * The JSON is written directly so this layer does not depend on a specific
 * Jackson version.
 */
public class ApiErrorAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        String detail = (String) request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR_ATTRIBUTE);

        if (detail != null) {
            write(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token", detail);
        } else {
            write(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required",
                    "A valid Bearer access token is required");
        }
    }

    public static void write(
            HttpServletResponse response,
            int status,
            String message,
            String error) throws IOException {

        String json = "{\"success\":false,"
                + "\"message\":\"" + escape(message) + "\","
                + "\"error\":\"" + escape(error) + "\","
                + "\"timestamp\":\"" + Instant.now() + "\"}";

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
