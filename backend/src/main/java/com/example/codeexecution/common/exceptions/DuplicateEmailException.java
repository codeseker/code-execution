package com.example.codeexecution.common.exceptions;

public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException() {
        super("An account with this email already exists. If it is not verified yet, "
                + "request a new OTP from the resend-otp endpoint to verify it");
    }

    public DuplicateEmailException(String message) {
        super(message);
    }
}
