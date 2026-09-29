package com.example.codeexecution.modules.auth;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;

import com.example.codeexecution.common.exceptions.AccountNotVerifiedException;
import com.example.codeexecution.common.exceptions.DuplicateEmailException;
import com.example.codeexecution.common.exceptions.InvalidCredentialsException;
import com.example.codeexecution.common.exceptions.InvalidOtpException;
import com.example.codeexecution.common.exceptions.InvalidTokenException;
import com.example.codeexecution.modules.auth.dtos.ForgotPasswordDTO;
import com.example.codeexecution.modules.auth.dtos.LoginUserDTO;
import com.example.codeexecution.modules.auth.dtos.RegisterUserDTO;
import com.example.codeexecution.modules.auth.dtos.ResendOtpDTO;
import com.example.codeexecution.modules.auth.dtos.ResetPasswordDTO;
import com.example.codeexecution.modules.auth.dtos.TokenPair;
import com.example.codeexecution.modules.auth.dtos.VerifyOtpDTO;
import com.example.codeexecution.modules.auth.entities.User;
import com.example.codeexecution.modules.auth.entities.UserStatus;
import com.example.codeexecution.modules.auth.mapper.RegisterResponseMapper;
import com.example.codeexecution.modules.auth.mapper.RegisterResponseMapper.RegisterResponse;
import com.example.codeexecution.modules.auth.mapper.RegisterResponseMapper.UserResponse;
import com.example.codeexecution.modules.auth.services.EmailService;
import com.example.codeexecution.modules.auth.services.OtpService;
import com.example.codeexecution.modules.auth.services.TokenService;
import com.example.codeexecution.modules.auth.services.TokenStoreService;

/**
 * Auth flows:
 *
 * 1. Register  -> account created with status PENDING, a 6-digit OTP is
 *    emailed. Login/refresh are rejected until the OTP is verified.
 * 2. Verify    -> correct OTP flips status to ACTIVE (login works after).
 * 3. Login     -> password check for ACTIVE, non-deleted accounts only;
 *    issues an access/refresh pair stored both in Redis and on the user
 *    document.
 * 4. Refresh   -> rotates the refresh token (Redis + document).
 * 5. Logout    -> revokes the refresh token, denylists the access token
 *    and clears the refreshToken field on the document.
 * 6. Reset     -> forgot-password emails a one-time token stored in
 *    passwordResetToken/passwordResetExpires; reset-password consumes it,
 *    stores the new password and kills every active session.
 */
@Service
public class AuthService {

    private static final String GENERIC_RESET_MESSAGE =
            "If an account with this email exists, a password reset email has been sent";

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final TokenStoreService tokenStoreService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long passwordResetTtlMs;

    public AuthService(
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            TokenService tokenService,
            TokenStoreService tokenStoreService,
            OtpService otpService,
            EmailService emailService,
            @Value("${app.password-reset.ttl-ms:900000}") long passwordResetTtlMs) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.tokenStoreService = tokenStoreService;
        this.otpService = otpService;
        this.emailService = emailService;
        this.passwordResetTtlMs = passwordResetTtlMs;
    }

    /**
     * Creates a PENDING account and emails a verification OTP.
     *
     * No tokens are issued here: the user must verify the OTP first and
     * then log in with email + password.
     */
    public UserResponse register(RegisterUserDTO request) {

        if (this.userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException();
        }

        User user = RegisterResponseMapper.toEntity(request, passwordEncoder);

        User savedUser = this.userRepository.save(user);

        String otp = this.otpService.issue(savedUser.getId());
        this.emailService.sendOtpEmail(savedUser.getEmail(), savedUser.getUsername(), otp);

        return RegisterResponseMapper.toUserResponse(savedUser);
    }

    /**
     * Validates the OTP emailed at registration and flips the account to
     * ACTIVE.
     *
     * Verifying an already-active account succeeds without consuming an
     * OTP (the endpoint is idempotent).
     */
    public UserResponse verifyOtp(VerifyOtpDTO request) {

        User user = this.userRepository.findByEmail(request.getEmail())
                .filter(found -> !found.isDeleted())
                .orElseThrow(() -> new InvalidOtpException("Invalid or expired OTP"));

        if (user.getStatus() != UserStatus.PENDING) {
            return RegisterResponseMapper.toUserResponse(user);
        }

        this.otpService.verify(user.getId(), request.getOtp());

        user.setStatus(UserStatus.ACTIVE);
        user.setUpdatedAt(Instant.now());
        User savedUser = this.userRepository.save(user);

        return RegisterResponseMapper.toUserResponse(savedUser);
    }

    /**
     * Emails a fresh OTP for a PENDING account.
     *
     * Unknown emails get the same generic answer so the endpoint cannot be
     * used to probe which emails are registered, and the resend cooldown
     * inside {@link OtpService} prevents mail bombing.
     */
    public String resendOtp(ResendOtpDTO request) {

        Optional<User> found = this.userRepository.findByEmail(request.getEmail())
                .filter(user -> !user.isDeleted());

        if (found.isEmpty()) {
            return "If an unverified account with this email exists, a new OTP has been sent";
        }

        User user = found.get();

        if (user.getStatus() != UserStatus.PENDING) {
            return "Account is already verified. Please log in";
        }

        String otp = this.otpService.issue(user.getId());
        this.emailService.sendOtpEmail(user.getEmail(), user.getUsername(), otp);

        return "OTP sent to " + user.getEmail();
    }

    /**
     * Emails a one-time password reset token for an existing account.
     *
     * The same generic message is always returned so the endpoint cannot
     * be used to discover registered emails.
     */
    public String forgotPassword(ForgotPasswordDTO request) {

        Optional<User> found = this.userRepository.findByEmail(request.getEmail())
                .filter(user -> !user.isDeleted());

        if (found.isEmpty()) {
            return GENERIC_RESET_MESSAGE;
        }

        User user = found.get();

        user.setPasswordResetToken(generatePasswordResetToken());
        user.setPasswordResetExpires(Instant.now().plusMillis(passwordResetTtlMs));
        user.setUpdatedAt(Instant.now());
        this.userRepository.save(user);

        this.emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), user.getPasswordResetToken());

        return GENERIC_RESET_MESSAGE;
    }

    /**
     * Consumes a valid reset token to set a new password.
     *
     * On success the token is cleared and every active session is killed
     * (Redis refresh token revoked and the document refreshToken removed),
     * so the user must log in again with the new password.
     */
    public void resetPassword(ResetPasswordDTO request) {

        User user = this.userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired password reset token"));

        if (user.isDeleted()) {
            throw new InvalidTokenException("Invalid or expired password reset token");
        }

        if (user.getPasswordResetExpires() == null
                || user.getPasswordResetExpires().isBefore(Instant.now())) {
            user.setPasswordResetToken(null);
            user.setPasswordResetExpires(null);
            user.setUpdatedAt(Instant.now());
            this.userRepository.save(user);
            throw new InvalidTokenException("Invalid or expired password reset token");
        }

        user.setPassword(this.passwordEncoder.encode(request.getPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpires(null);
        user.setRefreshToken(null);
        user.setUpdatedAt(Instant.now());
        this.userRepository.save(user);

        this.tokenStoreService.revokeRefreshToken(user.getId());
    }

    public RegisterResponse login(LoginUserDTO request) {

        User user = this.userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (user.isDeleted()) {
            throw new InvalidCredentialsException();
        }

        if (!this.passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new AccountNotVerifiedException();
        }

        TokenPair tokens = this.tokenService.generateTokens(user.getId());
        this.tokenStoreService.saveRefreshToken(user.getId(), tokens.refreshToken());
        this.persistRefreshToken(user, tokens.refreshToken());

        return RegisterResponseMapper.toResponse(user, tokens);
    }

    /**
     * Exchanges a refresh token for a new token pair.
     *
     * The refresh token must still be the active one for the user: it is
     * rotated on every use and revoked on logout, so stolen or old refresh
     * tokens are rejected with 401. Deleted or unverified accounts are
     * rejected as well.
     */
    public RegisterResponse refresh(String refreshToken) {

        if (!this.tokenService.validateToken(refreshToken)) {
            throw new InvalidTokenException();
        }

        String userId = this.tokenService.getUserIdFromToken(refreshToken);

        if (!this.tokenStoreService.isRefreshTokenActive(userId, refreshToken)) {
            throw new InvalidTokenException("Refresh token has been revoked or already used");
        }

        User user = this.userRepository.findById(userId)
                .orElseThrow(InvalidTokenException::new);

        if (user.isDeleted()) {
            throw new InvalidTokenException("User account has been deleted");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new AccountNotVerifiedException();
        }

        TokenPair tokens = this.tokenService.generateTokens(user.getId());
        this.tokenStoreService.saveRefreshToken(user.getId(), tokens.refreshToken());
        this.persistRefreshToken(user, tokens.refreshToken());

        return RegisterResponseMapper.toResponse(user, tokens);
    }

    /**
     * Revokes the user's refresh token in Redis, denylists the presented
     * access token until it would have expired anyway and clears the
     * refreshToken field on the user document.
     */
    public void logout(String accessToken) {

        if (!this.tokenService.validateToken(accessToken)) {
            throw new InvalidTokenException();
        }

        Claims claims = this.tokenService.decodeToken(accessToken);
        String userId = claims.getSubject();
        long remainingMs = claims.getExpiration().getTime() - System.currentTimeMillis();

        this.tokenStoreService.revokeRefreshToken(userId);
        this.tokenStoreService.blacklistAccessToken(accessToken, remainingMs);

        this.userRepository.findById(userId).ifPresent(user -> {
            user.setRefreshToken(null);
            user.setUpdatedAt(Instant.now());
            this.userRepository.save(user);
        });
    }

    /**
     * Loads the profile for the authenticated user.
     *
     * Token validation and revocation checks are already performed by
     * JwtAuthenticationFilter, so callers just pass the authenticated userId.
     */
    public UserResponse getProfile(String userId) {

        User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("User for this token no longer exists"));

        return RegisterResponseMapper.toUserResponse(user);
    }

    /** Mirrors the rotated refresh token onto the user document. */
    private void persistRefreshToken(User user, String refreshToken) {
        user.setRefreshToken(refreshToken);
        user.setUpdatedAt(Instant.now());
        this.userRepository.save(user);
    }

    /** Cryptographically random 256-bit token, hex-encoded (64 chars). */
    private String generatePasswordResetToken() {
        byte[] bytes = new byte[32];
        this.secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
