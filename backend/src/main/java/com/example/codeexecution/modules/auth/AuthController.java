package com.example.codeexecution.modules.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.exceptions.InvalidTokenException;
import com.example.codeexecution.common.responses.ApiResponse;
import com.example.codeexecution.common.security.JwtAuthenticationFilter;
import com.example.codeexecution.modules.auth.dtos.ForgotPasswordDTO;
import com.example.codeexecution.modules.auth.dtos.LoginUserDTO;
import com.example.codeexecution.modules.auth.dtos.RefreshTokenDTO;
import com.example.codeexecution.modules.auth.dtos.RegisterUserDTO;
import com.example.codeexecution.modules.auth.dtos.ResendOtpDTO;
import com.example.codeexecution.modules.auth.dtos.ResetPasswordDTO;
import com.example.codeexecution.modules.auth.dtos.VerifyOtpDTO;
import com.example.codeexecution.modules.auth.mapper.RegisterResponseMapper.RegisterResponse;
import com.example.codeexecution.modules.auth.mapper.RegisterResponseMapper.UserResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterUserDTO userDTO) {
        UserResponse user = this.authService.register(userDTO);
        return ApiResponse.success(
                "User registered successfully. A verification OTP has been sent to your email",
                user);
    }

    @PostMapping("/verify-otp")
    public ApiResponse<UserResponse> verifyOtp(@Valid @RequestBody VerifyOtpDTO otpDTO) {
        UserResponse user = this.authService.verifyOtp(otpDTO);
        return ApiResponse.success(
                "Email verified successfully. You can now log in",
                user);
    }

    @PostMapping("/resend-otp")
    public ApiResponse<Void> resendOtp(@Valid @RequestBody ResendOtpDTO otpDTO) {
        String message = this.authService.resendOtp(otpDTO);
        return ApiResponse.success(message, null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDTO forgotDTO) {
        String message = this.authService.forgotPassword(forgotDTO);
        return ApiResponse.success(message, null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO resetDTO) {
        this.authService.resetPassword(resetDTO);
        return ApiResponse.success(
                "Password has been reset successfully. You can now log in",
                null);
    }

    @PostMapping("/login")
    public ApiResponse<RegisterResponse> login(@Valid @RequestBody LoginUserDTO userDTO) {
        RegisterResponse user = this.authService.login(userDTO);
        return ApiResponse.success(
                "Login successful",
                user);
    }

    @PostMapping("/refresh")
    public ApiResponse<RegisterResponse> refresh(@Valid @RequestBody RefreshTokenDTO tokenDTO) {
        RegisterResponse response = this.authService.refresh(tokenDTO.getRefreshToken());
        return ApiResponse.success(
                "Token refreshed successfully",
                response);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        String accessToken = (String) request.getAttribute(JwtAuthenticationFilter.ACCESS_TOKEN_ATTRIBUTE);
        if (accessToken == null) {
            throw new InvalidTokenException();
        }
        this.authService.logout(accessToken);
        return ApiResponse.success(
                "Logged out successfully",
                null);
    }

    @GetMapping("/profile")
    public ApiResponse<UserResponse> profile(@AuthenticationPrincipal String userId) {
        UserResponse profile = this.authService.getProfile(userId);
        return ApiResponse.success(
                "Profile fetched successfully",
                profile);
    }
}
