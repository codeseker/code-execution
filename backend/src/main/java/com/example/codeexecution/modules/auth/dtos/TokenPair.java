package com.example.codeexecution.modules.auth.dtos;

public record TokenPair(
        String accessToken,
        String refreshToken) {
}
