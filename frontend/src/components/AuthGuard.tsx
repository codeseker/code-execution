import type { ReactNode } from "react";
import { useAuthStore } from "../stores/auth";
import { Navigate } from "react-router-dom";

/**
 * Session gate for member-only screens. The persisted store decides the very
 * first render (no flash of protected content); `RequireAdmin` additionally
 * re-validates against `GET /auth/profile` through `ProfileGuard`.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuthStore((s) => s.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuthStore((s) => s.auth);

    if (isAuthenticated) {
        return <Navigate to="/problems" replace />;
    }

    return <>{children}</>;
}

/**
 * RBAC gate for the `/admin` surface. `ProblemController` and `AdminController`
 * are additionally enforced server-side by the permission interceptor, so this
 * only avoids rendering screens the caller cannot use.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
    const { isAuthenticated, role } = useAuthStore((s) => s.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "ADMIN") {
        return <Navigate to="/problems" replace />;
    }

    return <>{children}</>;
}