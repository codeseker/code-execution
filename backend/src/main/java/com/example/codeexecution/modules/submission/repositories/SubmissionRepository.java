package com.example.codeexecution.modules.submission.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;

/**
 * Mongo repository for {@link Submission}.
 */
public interface SubmissionRepository extends MongoRepository<Submission, String> {

    List<Submission> findByProblemIdAndTypeAndStatus(
            String problemId, SubmissionType type, SubmissionStatus status);

    List<Submission> findByProblemIdInAndTypeAndStatus(
            Collection<String> problemIds, SubmissionType type, SubmissionStatus status);
}
