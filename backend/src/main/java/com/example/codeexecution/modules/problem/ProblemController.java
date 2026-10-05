package com.example.codeexecution.modules.problem;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.codeexecution.common.responses.ApiResponse;
import com.example.codeexecution.modules.problem.dtos.CreateProblemDTO;
import com.example.codeexecution.modules.problem.dtos.ProblemQueryDTO;
import com.example.codeexecution.modules.problem.dtos.UpdateProblemDTO;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.ProblemDetailsResponse;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.ProblemPageResponse;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.ProblemResponse;
import com.example.codeexecution.modules.problem.mapper.ProblemResponseMapper.TestCaseResponse;
import com.example.codeexecution.modules.rbac.RequirePermissions;

import jakarta.validation.Valid;

/**
 * Problem Management module under {@code /admin/problems}.
 *
 * Every endpoint requires an authenticated user plus the permission shown
 * on the method (enforced by the RBAC {@code PermissionInterceptor} reading
 * {@link RequirePermissions}).
 * The blueprint path {@code /admin/problems} is registered as-is; the
 * versioned alias {@code /api/v1/admin/problems} follows the rest of the
 * API so both URLs work.
 */
@RestController
@RequestMapping({ "/admin/problems", "/api/v1/admin/problems" })
public class ProblemController {

    private final ProblemService problemService;

    public ProblemController(ProblemService problemService) {
        this.problemService = problemService;
    }

    /** Create a new problem shell. */
    @PostMapping
    @RequirePermissions("problem:create")
    public ApiResponse<ProblemResponse> create(
            @Valid @RequestBody CreateProblemDTO request,
            @AuthenticationPrincipal String userId) {
        ProblemResponse problem = this.problemService.create(request, userId);
        return ApiResponse.success("Problem created successfully", problem);
    }

    /**
     * List all problems with pagination, search, difficulty and tag
     * filters.
     */
    @GetMapping
    @RequirePermissions("problem:read")
    public ApiResponse<List<ProblemResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        ProblemQueryDTO query = new ProblemQueryDTO(search, difficulty, tag, page, limit);
        ProblemPageResponse response = this.problemService.list(query);
        return ApiResponse.success(
                "Problems fetched successfully",
                response.problems(),
                response.pagination());
    }

    /** Retrieve problem details along with its test cases. */
    @GetMapping("/{id}")
    @RequirePermissions("problem:read")
    public ApiResponse<ProblemDetailsResponse> get(@PathVariable String id) {
        ProblemDetailsResponse details = this.problemService.get(id);
        return ApiResponse.success("Problem fetched successfully", details);
    }

    /** Update problem metadata and statement (slug stays stable). */
    @PutMapping("/{id}")
    @RequirePermissions("problem:update")
    public ApiResponse<ProblemResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateProblemDTO request) {
        ProblemResponse problem = this.problemService.update(id, request);
        return ApiResponse.success("Problem updated successfully", problem);
    }

    /** Soft-delete the problem; test cases and files are kept. */
    @DeleteMapping("/{id}")
    @RequirePermissions("problem:delete")
    public ApiResponse<Void> delete(@PathVariable String id) {
        this.problemService.delete(id);
        return ApiResponse.success("Problem deleted successfully", null);
    }

    /** Upload an input/output testcase file pair for a problem. */
    @PostMapping("/{id}/testcases")
    @RequirePermissions("problem:update")
    public ApiResponse<TestCaseResponse> addTestCase(
            @PathVariable String id,
            @RequestPart("input") MultipartFile input,
            @RequestPart("output") MultipartFile output,
            @RequestParam(defaultValue = "false") boolean isSample,
            @RequestParam(required = false) Integer timeLimitMs,
            @RequestParam(required = false) Integer memoryLimitKb,
            @RequestPart(value = "explanation", required = false) String explanation) {

        TestCaseResponse testCase = this.problemService.addTestCase(
                id, input, output, isSample, timeLimitMs, memoryLimitKb, explanation);
        return ApiResponse.success("Testcase added successfully", testCase);
    }

    /** Remove a testcase (document + files on disk). */
    @DeleteMapping("/{id}/testcases/{testCaseId}")
    @RequirePermissions("problem:update")
    public ApiResponse<Void> deleteTestCase(
            @PathVariable String id,
            @PathVariable String testCaseId) {
        this.problemService.deleteTestCase(id, testCaseId);
        return ApiResponse.success("Testcase deleted successfully", null);
    }
}
