import type {
    PublicProblemDetail,
    PublicProblemDetailPayload,
    SampleTestCase,
} from "../types";

/**
 * `GET /problems/{slug}` payload -> the shape every consumer works with.
 *
 * <p>The endpoint has been reshaped once already: the statement, the limits and
 * the starter templates were renamed to `statement` / `timeLimitMs` /
 * `memoryLimitKb` / `starterCode`. Normalising here keeps every caller on the
 * current names while a not-yet-redeployed backend still answers with the old
 * ones, and guarantees the fields the renderer relies on are never `null`.
 */

/** Same fallbacks as `ProblemService` / `PublicProblemService` on the server. */
const DEFAULT_TIME_LIMIT_MS = 1000;
const DEFAULT_MEMORY_LIMIT_KB = 256000;

function text(value: string | null | undefined): string {
    return value ?? "";
}

/** A limit of `0` or a missing limit both mean "use the judge default". */
function limit(value: number | null | undefined, fallback: number): number {
    return typeof value === "number" && value > 0 ? value : fallback;
}

function normalizeSample(raw: Partial<SampleTestCase>, index: number): SampleTestCase {
    return {
        id: text(raw.id) || `sample-${index + 1}`,
        input: text(raw.input),
        output: text(raw.output),
        explanation: text(raw.explanation),
        timeLimitMs: limit(raw.timeLimitMs, DEFAULT_TIME_LIMIT_MS),
        memoryLimitKb: limit(raw.memoryLimitKb, DEFAULT_MEMORY_LIMIT_KB),
    };
}

export function normalizeProblemDetail(payload: PublicProblemDetailPayload): PublicProblemDetail {
    return {
        id: text(payload.id),
        slug: text(payload.slug),
        title: text(payload.title),
        description: payload.description ?? null,
        difficulty: payload.difficulty ?? "EASY",
        tags: payload.tags ?? [],
        statement: payload.statement ?? payload.problemStatement ?? "",
        inputFormat: text(payload.inputFormat),
        outputFormat: text(payload.outputFormat),
        constraints: payload.constraints ?? [],
        notes: payload.notes ?? null,
        timeLimitMs: limit(payload.timeLimitMs ?? payload.defaultTimeLimitMs, DEFAULT_TIME_LIMIT_MS),
        memoryLimitKb: limit(payload.memoryLimitKb ?? payload.defaultMemoryLimitKb, DEFAULT_MEMORY_LIMIT_KB),
        // Problem-specific templates win over the language registry defaults.
        starterCode: { ...(payload.languageTemplates ?? {}), ...(payload.starterCode ?? {}) },
        sampleTestCases: (payload.sampleTestCases ?? []).map(normalizeSample),
    };
}

export default normalizeProblemDetail;