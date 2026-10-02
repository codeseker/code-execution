/**
 * Auth module payloads, mirrored 1:1 from
 * `modules/auth/dtos/*` and `modules/auth/mapper/RegisterResponseMapper`.
 */
import type { UserRole, UserStatus } from "../../types/domain";

export type { UserRole, UserStatus };

/** `RegisterResponseMapper.UserResponse` - note `_id`, not `id`. */
export type AuthUserResponse = {
    _id: string;
    email: string;
    username: string;
    status: UserStatus;
    role: UserRole;
    createdAt: string;
};

/** `RegisterResponseMapper.RegisterResponse` (login and refresh payloads). */
export type AuthSessionResponse = {
    user: AuthUserResponse;
    accessToken: string;
    refreshToken: string;
};

/** `modules/auth/dtos/RegisterUserDTO` */
export type RegisterUserPayload = {
    username: string;
    email: string;
    password: string;
};

/** `modules/auth/dtos/VerifyOtpDTO` */
export type VerifyOtpPayload = {
    email: string;
    otp: string;
};

/** `modules/auth/dtos/ResendOtpDTO` */
export type ResendOtpPayload = {
    email: string;
};

/** `modules/auth/dtos/ForgotPasswordDTO` */
export type ForgotPasswordPayload = {
    email: string;
};

/** `modules/auth/dtos/ResetPasswordDTO` */
export type ResetPasswordPayload = {
    token: string;
    password: string;
};

/** `modules/auth/dtos/RefreshTokenDTO` */
export type RefreshTokenPayload = {
    refreshToken: string;
};