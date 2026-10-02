
/** `modules/stats/UserStatsResponse` - `GET /users/me/stats`. */
export type UserStats = {
    solvedCount: number;
    /** Serialised from a `Set<String>`, so it arrives as a JSON array. */
    solvedProblemIds: string[];
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number | null;
};