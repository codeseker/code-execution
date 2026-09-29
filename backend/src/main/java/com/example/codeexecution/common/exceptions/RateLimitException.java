package com.example.codeexecution.common.exceptions;

public class RateLimitException extends RuntimeException {

    public RateLimitException() {
        super("Too many attempts. Please try again later");
    }

    public RateLimitException(String message) {
        super(message);
    }
}
