package com.example.codeexecution.common.exceptions;

public class EmailSendException extends RuntimeException {

    public EmailSendException() {
        super("Failed to send email. Please try again later");
    }

    public EmailSendException(String message) {
        super(message);
    }

    public EmailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
