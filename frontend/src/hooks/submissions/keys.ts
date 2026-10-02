import type { SubmissionQuery } from "./types";

/** React Query key factory for the submission module. */
export const submissionKeys = {
    detail: (id: string) => ["submissions", "detail", id] as const,
    listRoot: ["submissions", "list"] as const,
    list: (query: SubmissionQuery) => ["submissions", "list", query] as const,
};