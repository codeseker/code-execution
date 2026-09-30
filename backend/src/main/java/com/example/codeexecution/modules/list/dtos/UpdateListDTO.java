package com.example.codeexecution.modules.list.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Body of {@code PUT /users/me/lists/{id}} (full replace). */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UpdateListDTO {

    @NotBlank(message = "name must not be blank")
    @Size(max = 100, message = "name must be at most 100 characters")
    private String name;

    @Size(max = 500, message = "description must be at most 500 characters")
    private String description;
}
