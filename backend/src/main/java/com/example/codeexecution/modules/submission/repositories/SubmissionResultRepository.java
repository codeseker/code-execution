package com.example.codeexecution.modules.submission.repositories;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.submission.entities.SubmissionResult;

/**
 * Mongo repository for {@link SubmissionResult}. The unique index on
 * {@code submissionId} guarantees the one-to-one relationship.
 */
public interface SubmissionResultRepository extends MongoRepository<SubmissionResult, String> {

    Optional<SubmissionResult> findBySubmissionId(String submissionId);

    java.util.List<SubmissionResult> findBySubmissionIdIn(Collection<String> submissionIds);
}
