package com.example.codeexecution.modules.submission;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.responses.ApiResponse;
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
 *   <li>{@code POST /problems/{id}/submit} - all test cases; affects
 *       problem acceptance rate and user solved stats</li>
 *   <li>{@code GET /submissions/{id}} - polling fallback for the
 *       WebSocket lifecycle events</li>
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

    /** Status + result of a submission (owner or submission:read). */
    @GetMapping("/submissions/{id}")
    public ApiResponse<SubmissionResponse> get(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        SubmissionResponse submission = this.submissionService.get(id, userId);
        return ApiResponse.success("Submission fetched successfully", submission);
    }
}
