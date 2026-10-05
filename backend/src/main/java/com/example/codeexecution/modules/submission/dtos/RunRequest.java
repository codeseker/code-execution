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
 * Body of {@code POST /problems/{id}/run} (the LeetCode-style "Run" button)
 * and {@code POST /problems/{id}/example-eval}.
 *
 * <p>Both judge the problem's own stored sample cases PLUS the caller's custom
 * test cases. The samples are NOT part of this body: the worker loads them
 * from storage so the client cannot override, inject or reorder them. Only
 * {@code customTestcases} comes from the client.
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
     * The caller's own "Custom N" test cases, in tab order. Each entry runs
     * after every stored sample case. {@code customInput} is required;
     * {@code expectedOutput} is optional - without it the case still runs and
     * reports its actual output, but it is not graded pass/fail.
     *
     * <p>Blank inputs are dropped; the count and each entry's length are
     * validated server-side. A bare string is still accepted per entry for
     * backwards compatibility (see {@link CustomTestCaseDeserializer}).
     */
    @Size(max = 20, message = "custom_testcases must not contain more than 20 entries")
    private List<CustomTestCaseRequest> customTestcases;

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