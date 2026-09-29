package com.example.codeexecution.modules.problem;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.responses.ApiResponse;
import com.example.codeexecution.modules.problem.dtos.PublicProblemDetailResponse;
import com.example.codeexecution.modules.problem.dtos.PublicProblemResponse;

import java.util.List;

/**
 * User-facing problem discovery (public: no token required, published
 * problems only).
 *
 * <ul>
 *   <li>{@code GET /problems} - paginated metadata list with search,
 *       difficulty and tags filters</li>
 *   <li>{@code GET /problems/{slug}} - full detail with statement,
 *       limits, language templates and sample cases only</li>
 * </ul>
 */
@RestController
@RequestMapping("/problems")
public class PublicProblemController {

    private final PublicProblemService publicProblemService;

    public PublicProblemController(PublicProblemService publicProblemService) {
        this.publicProblemService = publicProblemService;
    }

    @GetMapping
    public ApiResponse<List<PublicProblemResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        PublicProblemService.PublicProblemPage result =
                this.publicProblemService.list(search, difficulty, tags, page, limit);
        return ApiResponse.success(
                "Problems fetched successfully", result.problems(), result.pagination());
    }

    @GetMapping("/{slug}")
    public ApiResponse<PublicProblemDetailResponse> detail(@PathVariable String slug) {
        PublicProblemDetailResponse detail = this.publicProblemService.detail(slug);
        return ApiResponse.success("Problem fetched successfully", detail);
    }
}
