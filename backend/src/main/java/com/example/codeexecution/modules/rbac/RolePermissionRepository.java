package com.example.codeexecution.modules.rbac;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.rbac.entities.RolePermission;

public interface RolePermissionRepository extends MongoRepository<RolePermission, String> {

    List<RolePermission> findByRoleId(String roleId);

    Optional<RolePermission> findByRoleIdAndPermissionId(String roleId, String permissionId);
}
