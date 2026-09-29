package com.example.codeexecution.modules.submission.entities;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Detailed post-evaluation analysis, one document per completed (or failed)
 * submission. The one-to-one link on {@code submissionId} is unique-indexed.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "submission_results")
public class SubmissionResult {

    @Id
    private String id;

    @Indexed(unique = true)
    private String submissionId;

    private Verdict overallVerdict;

    /** Cumulative/max execution time across all evaluated test cases. */
    private long totalExecutionTimeMs;

    /** Maximum memory consumed across all evaluated test cases. */
    private long peakMemoryKb;

    private int passedTestCases;

    private int totalTestCases;

    /** Sanitised compiler/interpreter error output (COMPILE_ERROR only). */
    @Field("compileErrorLogs")
    private String compileErrorLogs;

    private List<TestCaseResult> testCaseResults;

    private Instant createdAt;
}
