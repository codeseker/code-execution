import type { ReactNode } from "react";
import { useAuthStore } from "../stores/auth";
import { Navigate } from "react-router-dom";

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
