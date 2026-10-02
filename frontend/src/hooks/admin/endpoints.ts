/**
 * `AdminController` registers the blueprint path `/admin` as well as the
 * versioned `/api/v1/admin` alias; the blueprint path is used here.
 * Every route below requires the `user:manage` permission.
 */
export const ENDPOINTS = {
    USERS: "/admin/users",
    STATS: "/admin/stats",
} as const;