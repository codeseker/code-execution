import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "../hooks/auth/login/types";
import { clearAuthTokens } from "../utils/cookieService";

type State = {
    auth: {
        isAuthenticated: boolean;
        username: string | null;
        role: UserRole | null;
    };
};

type Actions = {
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setAuthUser: (user: { username: string; role: UserRole }) => void;
    logout: () => void;
};

export const useAuthStore = create<State & { actions: Actions }>()(
    persist(
        (set) => ({
            auth: {
                isAuthenticated: false,
                username: null,
                role: null,
            },
            actions: {
                setIsAuthenticated: (isAuthenticated) =>
                    set((state) => ({
                        auth: { ...state.auth, isAuthenticated },
                    })),
                setAuthUser: ({ username, role }) =>
                    set((state) => ({
                        auth: { ...state.auth, username, role },
                    })),
                logout: () => {
                    set({
                        auth: { isAuthenticated: false, username: null, role: null },
                    });
                    clearAuthTokens();
                    useAuthStore.persist.clearStorage();
                },
            }
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ auth: state.auth }),
        }
    )
);
