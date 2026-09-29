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
 * A fine-grained capability, e.g. {@code problem:create}, granted through a
 * role (see the RBAC seeder for the canonical list of names).
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "permissions")
public class Permission {

    @Id
    private String id;

    @NotBlank(message = "Permission name is required")
    @Indexed(unique = true)
    private String name;

    private String description;
}
