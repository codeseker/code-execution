package com.example.codeexecution.modules.admin.dtos;

/**
 * Aggregate snapshot behind {@code GET /admin/stats}: the three numbers
 * an operator checks first - accounts, catalogue and judge throughput.
 */
public record AdminStatsResponse(
        UserStats users,
        ProblemStats problems,
        SubmissionStats submissions) {

    /** {@code total} counts accounts that are not soft-deleted. */
    public record UserStats(
            long total,
            long active,
            long pending,
            long deleted) {
    }

    /** {@code published} counts non-deleted problems visible to users. */
    public record ProblemStats(
            long total,
            long published) {
    }

    /** {@code accepted} counts ACCEPTED verdicts of completed full submissions. */
    public record SubmissionStats(
            long total,
            long queued,
            long processing,
            long completed,
            long failed,
            long accepted) {
    }
}
