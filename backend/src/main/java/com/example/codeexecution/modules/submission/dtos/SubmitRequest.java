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
 * Body of {@code POST /problems/{id}/submit} and
 * {@code POST /problems/{id}/example-eval}.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class SubmitRequest {

    @NotBlank
    private String code;

    @NotNull
    private Language language;
}
