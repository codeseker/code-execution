/**
 * Presentation mapping between the backend enums (SCREAMING_SNAKE) and the
 * existing CodeForge UI vocabulary ("Easy", "Wrong Answer", ...).
 */
import type {
    Difficulty,
    Language,
    SubmissionStatus,
    SubmissionType,
    UserRole,
    UserStatus,
    Verdict,
} from "../types/domain";

export type Tone = "success" | "error" | "warning" | "neutral";

/**
 * Every status-ish value a badge can render: the backend `Verdict` and
 * `SubmissionStatus` enums plus the legacy display strings still produced by
 * `data.ts`. Normalising here keeps `StatusBadge` usable on both surfaces.
 */
export type StatusValue =
    | Verdict
    | SubmissionStatus
    | "Accepted"
    | "Wrong Answer"
    | "Time Limit Exceeded"
    | "Memory Limit Exceeded"
    | "Compile Error"
    | "Running"
    | "Pending";

const STATUS_LABEL: Record<StatusValue, string> = {
    ACCEPTED: "Accepted",
    WRONG_ANSWER: "Wrong Answer",
    COMPILE_ERROR: "Compile Error",
    TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
    MEMORY_LIMIT_EXCEEDED: "Memory Limit Exceeded",
    RUNTIME_ERROR: "Runtime Error",
    SYSTEM_ERROR: "System Error",
    QUEUED: "Queued",
    PROCESSING: "Running",
    COMPLETED: "Judged",
    FAILED: "Failed",
    Accepted: "Accepted",
    'Wrong Answer': "Wrong Answer",
    'Time Limit Exceeded': "Time Limit Exceeded",
    'Memory Limit Exceeded': "Memory Limit Exceeded",
    'Compile Error': "Compile Error",
    Running: "Running",
    Pending: "Pending",
};

export function statusLabel(status: StatusValue): string {
    return STATUS_LABEL[status] ?? String(status);
}

export function statusTone(status: StatusValue): Tone {
    if (status === "ACCEPTED" || status === "COMPLETED" || status === "Accepted") return "success";
    if (
        status === "QUEUED" ||
        status === "PROCESSING" ||
        status === "TIME_LIMIT_EXCEEDED" ||
        status === "MEMORY_LIMIT_EXCEEDED" ||
        status === "Running" ||
        status === "Pending" ||
        status === "Time Limit Exceeded" ||
        status === "Memory Limit Exceeded"
    ) {
        return "warning";
    }
    return "error";
}

/** Tailwind classes shared by every status pill in the app. */
export function statusToneClass(status: StatusValue): string {
    if (status === "ACCEPTED" || status === "COMPLETED" || status === "Accepted") return "bg-verdict-accepted text-verdict-accepted-foreground";
    if (status === "WRONG_ANSWER" || status === "Wrong Answer") return "bg-verdict-wrong-answer text-verdict-wrong-answer-foreground";
    if (status === "TIME_LIMIT_EXCEEDED" || status === "Time Limit Exceeded" || status === "MEMORY_LIMIT_EXCEEDED" || status === "Memory Limit Exceeded") return "bg-verdict-time-limit-exceeded text-verdict-time-limit-exceeded-foreground";
    if (status === "COMPILE_ERROR" || status === "Compile Error") return "bg-verdict-compile-error text-verdict-compile-error-foreground";
    if (status === "RUNTIME_ERROR" || status === "SYSTEM_ERROR" || status === "FAILED") return "bg-verdict-runtime-error text-verdict-runtime-error-foreground";
    if (status === "QUEUED" || status === "PROCESSING" || status === "Running" || status === "Pending") return "bg-verdict-pending text-verdict-pending-foreground";
    const tone = statusTone(status);
    if (tone === "success") return "bg-success/10 text-success";
    if (tone === "error") return "bg-destructive/10 text-destructive";
    if (tone === "warning") return "bg-warning/10 text-warning";
    return "bg-secondary text-secondary-foreground";
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
};

export function difficultyLabel(difficulty: Difficulty | null | undefined): string {
    return difficulty ? DIFFICULTY_LABEL[difficulty] : "Unknown";
}

const VERDICT_LABEL: Record<Verdict, string> = {
    ACCEPTED: "Accepted",
    WRONG_ANSWER: "Wrong Answer",
    COMPILE_ERROR: "Compile Error",
    TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
    MEMORY_LIMIT_EXCEEDED: "Memory Limit Exceeded",
    RUNTIME_ERROR: "Runtime Error",
    SYSTEM_ERROR: "System Error",
};

export function verdictLabel(verdict: Verdict | null | undefined): string {
    return verdict ? VERDICT_LABEL[verdict] : "Judging";
}

export function verdictTone(verdict: Verdict | null | undefined): Tone {
    if (!verdict) return "warning";
    if (verdict === "ACCEPTED") return "success";
    if (verdict === "TIME_LIMIT_EXCEEDED" || verdict === "MEMORY_LIMIT_EXCEEDED") return "warning";
    return "error";
}

const LANGUAGE_LABEL: Record<Language, string> = {
    cpp: "C++",
    java: "Java",
    python: "Python3",
    javascript: "JavaScript",
};

export function languageLabel(language: Language | null | undefined): string {
    return language ? LANGUAGE_LABEL[language] : "-";
}

const SUBMISSION_TYPE_LABEL: Record<SubmissionType, string> = {
    EXAMPLE_EVAL: "Sample run",
    FULL_SUBMISSION: "Full submission",
    CUSTOM_RUN: "Custom run",
};

export function submissionTypeLabel(type: SubmissionType): string {
    return SUBMISSION_TYPE_LABEL[type];
}

const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
    QUEUED: "Queued",
    PROCESSING: "Running",
    COMPLETED: "Judged",
    FAILED: "Failed",
};

export function submissionStatusLabel(status: SubmissionStatus): string {
    return SUBMISSION_STATUS_LABEL[status];
}

export function submissionStatusTone(status: SubmissionStatus): Tone {
    if (status === "COMPLETED") return "success";
    if (status === "FAILED") return "error";
    return "warning";
}

const USER_STATUS_LABEL: Record<UserStatus, string> = {
    PENDING: "Pending",
    ACTIVE: "Active",
};

export function userStatusLabel(status: UserStatus): string {
    return USER_STATUS_LABEL[status];
}

const ROLE_LABEL: Record<UserRole, string> = {
    ADMIN: "Admin",
    PROBLEM_SETTER: "Problem Setter",
    USER: "Member",
};

export function roleLabel(role: UserRole | null | undefined): string {
    return role ? ROLE_LABEL[role] : "Unassigned";
}

export function initialsOf(value: string | null | undefined): string {
    const parts = (value ?? "").split(/[\s._-]+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

/** `2048` -> "2.0 KB"; backend reports kilobytes for memory. */
export function formatKb(kb: number | null | undefined): string {
    if (kb === null || kb === undefined) return "-";
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatMs(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) return "-";
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

/** Judge limits are quoted per test: `2000` -> "2 seconds", `1500` -> "1.5 seconds". */
export function formatTimeLimit(ms: number | null | undefined): string {
    if (ms === null || ms === undefined || Number.isNaN(ms)) return "-";
    const seconds = ms / 1000;
    const value = Number.isInteger(seconds) ? String(seconds) : String(Number(seconds.toFixed(2)));
    return `${value} ${seconds === 1 ? "second" : "seconds"}`;
}

/** Judge limits are quoted per test: `256000` -> "250 MB". */
export function formatMemoryLimit(kb: number | null | undefined): string {
    if (kb === null || kb === undefined || Number.isNaN(kb)) return "-";
    if (kb < 1024) return `${kb} KB`;
    const megabytes = kb / 1024;
    const value = Number.isInteger(megabytes) ? String(megabytes) : megabytes.toFixed(1);
    return `${value} MB`;
}

/** Compact relative time for submission rows ("3m ago"). */
export function relativeTime(iso: string | null | undefined): string {
    if (!iso) return "-";
    const then = Date.parse(iso);
    if (Number.isNaN(then)) return "-";
    const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(then).toLocaleDateString();
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return "-";
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return "-";
    return new Date(parsed).toLocaleString();
}

/** `null` means "no value"; the UI shows an em dash instead of "NaN%". */
export function formatPercent(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
    return `${(value * 100).toFixed(digits)}%`;
}