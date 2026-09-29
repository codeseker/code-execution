package com.example.codeexecution.modules.rbac;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.codeexecution.modules.auth.UserRepository;
import com.example.codeexecution.modules.auth.entities.User;
import com.example.codeexecution.modules.auth.entities.UserStatus;
import com.example.codeexecution.modules.rbac.entities.Permission;
import com.example.codeexecution.modules.rbac.entities.Role;
import com.example.codeexecution.modules.rbac.entities.RolePermission;

/**
 * Idempotent RBAC seeder (the Spring equivalent of {@code seeders/rbacSeeder.ts}).
 *
 * Runs at startup and only inserts what is missing:
 * 1. Permissions: problem:*, user:manage, submission:read
 * 2. Roles: ADMIN (all), PROBLEM_SETTER (problem CRUD), USER (read)
 * 3. Role -> Permission links
 * 4. A root admin user with the ADMIN role
 * 5. Backfills a USER role onto accounts created before RBAC existed
 *
 * Disable with {@code app.rbac.seed.enabled=false}.
 */
@Component
public class RbacSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RbacSeeder.class);

    /** name -> description for every permission the platform needs. */
    private static final Map<String, String> PERMISSIONS = Map.of(
            "problem:create", "Create new problems",
            "problem:read", "View problems and their metadata",
            "problem:update", "Update problems and manage their test cases",
            "problem:delete", "Delete problems",
            "problem:publish", "Publish problems to the public catalogue",
            "user:manage", "Manage user accounts",
            "submission:read", "View code submissions");

    /** role -> permissions it must hold. */
    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.of(
            "ADMIN", List.of(
                    "problem:create", "problem:read", "problem:update",
                    "problem:delete", "problem:publish",
                    "user:manage", "submission:read"),
            "PROBLEM_SETTER", List.of(
                    "problem:create", "problem:read", "problem:update", "problem:delete"),
            "USER", List.of(
                    "problem:read", "submission:read"));

    private static final Map<String, String> ROLE_DESCRIPTIONS = Map.of(
            "ADMIN", "Full access to every permission",
            "PROBLEM_SETTER", "Creates and maintains problems",
            "USER", "Regular contestant account");

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final boolean enabled;
    private final String adminEmail;
    private final String adminPassword;

    public RbacSeeder(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            RolePermissionRepository rolePermissionRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.rbac.seed.enabled:true}") boolean enabled,
            @Value("${app.rbac.seed.admin-email:admin@example.com}") String adminEmail,
            @Value("${app.rbac.seed.admin-password:Admin@123!}") String adminPassword) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("RBAC seeding disabled (app.rbac.seed.enabled=false)");
            return;
        }

        seedPermissions();
        Map<String, String> roleIds = seedRoles();
        seedRolePermissions(roleIds);
        seedRootAdmin(roleIds.get("ADMIN"));
        backfillUsersWithoutRole(roleIds.get("USER"));

        log.info("RBAC seed completed");
    }

    private void seedPermissions() {
        for (Map.Entry<String, String> entry : PERMISSIONS.entrySet()) {
            if (this.permissionRepository.findByName(entry.getKey()).isEmpty()) {
                this.permissionRepository.save(Permission.builder()
                        .name(entry.getKey())
                        .description(entry.getValue())
                        .build());
                log.info("Seeded permission '{}'", entry.getKey());
            }
        }
    }

    /** @return role name -> role id for every canonical role. */
    private Map<String, String> seedRoles() {
        Map<String, String> roleIds = new java.util.HashMap<>();

        for (Map.Entry<String, List<String>> entry : ROLE_PERMISSIONS.entrySet()) {
            String name = entry.getKey();
            Role role = this.roleRepository.findByName(name).orElseGet(() -> {
                Role created = this.roleRepository.save(Role.builder()
                        .name(name)
                        .description(ROLE_DESCRIPTIONS.get(name))
                        .build());
                log.info("Seeded role '{}'", name);
                return created;
            });
            roleIds.put(name, role.getId());
        }

        return roleIds;
    }

    private void seedRolePermissions(Map<String, String> roleIds) {
        ROLE_PERMISSIONS.forEach((roleName, permissionNames) -> {
            String roleId = roleIds.get(roleName);

            for (String permissionName : permissionNames) {
                String permissionId = this.permissionRepository.findByName(permissionName)
                        .map(Permission::getId)
                        .orElse(null);

                if (permissionId == null) {
                    continue; // seedPermissions() always runs first; defensive only
                }

                if (this.rolePermissionRepository
                        .findByRoleIdAndPermissionId(roleId, permissionId).isEmpty()) {
                    this.rolePermissionRepository.save(RolePermission.builder()
                            .roleId(roleId)
                            .permissionId(permissionId)
                            .build());
                }
            }
        });
    }

    private void seedRootAdmin(String adminRoleId) {
        var existing = this.userRepository.findByEmail(this.adminEmail);

        if (existing.isPresent()) {
            User admin = existing.get();
            boolean changed = false;

            if (!adminRoleId.equals(admin.getRoleId())) {
                admin.setRoleId(adminRoleId);
                changed = true;
            }
            if (admin.isDeleted()) {
                admin.setDeleted(false);
                changed = true;
            }
            if (admin.getStatus() != UserStatus.ACTIVE) {
                admin.setStatus(UserStatus.ACTIVE);
                changed = true;
            }

            if (changed) {
                admin.setUpdatedAt(Instant.now());
                this.userRepository.save(admin);
                log.info("Root admin '{}' re-enabled with the ADMIN role", this.adminEmail);
            }
            return;
        }

        User admin = User.builder()
                .username("root-admin")
                .email(this.adminEmail)
                .password(this.passwordEncoder.encode(this.adminPassword))
                .status(UserStatus.ACTIVE)
                .roleId(adminRoleId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        this.userRepository.save(admin);
        log.warn("Created root admin '{}' - change the initial password after first login", this.adminEmail);
    }

    /** Pre-RBAC accounts get the default USER role so they can still read problems. */
    private void backfillUsersWithoutRole(String userRoleId) {
        List<User> legacyUsers = this.userRepository.findByRoleIdIsNull();

        for (User user : legacyUsers) {
            user.setRoleId(userRoleId);
            user.setUpdatedAt(Instant.now());
            this.userRepository.save(user);
        }

        if (!legacyUsers.isEmpty()) {
            log.info("Assigned the USER role to {} pre-RBAC account(s)", legacyUsers.size());
        }
    }
}
