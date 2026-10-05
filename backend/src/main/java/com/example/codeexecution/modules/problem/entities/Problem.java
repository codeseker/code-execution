package com.example.codeexecution.modules.problem.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

/**
 * A judge problem: metadata + markdown statement. Test cases live in their
 * own collection ({@link TestCase}) and are referenced by id here.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "problems")
public class Problem {

    @Id
    private String id;

    private String title;

    /** URL-safe, lowercase, unique - generated from the title. */
    @Indexed(unique = true)
    private String slug;

    /** Short one-line summary shown in listings. */
    private String description;

    /** Full markdown problem statement (the story / prompt only). */
    private String problemStatement;

    private Difficulty difficulty;

    @Indexed
    private java.util.List<String> tags;

    /** Ids of the {@link TestCase}s belonging to this problem. */
    private java.util.List<String> testCases;

    /** Structured input format description (markdown). */
    private String inputFormat;

    /** Structured output format description (markdown). */
    private String outputFormat;

    /** Constraints as individual items, e.g. "0 <= n <= 10^5". */
    private java.util.List<String> constraints;

    /** Optional notes / caveats (markdown). */
    private String notes;

    /** Per-problem defaults inherited by test cases that omit their own limits. */
    @Builder.Default
    private int timeLimitMs = 1000;

    @Builder.Default
    private int memoryLimitKb = 256000;

    /** Language -> starter template source (pre-filled in the editor). */
    private java.util.Map<String, String> starterCode;

    /** Optional source / attribution. */
    private String source;

    /** Id of the user who created the problem. */
    private String createdBy;

    @Field("isPublished")
    @Builder.Default
    private boolean isPublished = false;

    /** Soft delete flag: deleted problems are hidden but kept for history. */
    @Field("isDeleted")
    @Builder.Default
    private boolean isDeleted = false;

    /**
     * Judge-maintained acceptance counters: every FULL_SUBMISSION that
     * finishes judging bumps {@code totalSubmissions} (plus
     * {@code acceptedSubmissions} on ACCEPTED). Example evaluations and
     * custom runs never touch them. Updated atomically ($inc) by
     * {@code ProblemStatsService} after each judging pass.
     */
    @Builder.Default
    private long totalSubmissions = 0;

    @Builder.Default
    private long acceptedSubmissions = 0;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
