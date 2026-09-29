package com.example.codeexecution.common.exceptions;

public class AccountNotVerifiedException extends RuntimeException {

    public AccountNotVerifiedException() {
        super("Account not verified. Please verify your email with the OTP we sent you");
    }

    public AccountNotVerifiedException(String message) {
        super(message);
    }
}
