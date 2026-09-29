package com.example.codeexecution.modules.problem;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.problem.entities.TestCase;

public interface TestCaseRepository extends MongoRepository<TestCase, String> {

    List<TestCase> findByProblemId(String problemId);

    void deleteByProblemId(String problemId);

    long countByProblemId(String problemId);
}
