package com.example.codeexecution.common.exceptions;

import java.util.Map;
import java.time.Instant;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.example.codeexecution.common.responses.ApiError;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiError<String>> handleException(
                        Exception exception) {
                ApiError<String> response = ApiError.of(
                                "Something went wrong",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(response);
        }

        @ExceptionHandler(InvalidCredentialsException.class)
        public ResponseEntity<ApiError<String>> handleInvalidCredentials(
                        InvalidCredentialsException exception) {
                ApiError<String> response = ApiError.of(
                                "Invalid credentials",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(response);
        }

        @ExceptionHandler(InvalidTokenException.class)
        public ResponseEntity<ApiError<String>> handleInvalidToken(
                        InvalidTokenException exception) {
                ApiError<String> response = ApiError.of(
                                "Invalid token",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(response);
        }

        @ExceptionHandler(InvalidOtpException.class)
        public ResponseEntity<ApiError<String>> handleInvalidOtp(
                        InvalidOtpException exception) {
                ApiError<String> response = ApiError.of(
                                "OTP verification failed",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(response);
        }

        @ExceptionHandler(RateLimitException.class)
        public ResponseEntity<ApiError<String>> handleRateLimit(
                        RateLimitException exception) {
                ApiError<String> response = ApiError.of(
                                "Too many requests",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(response);
        }

        @ExceptionHandler(AccountNotVerifiedException.class)
        public ResponseEntity<ApiError<String>> handleAccountNotVerified(
                        AccountNotVerifiedException exception) {
                ApiError<String> response = ApiError.of(
                                "Account not verified",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(response);
        }

        @ExceptionHandler(LoginAccountNotVerifiedException.class)
        public ResponseEntity<Map<String, Object>> handleLoginAccountNotVerified(
                        LoginAccountNotVerifiedException exception) {
                Map<String, Object> response = Map.of(
                                "success", false,
                                "message", "Account not verified",
                                "error", exception.getMessage(),
                                "timestamp", Instant.now(),
                                "isVerified", false);

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(response);
        }

        @ExceptionHandler(DuplicateEmailException.class)
        public ResponseEntity<ApiError<String>> handleDuplicateEmail(
                        DuplicateEmailException exception) {
                ApiError<String> response = ApiError.of(
                                "Email already registered",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(response);
        }

        @ExceptionHandler(EmailSendException.class)
        public ResponseEntity<ApiError<String>> handleEmailSend(
                        EmailSendException exception) {
                ApiError<String> response = ApiError.of(
                                "Email could not be sent",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(response);
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiError<String>> handleResourceNotFound(
                        ResourceNotFoundException exception) {
                ApiError<String> response = ApiError.of(
                                "Resource not found",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(response);
        }

        @ExceptionHandler(ForbiddenException.class)
        public ResponseEntity<ApiError<String>> handleForbidden(
                        ForbiddenException exception) {
                ApiError<String> response = ApiError.of(
                                "Access denied",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(response);
        }

        @ExceptionHandler(DockerSandboxException.class)
        public ResponseEntity<ApiError<String>> handleDockerSandbox(
                        DockerSandboxException exception) {
                ApiError<String> response = ApiError.of(
                                "Execution backend unavailable",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body(response);
        }

        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ApiError<String>> handleBadRequest(
                        BadRequestException exception) {
                ApiError<String> response = ApiError.of(
                                "Bad request",
                                exception.getMessage());

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(response);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiError<Map<String, String>>> handleValidationException(
                        MethodArgumentNotValidException exception) {

                Map<String, String> errors = exception
                                .getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .collect(Collectors.toMap(
                                                fieldError -> fieldError.getField(),
                                                fieldError -> fieldError.getDefaultMessage(),
                                                (existing, replacement) -> existing));

                ApiError<Map<String, String>> response = ApiError.of(
                                "Validation failed",
                                errors);

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(response);
        }
}
