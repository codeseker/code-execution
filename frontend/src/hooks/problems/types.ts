import type { Difficulty } from "../../types/domain";

/** `modules/problem/dtos/PublicProblemResponse` - `GET /problems`. */
export type PublicProblem = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    difficulty: Difficulty;
    tags: string[];
    totalSubmissions: number;
    acceptedSubmissions: number;
    /** Ratio (0..1), `null` until the problem has been submitted to. */
    acceptanceRate: number | null;
};

/** `PublicProblemDetailResponse.SampleTestCase`. */
export type SampleTestCase = {
    id: string;
    input: string;
    output: string;
    timeLimitMs: number;
    memoryLimitKb: number;
};

/** `modules/problem/dtos/PublicProblemDetailResponse` - `GET /problems/{slug}`. */
export type PublicProblemDetail = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    problemStatement: string;
    difficulty: Difficulty;
    tags: string[];
    defaultTimeLimitMs: number;
    defaultMemoryLimitKb: number;
    /** language -> starter source; keys are `Language` enum names. */
    languageTemplates: Record<string, string>;
    sampleTestCases: SampleTestCase[];
};

/** `ProblemResponseMapper.ProblemResponse` - admin catalogue row. */
export type AdminProblem = {
    _id: string;
    title: string;
    slug: string;
    description: string | null;
    problemStatement: string;
    difficulty: Difficulty;
    tags: string[];
    isPublished: boolean;
    isDeleted: boolean;
    createdBy: string | null;
    testCaseCount: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    createdAt: string;
    updatedAt: string;
};

/** `ProblemResponseMapper.TestCaseResponse` - paths only, never contents. */
export type AdminTestCase = {
    _id: string;
    problemId: string;
    inputFilePath: string;
    outputFilePath: string;
    isSample: boolean;
    timeLimitMs: number;
    memoryLimitKb: number;
};

/** `ProblemResponseMapper.ProblemDetailsResponse` - `GET /admin/problems/{id}`. */
export type AdminProblemDetails = {
    problem: AdminProblem;
    testCases: AdminTestCase[];
};

/** `modules/problem/dtos/CreateProblemDTO` - `slug` is generated server-side. */
export type CreateProblemPayload = {
    title: string;
    description?: string | null;
    problemStatement: string;
    difficulty: Difficulty;
    tags?: string[];
    isPublished?: boolean;
};

/** `modules/problem/dtos/UpdateProblemDTO` - full replace, slug stays stable. */
export type UpdateProblemPayload = CreateProblemPayload;

/** Query params of `GET /problems`. */
export type PublicProblemQuery = {
    search?: string;
    difficulty?: Difficulty;
    tags?: string;
    page?: number;
    limit?: number;
};

/** Query params of `GET /admin/problems` (note `tag`, singular). */
export type AdminProblemQuery = {
    search?: string;
    difficulty?: Difficulty;
    tag?: string;
    page?: number;
    limit?: number;
};

/** Body parts of `POST /admin/problems/{id}/testcases`. */
export type UploadTestCasePayload = {
    input: File;
    output: File;
    isSample?: boolean;
    timeLimitMs?: number;
    memoryLimitKb?: number;
};

/** Drops empty filters so the backend keeps its own defaults. */
export function toQueryParams<T extends object>(query: T): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== "" && value !== null),
    );
}