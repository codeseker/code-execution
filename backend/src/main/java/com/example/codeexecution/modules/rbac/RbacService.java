package com.example.codeexecution.modules.rbac;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.ForbiddenException;
import com.example.codeexecution.modules.auth.UserRepository;
import com.example.codeexecution.modules.auth.entities.User;
import com.example.codeexecution.modules.rbac.entities.Permission;
import com.example.codeexecution.modules.rbac.entities.RolePermission;

/**
 * Resolves the permissions of a user and enforces them.
 *
 * Resolution chain: User -> roleId -> RolePermission rows -> Permission
 * names. Users without a role (legacy accounts) hold no permissions.
 */
@Service
public class RbacService {

    private final UserRepository userRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;

    public RbacService(
            UserRepository userRepository,
            RolePermissionRepository rolePermissionRepository,
            PermissionRepository permissionRepository) {
        this.userRepository = userRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
    }

    /**
     * Returns the set of permission names held by the user, e.g.
     * {@code [problem:create, problem:read]}. Empty for users without a role.
     */
    public Set<String> getPermissions(String userId) {
        User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new ForbiddenException("User no longer exists"));

        if (user.getRoleId() == null || user.getRoleId().isBlank()) {
            return Set.of();
        }

        List<RolePermission> links = this.rolePermissionRepository.findByRoleId(user.getRoleId());
        if (links.isEmpty()) {
            return Set.of();
        }

        List<String> permissionIds = links.stream()
                .map(RolePermission::getPermissionId)
                .toList();

        return this.permissionRepository.findAllById(permissionIds).stream()
                .map(Permission::getName)
                .collect(Collectors.toSet());
    }

    /**
     * The {@code checkPermission(...requiredPermissions)} middleware: the
     * user must hold <b>all</b> listed permissions, otherwise 403.
     */
    public void checkPermission(String userId, String... requiredPermissions) {
        Set<String> held = getPermissions(userId);

        List<String> missing = List.of(requiredPermissions).stream()
                .filter(required -> !held.contains(required))
                .toList();

        if (!missing.isEmpty()) {
            throw new ForbiddenException(
                    "Missing required permission(s): " + String.join(", ", missing));
        }
    }
}
