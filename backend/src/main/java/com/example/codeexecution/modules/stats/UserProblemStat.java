package com.example.codeexecution.modules.stats;

import java.util.HashSet;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Aggregated per-user problem statistics, maintained by the execution
 * workers: a FULL_SUBMISSION that ends ACCEPTED marks the problem as solved.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "user_problem_stats")
public class UserProblemStat {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Builder.Default
    private Set<String> solvedProblemIds = new HashSet<>();

    @Builder.Default
    private int totalSubmissions = 0;

    @Builder.Default
    private int acceptedSubmissions = 0;
}
