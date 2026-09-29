package com.example.codeexecution.modules.rbac;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.rbac.entities.Permission;

public interface PermissionRepository extends MongoRepository<Permission, String> {

    Optional<Permission> findByName(String name);
}
