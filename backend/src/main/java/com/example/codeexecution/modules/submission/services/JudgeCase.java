package com.example.codeexecution.modules.submission.services;

import java.nio.file.Path;

import com.example.codeexecution.modules.submission.entities.JudgeCaseKind;

/**
 * One unit of work in a judged run, built by the worker before anything is
 * executed.
 *
 * <p>Sample cases are always built from the problem's stored test cases, so
 * the client can neither override, inject nor reorder them. Custom cases are
 * the only client-influenced entries and they carry no expected output.
 *
 * @param caseIndex 1-based position of this case in the run
 * @param caseId stable label (stored test-case id, or {@code custom-N})
 * @param kind visibility class, see {@link JudgeCaseKind}
 * @param inputFile host path of the {@code .in} file fed to stdin
 * @param expectedFile host path of the {@code .out} file; null for custom cases
 * @param timeLimitMs per-case wall-clock budget
 * @param memoryLimitKb advisory per-case memory budget
 */
public record JudgeCase(
        int caseIndex,
        String caseId,
        JudgeCaseKind kind,
        Path inputFile,
        Path expectedFile,
        int timeLimitMs,
        long memoryLimitKb) {
}