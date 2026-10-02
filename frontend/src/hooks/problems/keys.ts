import type { AdminProblemQuery, PublicProblemQuery } from "./types";

/** React Query key factory for the problem module. */
export const problemKeys = {
    publicRoot: ["problems", "public"] as const,
    publicList: (query: PublicProblemQuery) => ["problems", "public", "list", query] as const,
    publicDetail: (slug: string) => ["problems", "public", "detail", slug] as const,

    adminRoot: ["problems", "admin"] as const,
    adminList: (query: AdminProblemQuery) => ["problems", "admin", "list", query] as const,
    adminDetail: (id: string) => ["problems", "admin", "detail", id] as const,
};