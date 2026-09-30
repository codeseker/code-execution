package com.example.codeexecution.modules.list;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.list.entities.ProblemList;

/**
 * Mongo repository for {@link ProblemList}. All lookups are scoped by
 * {@code userId} so one account can never read another's lists.
 */
public interface ProblemListRepository extends MongoRepository<ProblemList, String> {

    List<ProblemList> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<ProblemList> findByUserIdAndName(String userId, String name);

    Optional<ProblemList> findByIdAndUserId(String id, String userId);
}
