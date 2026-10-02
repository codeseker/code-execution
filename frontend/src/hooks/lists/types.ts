import type { Difficulty } from "../../types/domain";

/** `modules/list/dtos/ProblemListResponse` */
export type ProblemList = {
    _id: string;
    name: string;
    description: string | null;
    /** Server-owned list (e.g. the implicit bookmarks list) - not renameable. */
    system: boolean;
    problemCount: number;
    problemIds: string[];
    createdAt: string;
    updatedAt: string;
};

/** `modules/list/dtos/ProblemSummaryResponse` */
export type ProblemSummary = {
    _id: string;
    title: string;
    slug: string;
    description: string | null;
    difficulty: Difficulty;
    tags: string[];
};

/** `modules/list/dtos/ListDetailResponse` - `GET /users/me/lists/{id}`. */
export type ListDetail = {
    list: ProblemList;
    problems: ProblemSummary[];
};

/** `modules/list/dtos/CreateListDTO` */
export type CreateListPayload = {
    name: string;
    description?: string | null;
};

/** `modules/list/dtos/UpdateListDTO` - full replace. */
export type UpdateListPayload = CreateListPayload;

/** `modules/list/dtos/AddProblemDTO` */
export type AddProblemPayload = {
    problemId: string;
};