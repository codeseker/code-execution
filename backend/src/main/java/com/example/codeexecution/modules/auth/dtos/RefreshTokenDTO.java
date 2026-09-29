package com.example.codeexecution.modules.auth.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RefreshTokenDTO {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
