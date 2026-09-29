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
 * Payload for creating a problem "shell" (metadata + statement, no test
 * cases yet). {@code slug} is generated server-side from the title.
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CreateProblemDTO {

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

    /** Defaults to false; publishing is a separate concern. */
    private Boolean isPublished;
}
