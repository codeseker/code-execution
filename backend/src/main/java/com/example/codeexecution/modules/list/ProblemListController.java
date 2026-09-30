package com.example.codeexecution.modules.list;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.responses.ApiResponse;
import com.example.codeexecution.modules.list.dtos.AddProblemDTO;
import com.example.codeexecution.modules.list.dtos.CreateListDTO;
import com.example.codeexecution.modules.list.dtos.ListDetailResponse;
import com.example.codeexecution.modules.list.dtos.ProblemListResponse;
import com.example.codeexecution.modules.list.dtos.ProblemSummaryResponse;
import com.example.codeexecution.modules.list.dtos.UpdateListDTO;

import jakarta.validation.Valid;

/**
 * Bookmarks and curated problem lists for the signed-in user
 * ("Blind 75"-style study plans).
 *
 * <ul>
 *   <li>{@code GET/POST /users/me/lists} - list / create</li>
 *   <li>{@code GET/PUT/DELETE /users/me/lists/{id}} - detail / rename / remove</li>
 *   <li>{@code POST /users/me/lists/{id}/problems} - append a problem</li>
 *   <li>{@code DELETE /users/me/lists/{id}/problems/{problemId}} - remove one</li>
 *   <li>{@code GET/PUT/DELETE /users/me/bookmarks[...]} - the star toggle</li>
 * </ul>
 * Every route is scoped to {@code @AuthenticationPrincipal}; there is no
 * cross-user access to another account's lists.
 */
@RestController
@RequestMapping("/users/me")
public class ProblemListController {

    private final ProblemListService listService;

    public ProblemListController(ProblemListService listService) {
        this.listService = listService;
    }

    @GetMapping("/lists")
    public ApiResponse<List<ProblemListResponse>> lists(
            @AuthenticationPrincipal String userId) {
        return ApiResponse.success(
                "Lists fetched successfully", this.listService.lists(userId));
    }

    @PostMapping("/lists")
    public ApiResponse<ProblemListResponse> create(
            @Valid @RequestBody CreateListDTO request,
            @AuthenticationPrincipal String userId) {
        ProblemListResponse list = this.listService.create(userId, request);
        return ApiResponse.success("List created successfully", list);
    }

    @GetMapping("/lists/{id}")
    public ApiResponse<ListDetailResponse> get(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        ListDetailResponse detail = this.listService.get(userId, id);
        return ApiResponse.success("List fetched successfully", detail);
    }

    @PutMapping("/lists/{id}")
    public ApiResponse<ProblemListResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateListDTO request,
            @AuthenticationPrincipal String userId) {
        ProblemListResponse list = this.listService.update(userId, id, request);
        return ApiResponse.success("List updated successfully", list);
    }

    @DeleteMapping("/lists/{id}")
    public ApiResponse<Void> delete(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        this.listService.delete(userId, id);
        return ApiResponse.success("List deleted successfully", null);
    }

    @PostMapping("/lists/{id}/problems")
    public ApiResponse<ProblemListResponse> addProblem(
            @PathVariable String id,
            @Valid @RequestBody AddProblemDTO request,
            @AuthenticationPrincipal String userId) {
        ProblemListResponse list = this.listService.addProblem(userId, id, request.getProblemId());
        return ApiResponse.success("Problem added to list", list);
    }

    @DeleteMapping("/lists/{id}/problems/{problemId}")
    public ApiResponse<ProblemListResponse> removeProblem(
            @PathVariable String id,
            @PathVariable String problemId,
            @AuthenticationPrincipal String userId) {
        ProblemListResponse list = this.listService.removeProblem(userId, id, problemId);
        return ApiResponse.success("Problem removed from list", list);
    }

    /** Stars a problem (idempotent). */
    @PutMapping("/bookmarks/{problemId}")
    public ApiResponse<ProblemListResponse> bookmark(
            @PathVariable String problemId,
            @AuthenticationPrincipal String userId) {
        ProblemListResponse bookmarks = this.listService.bookmark(userId, problemId);
        return ApiResponse.success("Problem bookmarked", bookmarks);
    }

    /** Unstars a problem (idempotent). */
    @DeleteMapping("/bookmarks/{problemId}")
    public ApiResponse<Void> unbookmark(
            @PathVariable String problemId,
            @AuthenticationPrincipal String userId) {
        this.listService.unbookmark(userId, problemId);
        return ApiResponse.success("Bookmark removed", null);
    }

    /** All starred problems in bookmark order. */
    @GetMapping("/bookmarks")
    public ApiResponse<List<ProblemSummaryResponse>> bookmarks(
            @AuthenticationPrincipal String userId) {
        return ApiResponse.success(
                "Bookmarks fetched successfully", this.listService.bookmarks(userId));
    }
}
