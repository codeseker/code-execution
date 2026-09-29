package com.example.codeexecution.modules.problem.dtos;

import java.util.List;

import com.example.codeexecution.modules.problem.entities.Difficulty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload for updating a problem. {@code slug} is deliberately absent:
 * slugs stay stable after creation so external links never break.
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UpdateProblemDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotBlank(message = "Problem statement is required")
    private String problemStatement;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private List<String> tags;

    private Boolean isPublished;
}
