package com.example.codeexecution.modules.submission.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.DockerSandboxException;
import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.entities.JudgeCaseKind;
import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.Verdict;
import com.example.codeexecution.modules.submission.services.DockerSandboxService.RunOutcome;

/**
 * The single execution + comparison step shared by every run type.
 *
 * <p>Run, example-eval and submit all funnel through {@link #judge}: one
 * {@link DockerSandboxService#runTestCase} call per case, one exit-code to
 * verdict mapping, one {@link OutputComparator}. The only thing a run type
 * changes is which {@link JudgeCase}s it builds and how much of the returned
 * IO it is allowed to expose - never how the code is executed or judged.
 *
 * <p>Verdict mapping (classic container-judge conventions):
 * <ol>
 *   <li>host timeout or GNU {@code timeout} exit 124 -&gt; TIME_LIMIT_EXCEEDED</li>
 *   <li>SIGKILL (137) outside a timeout -&gt; MEMORY_LIMIT_EXCEEDED</li>
 *   <li>any other non-zero exit -&gt; RUNTIME_ERROR (crash, uncaught
 *       exception, bad exit code) - never WRONG_ANSWER</li>
 *   <li>no expected output (a custom case the caller did not grade) ->
 *       ACCEPTED, there is nothing to compare against</li>
 *   <li>otherwise {@link OutputComparator#matches} decides ACCEPTED vs
 *       WRONG_ANSWER</li>
 * </ol>
 */
@Service
public class CaseJudge {

    private static final Logger log = LoggerFactory.getLogger(CaseJudge.class);

    private final DockerSandboxService sandbox;
    private final ExecutionProperties properties;

    public CaseJudge(DockerSandboxService sandbox, ExecutionProperties properties) {
        this.sandbox = sandbox;
        this.properties = properties;
    }

    /**
     * Executes one case and grades it. Never throws for a failing program -
     * a non-zero exit is a verdict, not an error.
     *
     * @throws DockerSandboxException only on infrastructure failures (Docker
     *                                 unreachable, input file missing), which
     *                                 the worker reports as SYSTEM_ERROR
     */
    public CaseOutcome judge(String submissionId, Language language, JudgeCase testCase) {
        RunOutcome raw = this.sandbox.runTestCase(
                submissionId,
                language,
                testCase.inputFile().toString(),
                testCase.timeLimitMs(),
                testCase.memoryLimitKb());

        String expected = readExpected(testCase.expectedFile());
        Verdict verdict = verdict(raw, expected);

        log.debug(
                "judge case={} kind={} index={} exit={} timedOut={} oom={} runtimeMs={} "
                        + "memoryKb={} verdict={} stdoutLen={} expectedLen={}",
                testCase.caseId(), testCase.kind(), testCase.caseIndex(),
                raw.exitCode(), raw.timedOut(), raw.oomKilled(), raw.elapsedMs(),
                raw.memoryUsedKb(), verdict,
                raw.stdout() == null ? 0 : raw.stdout().length(),
                expected == null ? -1 : expected.length());

        return new CaseOutcome(
                testCase,
                verdict,
                raw.elapsedMs(),
                raw.memoryUsedKb(),
                truncate(raw.stdout()),
                truncate(raw.stderr()),
                truncate(expected),
                // An empty string is a meaningful answer ("the program printed
                // nothing"); null is reserved for "not available to this run".
                truncate(raw.stdout()),
                raw.exitCode(),
                raw.timedOut(),
                raw.oomKilled());
    }

    /**
     * The one exit-code/outcome to verdict mapping. {@code expected} is null
     * for an ungraded custom case, where a mismatch is impossible by
     * construction.
     */
    public static Verdict verdict(RunOutcome raw, String expected) {
        if (raw.timedOut()) {
            return Verdict.TIME_LIMIT_EXCEEDED;
        }
        if (raw.oomKilled()) {
            return Verdict.MEMORY_LIMIT_EXCEEDED;
        }
        if (raw.exitCode() != 0) {
            return Verdict.RUNTIME_ERROR;
        }
        if (expected == null) {
            return Verdict.ACCEPTED;
        }
        return OutputComparator.matches(expected, raw.stdout())
                ? Verdict.ACCEPTED
                : Verdict.WRONG_ANSWER;
    }

    private static String readExpected(Path expectedFile) {
        if (expectedFile == null) {
            return null;
        }
        try {
            return Files.readString(expectedFile, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new DockerSandboxException(
                    "Expected output file unreadable: " + expectedFile, exception);
        }
    }

    /** Truncates stored/published IO to the configured cap. */
    public String truncate(String value) {
        if (value == null) {
            return null;
        }
        int max = this.properties.getIoTruncateChars();
        return value.length() <= max ? value : value.substring(0, max) + "\n... [truncated]";
    }

    /**
     * Raw execution plus its verdict for one case. The IO fields are already
     * truncated, so the persisted row and the streamed event carry exactly the
     * same bytes.
     *
     * @param actualOutput the program's stdout, possibly empty; null only when
     *                     the caller is not allowed to see it
     */
    public record CaseOutcome(
            JudgeCase testCase,
            Verdict verdict,
            long runtimeMs,
            long memoryKb,
            String stdout,
            String stderr,
            String expectedOutput,
            String actualOutput,
            int exitCode,
            boolean timedOut,
            boolean oomKilled) {

        /** True when this case's input and expected output may be shown. */
        public boolean exposesIo() {
            return this.testCase().kind() != JudgeCaseKind.HIDDEN;
        }
    }
}