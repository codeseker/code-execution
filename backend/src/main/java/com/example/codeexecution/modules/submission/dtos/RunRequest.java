package com.example.codeexecution.modules.submission.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.example.codeexecution.modules.submission.entities.Language;

/**
 * Body of {@code POST /problems/{id}/run} - the LeetCode-style "Run"
 * button: same code payload as a submit, plus the caller's own stdin
 * instead of the stored test cases.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class RunRequest {

    @NotBlank
    private String code;

    @NotNull
    private Language language;

    /**
     * Raw stdin handed to the program verbatim. Null/blank means the
     * program is simply run with no input.
     */
    private String input;
}
