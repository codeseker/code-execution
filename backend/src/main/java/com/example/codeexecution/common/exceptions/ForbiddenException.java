package com.example.codeexecution.common.exceptions;

/**
 * Thrown when an authenticated user does not hold the permissions required
 * by an endpoint (RBAC denial).
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException() {
        super("You do not have permission to perform this action");
    }

    public ForbiddenException(String message) {
        super(message);
    }
}
