package com.example.codeexecution.modules.stats;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.responses.ApiResponse;

/**
 * Per-user problem statistics (solved count, submission counters) - the
 * numbers a full submission affects.
 */
@RestController
public class UserStatsController {

    private final UserProblemStatService statService;

    public UserStatsController(UserProblemStatService statService) {
        this.statService = statService;
    }

    @GetMapping("/users/me/stats")
    public ApiResponse<UserStatsResponse> stats(@AuthenticationPrincipal String userId) {
        return ApiResponse.success("Stats fetched successfully", this.statService.stats(userId));
    }
}
