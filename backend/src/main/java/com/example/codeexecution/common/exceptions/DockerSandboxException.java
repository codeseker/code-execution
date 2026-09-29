package com.example.codeexecution.common.exceptions;

/**
 * Raised when the Docker execution engine itself fails (daemon down, image
 * missing, file IO). The worker maps it to a {@code SYSTEM_ERROR} verdict
 * and a {@code JOB_FAILED} event instead of a wrong judge verdict.
 */
public class DockerSandboxException extends RuntimeException {

    public DockerSandboxException(String message) {
        super(message);
    }

    public DockerSandboxException(String message, Throwable cause) {
        super(message, cause);
    }
}
