import type { UserRole, UserStatus } from "../../types/domain";

/** `modules/admin/dtos/AdminUserResponse` - `GET /admin/users`. */
export type AdminUser = {
    _id: string;
    username: string;
    email: string;
    status: UserStatus;
    /** Raw role id; `roleName` is what the UI should show. */
    roleId: string | null;
    roleName: UserRole | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
};

/** `modules/admin/dtos/AdminStatsResponse` - `GET /admin/stats`. */
export type AdminStats = {
    users: {
        total: number;
        active: number;
        pending: number;
        /** Counts accounts that are not soft-deleted. */
        deleted: number;
    };
    problems: {
        total: number;
        published: number;
    };
    submissions: {
        total: number;
        queued: number;
        processing: number;
        completed: number;
        failed: number;
        /** ACCEPTED verdicts of completed full submissions. */
        accepted: number;
    };
};

/** Query params of `GET /admin/users`. */
export type AdminUserQuery = {
    search?: string;
    status?: UserStatus;
    roleId?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
};