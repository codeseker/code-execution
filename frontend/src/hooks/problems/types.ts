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
    /** Why this sample works; empty when the setter left none. */
    explanation: string;
    timeLimitMs: number;
    memoryLimitKb: number;
};

/** `modules/problem/dtos/PublicProblemDetailResponse` - `GET /problems/{slug}`. */
export type PublicProblemDetail = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    difficulty: Difficulty;
    tags: string[];
    /** Markdown body of the problem (the story / prompt). */
    statement: string;
    /** Markdown describing how the input is laid out. */
    inputFormat: string;
    /** Markdown describing what the program has to print. */
    outputFormat: string;
    /** One rule per entry; rendered as a bulleted list. */
    constraints: string[];
    /** Optional caveats / footnotes (markdown). */
    notes: string | null;
    timeLimitMs: number;
    memoryLimitKb: number;
    /** language -> starter source; keys are `Language` enum names. */
    starterCode: Record<string, string>;
    sampleTestCases: SampleTestCase[];
};

/**
 * Raw wire payload of `GET /problems/{slug}`, before normalisation.
 *
 * <p>Every field is optional and the pre-rename aliases are kept because the
 * detail response changed shape once already (`problemStatement` /
 * `defaultTimeLimitMs` / `defaultMemoryLimitKb` / `languageTemplates`). See
 * `normalizeProblemDetail` for the single place that folds both shapes into a
 * {@link PublicProblemDetail}.
 */
export type PublicProblemDetailPayload = Partial<
    Omit<PublicProblemDetail, "description" | "constraints" | "notes" | "sampleTestCases">
> & {
    description?: string | null;
    constraints?: string[] | null;
    notes?: string | null;
    sampleTestCases?: Array<Partial<SampleTestCase>> | null;
    /** Pre-rename alias of `statement`. */
    problemStatement?: string | null;
    /** Pre-rename alias of `timeLimitMs`. */
    defaultTimeLimitMs?: number | null;
    /** Pre-rename alias of `memoryLimitKb`. */
    defaultMemoryLimitKb?: number | null;
    /** Pre-rename alias of `starterCode`. */
    languageTemplates?: Record<string, string> | null;
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
    /** Optional note attached by the problem setter; may be null. */
    explanation?: string | null;
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
    inputFormat?: string | null;
    outputFormat?: string | null;
    constraints?: string[] | null;
    notes?: string | null;
    starterCode?: Record<string, string> | null;
    source?: string | null;
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
    explanation?: string | null;
};

/** Drops empty filters so the backend keeps its own defaults. */
export function toQueryParams<T extends object>(query: T): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== "" && value !== null),
    );
}