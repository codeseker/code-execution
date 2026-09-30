package com.example.codeexecution.modules.admin;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeexecution.common.responses.ApiResponse;
import com.example.codeexecution.modules.admin.dtos.AdminStatsResponse;
import com.example.codeexecution.modules.admin.dtos.AdminUserQueryDTO;
import com.example.codeexecution.modules.admin.dtos.AdminUserResponse;
import com.example.codeexecution.modules.rbac.RequirePermissions;

/**
 * Admin dashboard: user management and platform counters.
 *
 * Every endpoint requires the {@code user:manage} permission (enforced by
 * the RBAC {@code PermissionInterceptor} reading {@link RequirePermissions})
 * - the permission the RBAC seeder has always granted to ADMIN but nothing
 * used until now.
 *
 * Like {@code ProblemController}, the blueprint path {@code /admin/...} is
 * registered as-is and the versioned alias {@code /api/v1/admin/...}
 * follows the rest of the API, so both URLs work.
 */
@RestController
@RequestMapping({ "/admin", "/api/v1/admin" })
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Paginated user directory with search and status/role filters.
     * Soft-deleted accounts are hidden unless {@code includeDeleted=true}.
     */
    @GetMapping("/users")
    @RequirePermissions("user:manage")
    public ApiResponse<List<AdminUserResponse>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String roleId,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        AdminUserQueryDTO query = new AdminUserQueryDTO(
                search, status, roleId, includeDeleted, page, limit);
        AdminService.AdminUserPage result = this.adminService.listUsers(query);
        return ApiResponse.success(
                "Users fetched successfully", result.users(), result.pagination());
    }

    /** Aggregate counters: accounts, catalogue and judge throughput. */
    @GetMapping("/stats")
    @RequirePermissions("user:manage")
    public ApiResponse<AdminStatsResponse> stats() {
        return ApiResponse.success("Stats fetched successfully", this.adminService.stats());
    }
}
