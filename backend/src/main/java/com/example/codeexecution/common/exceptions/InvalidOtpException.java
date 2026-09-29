package com.example.codeexecution.common.exceptions;

public class InvalidOtpException extends RuntimeException {

    public InvalidOtpException() {
        super("Invalid or expired OTP");
    }

    public InvalidOtpException(String message) {
        super(message);
    }
}
