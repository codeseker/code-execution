package com.example.codeexecution.modules.rbac.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Junction between {@link Role} and {@link Permission}: one document per
 * (role, permission) pair, so a permission can be granted or revoked by
 * inserting or deleting a single document.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@CompoundIndex(name = "uniq_role_permission", def = "{'roleId': 1, 'permissionId': 1}", unique = true)
@Document(collection = "role_permissions")
public class RolePermission {

    @Id
    private String id;

    private String roleId;

    private String permissionId;
}
