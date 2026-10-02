/** React Query key factory for lists and bookmarks. */
export const listKeys = {
    root: ["lists"] as const,
    all: ["lists", "all"] as const,
    detail: (id: string) => ["lists", "detail", id] as const,
    bookmarks: ["lists", "bookmarks"] as const,
};