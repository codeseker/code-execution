package com.example.codeexecution.modules.rbac;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.rbac.entities.Role;

public interface RoleRepository extends MongoRepository<Role, String> {

    Optional<Role> findByName(String name);
}
