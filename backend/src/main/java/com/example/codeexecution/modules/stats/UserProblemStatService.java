package com.example.codeexecution.modules.stats;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.stereotype.Service;

/**
 * Maintains the per-user problem statistics that a full submission
 * affects: solving a problem (ACCEPTED full run) adds it to the solved
 * set, and every full submission bumps the counters.
 */
@Service
public class UserProblemStatService {

    private final UserProblemStatRepository repository;

    public UserProblemStatService(UserProblemStatRepository repository) {
        this.repository = repository;
    }

    /** Called for every FULL_SUBMISSION that leaves the queue. */
    public void recordSubmission(String userId) {
        UserProblemStat stat = findOrCreate(userId);
        stat.setTotalSubmissions(stat.getTotalSubmissions() + 1);
        this.repository.save(stat);
    }

    /** Called when a FULL_SUBMISSION ends with ACCEPTED. */
    public void recordAccepted(String userId, String problemId) {
        UserProblemStat stat = findOrCreate(userId);
        if (stat.getSolvedProblemIds() == null) {
            stat.setSolvedProblemIds(new LinkedHashSet<>());
        }
        stat.getSolvedProblemIds().add(problemId);
        stat.setAcceptedSubmissions(stat.getAcceptedSubmissions() + 1);
        this.repository.save(stat);
    }

    /** Snapshot for {@code GET /users/me/stats}. */
    public UserStatsResponse stats(String userId) {
        UserProblemStat stat = this.repository.findByUserId(userId).orElse(null);
        if (stat == null) {
            return new UserStatsResponse(0, Set.of(), 0, 0, null);
        }
        Set<String> solved = stat.getSolvedProblemIds() == null
                ? Set.of()
                : Set.copyOf(stat.getSolvedProblemIds());
        Double rate = stat.getTotalSubmissions() == 0
                ? null
                : (double) stat.getAcceptedSubmissions() / stat.getTotalSubmissions();
        return new UserStatsResponse(
                solved.size(),
                solved,
                stat.getTotalSubmissions(),
                stat.getAcceptedSubmissions(),
                rate);
    }

    private UserProblemStat findOrCreate(String userId) {
        return this.repository.findByUserId(userId).orElseGet(() ->
                this.repository.save(UserProblemStat.builder()
                        .userId(userId)
                        .build()));
    }
}
