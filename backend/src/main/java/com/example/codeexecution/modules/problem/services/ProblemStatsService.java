package com.example.codeexecution.modules.problem.services;

import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.example.codeexecution.modules.problem.entities.Problem;

/**
 * Judge-maintained acceptance counters on {@link Problem}.
 *
 * Every FULL_SUBMISSION that finishes judging bumps
 * {@code totalSubmissions} (and {@code acceptedSubmissions} when the
 * verdict is ACCEPTED); example evaluations and custom runs never touch
 * them.
 *
 * The update is a single atomic {@code $inc} via findAndModify, so
 * workers judging different languages concurrently can never lose a
 * count the way a read-modify-write of the whole document would.
 */
@Service
public class ProblemStatsService {

    private final MongoTemplate mongoTemplate;

    public ProblemStatsService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Records one judged FULL_SUBMISSION against the problem.
     *
     * @param problemId problem the submission ran against
     * @param accepted  whether the overall verdict was ACCEPTED
     */
    public void recordJudged(String problemId, boolean accepted) {
        Update update = new Update().inc("totalSubmissions", 1);
        if (accepted) {
            update.inc("acceptedSubmissions", 1);
        }

        this.mongoTemplate.findAndModify(
                Query.query(Criteria.where("id").is(problemId)),
                update,
                FindAndModifyOptions.options(),
                Problem.class);
    }
}
