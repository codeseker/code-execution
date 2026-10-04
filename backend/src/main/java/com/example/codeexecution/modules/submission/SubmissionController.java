package com.example.codeexecution.modules.submission;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.responses.ApiResponse;
import com.example.codeexecution.modules.submission.dtos.RunRequest;
import com.example.codeexecution.modules.submission.dtos.SubmissionQueryDTO;
import com.example.codeexecution.modules.submission.dtos.SubmissionSummaryResponse;
import com.example.codeexecution.modules.submission.dtos.SubmitRequest;
import com.example.codeexecution.modules.submission.dtos.SubmitResponse;
import com.example.codeexecution.modules.submission.dtos.SubmissionResponse;
import com.example.codeexecution.modules.submission.entities.SubmissionType;

import jakarta.validation.Valid;

/**
 * Code evaluation ingestion:
 * <ul>
 *   <li>{@code POST /problems/{id}/example-eval} - public sample cases
 *       only, fast feedback loop</li>
 *   <li>{@code POST /problems/{id}/run} - the same public samples plus the
 *       caller's own custom test cases; no statistics</li>
 *   <li>{@code POST /problems/{id}/submit} - all test cases (samples and
 *       hidden), stops at the first failure; affects problem acceptance rate
 *       and user solved stats</li>
 *   <li>{@code GET /submissions/{id}} - polling fallback for the
 *       WebSocket lifecycle events</li>
 *   <li>{@code GET /users/me/submissions} - the caller's own history
 *       with pagination and problem/status/language/type filters</li>
 * </ul>
 * Both POSTs enqueue onto the language-specific Redis queue and return the
 * {@code JOB_QUEUED} snapshot (submission id + queue position).
 */
@RestController
@RequestMapping
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /** Runs the submission against every hidden and public test case. */
    @PostMapping("/problems/{id}/submit")
    public ApiResponse<SubmitResponse> submit(
            @PathVariable String id,
            @Valid @RequestBody SubmitRequest request,
            @AuthenticationPrincipal String userId) {
        SubmitResponse response = this.submissionService.submit(
                id, request, userId, SubmissionType.FULL_SUBMISSION);
        return ApiResponse.success("Submission queued", response);
    }

    /** Runs the submission against only the public sample test cases. */
    @PostMapping("/problems/{id}/example-eval")
    public ApiResponse<SubmitResponse> exampleEval(
            @PathVariable String id,
            @Valid @RequestBody SubmitRequest request,
            @AuthenticationPrincipal String userId) {
        SubmitResponse response = this.submissionService.submit(
                id, request, userId, SubmissionType.EXAMPLE_EVAL);
        return ApiResponse.success("Example evaluation queued", response);
    }

    /**
     * Runs the code against the problem's stored sample cases plus the
     * caller's own custom test cases. The samples are never taken from the
     * request and no statistics change.
     */
    @PostMapping("/problems/{id}/run")
    public ApiResponse<SubmitResponse> run(
            @PathVariable String id,
            @Valid @RequestBody RunRequest request,
            @AuthenticationPrincipal String userId) {
        SubmitResponse response = this.submissionService.run(id, request, userId);
        return ApiResponse.success("Run queued", response);
    }

    /** Status + result of a submission (owner or submission:read). */
    @GetMapping("/submissions/{id}")
    public ApiResponse<SubmissionResponse> get(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        SubmissionResponse submission = this.submissionService.get(id, userId);
        return ApiResponse.success("Submission fetched successfully", submission);
    }

    /**
     * The caller's submission history, newest first. Only ever returns
     * the authenticated user's own rows; enum filters are validated and
     * rejected with 400 when unknown.
     */
    @GetMapping("/users/me/submissions")
    public ApiResponse<List<SubmissionSummaryResponse>> listMine(
            @RequestParam(required = false) String problemId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal String userId) {

        SubmissionQueryDTO query = new SubmissionQueryDTO(
                problemId, status, language, type, page, limit);
        SubmissionService.SubmissionPage result =
                this.submissionService.listMine(userId, query);
        return ApiResponse.success(
                "Submissions fetched successfully",
                result.submissions(),
                result.pagination());
    }
}
