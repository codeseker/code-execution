package com.example.codeexecution.modules.submission.entities;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The central execution job ledger. Created by the API when a user submits,
 * moved QUEUED -> PROCESSING -> COMPLETED/FAILED by the workers.
 *
 * The source code lives here (Mongo), never in Redis: queue payloads only
 * reference this document's id.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "submissions")
public class Submission {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String problemId;

    private String code;

    private Language language;

    private SubmissionType type;

    @Indexed
    private SubmissionStatus status;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
