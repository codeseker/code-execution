package com.example.codeexecution.modules.auth.entities;

/**
 * Lifecycle status of a user account, stored on the {@code status} field of
 * the {@code users} document.
 *
 * - PENDING: registered but the email OTP has not been verified yet.
 *   Login and refresh are rejected until the account becomes ACTIVE.
 * - ACTIVE: email verified, the account is fully usable.
 */
public enum UserStatus {

    PENDING,

    ACTIVE
}
