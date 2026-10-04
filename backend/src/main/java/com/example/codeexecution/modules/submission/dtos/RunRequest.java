package com.example.codeexecution.modules.submission.dtos;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.example.codeexecution.modules.submission.entities.Language;

/**
 * Body of {@code POST /problems/{id}/run} - the LeetCode-style "Run" button.
 *
 * <p>The sample test cases are NOT part of this body: the worker loads them
 * from storage so the client cannot override, inject or reorder them. The
 * client only identifies the work (problem id from the path, code, language)
 * and may add its own custom test cases on top.
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
     * Raw stdin of the caller's own "Custom N" test cases, in tab order. Each
     * entry runs after every stored sample case and has no expected output,
     * so its result can never be WRONG_ANSWER. Blank/empty entries are
     * dropped; the count and each entry's length are validated server-side.
     */
    @Size(max = 20, message = "custom_testcases must not contain more than 20 entries")
    private List<@Size(max = 64000, message = "a custom testcase input is too long") String> customTestcases;

    /**
     * Legacy single stdin field, sent by clients built before the Run button
     * loaded the stored samples. It is accepted and IGNORED (with a warning)
     * so an old client keeps working: the samples always come from storage.
     *
     * @deprecated send {@link #customTestcases} instead.
     */
    @Deprecated
    private String input;
}