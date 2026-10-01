import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type State = {
    auth: {
        isAuthenticated: boolean;
    };
};

type Actions = {
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    logout: () => void;
};

export const useAuthStore = create<State & { actions: Actions }>()(
    persist(
        (set) => ({
            auth: {
                isAuthenticated: false,
            },
            actions: {
                setIsAuthenticated: (isAuthenticated) =>
                    set((state) => ({
                        auth: { ...state.auth, isAuthenticated },
                    })),
                logout: () => {
                    set((state) => ({
                        auth: { ...state.auth, isAuthenticated: false },
                    }));
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