/**
 * `PublicProblemController` is mounted at the application root, while
 * `ProblemController` registers the dual `{ "/admin/problems",
 * "/api/v1/admin/problems" }` alias - the blueprint path is used here.
 */
export const ENDPOINTS = {
    PUBLIC_LIST: "/problems",
    PUBLIC_DETAIL: (slug: string) => `/problems/${encodeURIComponent(slug)}`,
    ADMIN_LIST: "/admin/problems",
    ADMIN_CREATE: "/admin/problems",
    ADMIN_DETAIL: (id: string) => `/admin/problems/${encodeURIComponent(id)}`,
    ADMIN_UPDATE: (id: string) => `/admin/problems/${encodeURIComponent(id)}`,
    ADMIN_DELETE: (id: string) => `/admin/problems/${encodeURIComponent(id)}`,
    ADMIN_TESTCASES: (id: string) => `/admin/problems/${encodeURIComponent(id)}/testcases`,
    ADMIN_TESTCASE: (id: string, testCaseId: string) =>
        `/admin/problems/${encodeURIComponent(id)}/testcases/${encodeURIComponent(testCaseId)}`,
} as const;