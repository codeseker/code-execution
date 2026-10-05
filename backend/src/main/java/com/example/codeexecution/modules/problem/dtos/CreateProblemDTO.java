package com.example.codeexecution.modules.problem.dtos;

import java.util.List;
import java.util.Map;

import com.example.codeexecution.modules.problem.entities.Difficulty;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload for creating a problem with structured fields.
 * {@code slug} is generated server-side from the title.
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

    private String inputFormat;

    private String outputFormat;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private List<String> tags;

    private List<String> constraints;

    private String notes;

    @Min(value = 100, message = "Time limit must be at least 100ms")
    @Max(value = 60000, message = "Time limit must be at most 60000ms")
    private Integer timeLimitMs;

    @Min(value = 1024, message = "Memory limit must be at least 1MB")
    @Max(value = 104857600, message = "Memory limit must be at most 100MB")
    private Integer memoryLimitKb;

    private Map<String, String> starterCode;

    private String source;

    /** Defaults to false; publishing is a separate concern. */
    private Boolean isPublished;
}
