package com.example.codeexecution.modules.stats;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * Mongo repository for {@link UserProblemStat}.
 */
public interface UserProblemStatRepository extends MongoRepository<UserProblemStat, String> {

    Optional<UserProblemStat> findByUserId(String userId);
}
