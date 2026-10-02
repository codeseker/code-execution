import { API_VERSION_PREFIX } from "../../utils/api/api";

/** `AuthController` is the only module served under the versioned prefix. */
export const ENDPOINTS = {
    LOGIN: `${API_VERSION_PREFIX}/auth/login`,
    REGISTER: `${API_VERSION_PREFIX}/auth/register`,
    VERIFY_OTP: `${API_VERSION_PREFIX}/auth/verify-otp`,
    RESEND_OTP: `${API_VERSION_PREFIX}/auth/resend-otp`,
    FORGOT_PASSWORD: `${API_VERSION_PREFIX}/auth/forgot-password`,
    RESET_PASSWORD: `${API_VERSION_PREFIX}/auth/reset-password`,
    REFRESH: `${API_VERSION_PREFIX}/auth/refresh`,
    LOGOUT: `${API_VERSION_PREFIX}/auth/logout`,
    PROFILE: `${API_VERSION_PREFIX}/auth/profile`,
} as const;