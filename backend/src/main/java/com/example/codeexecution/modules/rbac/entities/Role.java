package com.example.codeexecution.modules.rbac.entities;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A named bundle of permissions, e.g. {@code ADMIN}, {@code PROBLEM_SETTER},
 * {@code USER}. Users reference a role through {@code User.roleId}.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "roles")
public class Role {

    @Id
    private String id;

    @NotBlank(message = "Role name is required")
    @Indexed(unique = true)
    private String name;

    private String description;
}
