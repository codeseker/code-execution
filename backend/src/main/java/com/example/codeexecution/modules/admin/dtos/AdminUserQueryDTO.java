package com.example.codeexecution.modules.admin.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filters for {@code GET /admin/users}. Pagination uses {@code page}
 * (1-based) and {@code limit}; {@code status} is a raw query-param
 * string validated when the service parses it.
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AdminUserQueryDTO {

    /** Case-insensitive match against username and email. */
    private String search;

    /** One of PENDING / ACTIVE (ignored otherwise). */
    private String status;

    /** Exact role id match. */
    private String roleId;

    /** When true, soft-deleted accounts are included. */
    private boolean includeDeleted;

    private int page = 1;

    private int limit = 10;
}
