/** `ProblemListController` is scoped to `/users/me` - no cross-user access. */
const list = (id: string) => `/users/me/lists/${encodeURIComponent(id)}`;

export const ENDPOINTS = {
    LISTS: "/users/me/lists",
    LIST: list,
    CREATE: "/users/me/lists",
    UPDATE: list,
    DELETE: list,
    ADD_PROBLEM: (id: string) => `${list(id)}/problems`,
    REMOVE_PROBLEM: (id: string, problemId: string) =>
        `${list(id)}/problems/${encodeURIComponent(problemId)}`,
    BOOKMARKS: "/users/me/bookmarks",
    BOOKMARK: (problemId: string) => `/users/me/bookmarks/${encodeURIComponent(problemId)}`,
} as const;