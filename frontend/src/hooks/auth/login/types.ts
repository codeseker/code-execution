export type UserStatus = "ACTIVE" | "PENDING";
export type UserRole = "USER" | "ADMIN";

export type LoginResponse = {
    "user": {
        "_id": string
        "email": string,
        "username": string,
        "status": UserStatus,
        "role": UserRole,
        "createdAt": string
    },
    "accessToken": string,
    "refreshToken": string
}