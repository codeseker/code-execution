package com.example.codeexecution.modules.problem;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.problem.entities.Problem;

public interface ProblemRepository extends MongoRepository<Problem, String> {

    Optional<Problem> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
