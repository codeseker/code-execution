package com.example.codeexecution.modules.problem.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * One input/output pair of a problem. The files live on disk (or later on
 * S3); only their paths are stored here.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "testcases")
public class TestCase {

    @Id
    private String id;

    @Indexed
    private String problemId;

    /** 0-based position inside the problem; used for stable rendering. */
    @Builder.Default
    private int order = 0;

    /** Path/S3 URL of the {@code .in} file. */
    private String inputFilePath;

    /** Path/S3 URL of the {@code .out} file. */
    private String outputFilePath;

    @Field("isSample")
    @Builder.Default
    private boolean isSample = false;

    @Builder.Default
    private int timeLimitMs = 1000;

    @Builder.Default
    private int memoryLimitKb = 256000;

    /**
     * Optional human note about this case (how to read it, what a correct
     * answer means). Stored with the case and never sent to the judge; null
     * on cases uploaded before it existed.
     */
    private String explanation;
}
