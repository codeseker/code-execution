package com.example.codeexecution.modules.submission.services;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashSet;
import java.util.Set;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.DockerSandboxException;
import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.entities.Language;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerCmd;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.command.InspectExecResponse;
import com.github.dockerjava.api.exception.NotFoundException;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.MemoryStatsConfig;
import com.github.dockerjava.api.model.PullResponseItem;
import com.github.dockerjava.api.model.Statistics;
import com.github.dockerjava.api.model.StatsConfig;
import com.github.dockerjava.api.model.StreamType;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;

import jakarta.annotation.PreDestroy;

/**
 * Executes judge workloads by {@code docker exec}-ing into the EXISTING
 * per-language containers on this machine ({@code cpp}, {@code java},
 * {@code python} - configured in {@code app.execution.containers.*}).
 *
 * Per submission:
 * <ol>
 * <li><b>Stage</b>: source is written to the host work dir and copied
 * into {@code /sandbox/<submissionId>} with {@code docker cp}.</li>
 * <li><b>Compile</b> (C++/Java): {@code g++/javac} via exec, artifact
 * lands in {@code /tmp/judge/<submissionId>} inside the container.
 * Interpreted languages skip this phase.</li>
 * <li><b>Run</b>: one exec per testcase with stdin redirected from the
 * copied input file, wrapped in GNU {@code timeout} as the inner
 * killer; the host-side await is the exact judge for TLE.</li>
 * <li><b>Clean up</b>: {@code rm -rf} of the submission dirs inside the
 * container plus the host work dir.</li>
 * </ol>
 *
 * Exit-code verdict mapping (classic container-judge conventions):
 * {@code 124} (GNU timeout) -> TLE, {@code 137} (SIGKILL, i.e. OOM-killer
 * on the shared container) -> MLE, any other non-zero -> RTE. Memory/CPU/
 * network limits are those the containers were CREATED with (docker exec
 * cannot change them) - see {@code backend/docker} for recommended flags.
 */
@Service
public class DockerSandboxService {

    private static final Logger log = LoggerFactory.getLogger(DockerSandboxService.class);

    /** Raw outcome of a single testcase exec run. */
    public record RunOutcome(
            boolean timedOut,
            boolean oomKilled,
            int exitCode,
            String stdout,
            String stderr,
            long elapsedMs,
            long memoryUsedKb) {
    }

    /** Result of the compile phase. */
    public record CompileOutcome(boolean success, String errorLogs) {
    }

    /** Raw exec session result before verdict mapping. */
    private record ExecOutcome(boolean timedOut, int exitCode, String stdout, String stderr) {
    }

    /** Context of an active submission container (static or ephemeral). */
    private record SubmissionContext(String containerId, boolean isEphemeral, Language language) {
    }

    private final ExecutionProperties properties;
    private final LanguageRegistry languageRegistry;
    private final DockerClient docker;
    private final Map<String, SubmissionContext> activeSubmissions = new ConcurrentHashMap<>();

    public DockerSandboxService(ExecutionProperties properties, LanguageRegistry languageRegistry) {
        this.properties = properties;
        this.languageRegistry = languageRegistry;
        this.docker = buildClient(properties.getDockerHost());
    }

    private static DockerClient buildClient(String dockerHost) {
        String resolvedHost = resolveDockerHost(dockerHost);
        DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost(resolvedHost)
                .build();
        DockerHttpClient httpClient = new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .connectionTimeout(Duration.ofSeconds(10))
                .responseTimeout(Duration.ofSeconds(60))
                .build();
        return DockerClientImpl.getInstance(config, httpClient);
    }

    private static String resolveDockerHost(String configuredHost) {
        if (configuredHost != null && !configuredHost.isBlank()) {
            return configuredHost;
        }
        String envHost = System.getenv("DOCKER_HOST");
        if (envHost != null && !envHost.isBlank()) {
            return envHost;
        }
        if (Files.exists(Path.of("/var/run/docker.sock"))) {
            return "unix:///var/run/docker.sock";
        }
        String xdg = System.getenv("XDG_RUNTIME_DIR");
        if (xdg != null && Files.exists(Path.of(xdg, "docker.sock"))) {
            return "unix://" + Path.of(xdg, "docker.sock");
        }
        String home = System.getProperty("user.home");
        if (home != null && Files.exists(Path.of(home, ".docker/desktop/docker.sock"))) {
            return "unix://" + Path.of(home, ".docker/desktop/docker.sock");
        }
        if (home != null && Files.exists(Path.of(home, ".docker/run/docker.sock"))) {
            return "unix://" + Path.of(home, ".docker/run/docker.sock");
        }
        return "unix:///var/run/docker.sock";
    }

    @EventListener(ApplicationReadyEvent.class)
    public void cleanOrphanedContainers() {
        try {
            var containers = this.docker.listContainersCmd().withShowAll(true).exec();
            for (var c : containers) {
                if (c.getNames() == null) continue;
                for (String name : c.getNames()) {
                    if (name.contains("judge-sub-") || name.startsWith("/judge-sub-")) {
                        try {
                            this.docker.removeContainerCmd(c.getId()).withForce(true).exec();
                            log.info("Cleaned up orphaned judge container {}", name);
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.debug("Orphaned container cleanup skipped: {}", ex.getMessage());
        }
    }

    @PreDestroy
    public void close() throws IOException {
        for (SubmissionContext ctx : this.activeSubmissions.values()) {
            if (ctx.isEphemeral()) {
                try {
                    this.docker.removeContainerCmd(ctx.containerId()).withForce(true).exec();
                } catch (Exception ignored) {
                }
            }
        }
        this.activeSubmissions.clear();
        this.docker.close();
    }

    /** Absolute per-submission staging directory on the host. */
    public Path workDirFor(String submissionId) {
        String safeId = submissionId.replaceAll("[^A-Za-z0-9_-]", "_");
        return Path.of(this.properties.getWorkDir()).toAbsolutePath().resolve(safeId);
    }

    // ------------------------------------------------------------------
    // Runtime availability
    // ------------------------------------------------------------------

    /**
     * True when the language can be run on this machine (either via an existing
     * container or via ephemeral container creation).
     */
    public boolean isRuntimeAvailable(Language language) {
        if (language == null) {
            return false;
        }
        try {
            this.docker.pingCmd().exec();
        } catch (RuntimeException exception) {
            throw new DockerSandboxException(
                    "Cannot reach the Docker daemon (" + this.properties.getDockerHost()
                            + "): " + exception.getMessage()
                            + ". Check that the Docker daemon is running and your user "
                            + "can access it (e.g. is in the docker group).",
                    exception);
        }

        if ("static".equalsIgnoreCase(this.properties.getContainerMode())) {
            String container = containerName(language);
            if (container == null) {
                return false;
            }
            try {
                this.docker.inspectContainerCmd(container).exec();
                return true;
            } catch (NotFoundException exception) {
                return false;
            }
        }

        return this.properties.getContainers().containsKey(language.name())
                || this.properties.getImages().containsKey(language.name())
                || defaultImage(language) != null;
    }

    // ------------------------------------------------------------------
    // Compile phase
    // ------------------------------------------------------------------

    /**
     * Stages the source into {@code /sandbox/<sid>} and runs the build
     * phase for compiled languages; interpreted languages short-circuit
     * to success after staging.
     *
     * @throws DockerSandboxException on Docker/IO failures (-> SYSTEM_ERROR)
     */
    public CompileOutcome compile(String submissionId, Language language, String code) {
        String container = getOrCreateContainer(submissionId, language);
        stageSource(container, submissionId, language, code);

        String compileCommand = compileCommand(language, submissionId);
        if (compileCommand == null) {
            return new CompileOutcome(true, null);
        }

        ExecOutcome outcome = exec(container, compileCommand, this.properties.getCompileTimeoutMs());

        if (outcome.timedOut()) {
            return new CompileOutcome(false,
                    "Compilation timed out after " + this.properties.getCompileTimeoutMs() + " ms");
        }
        if (outcome.exitCode() != 0) {
            String logs = (outcome.stdout() + outcome.stderr()).strip();
            return new CompileOutcome(false,
                    logs.isBlank() ? "Compiler exited with status " + outcome.exitCode() : logs);
        }
        return new CompileOutcome(true, null);
    }

    // ------------------------------------------------------------------
    // Run phase
    // ------------------------------------------------------------------

    /**
     * Runs one testcase in the language's container and returns the raw
     * outcome for the caller to grade.
     *
     * @param inputFilePath host path of the {@code .in} file
     * @param memoryLimitKb advisory: exec cannot change limits - the
     *                      container's own {@code -m} applies
     * @throws DockerSandboxException on Docker/IO failures (-> SYSTEM_ERROR)
     */
    public RunOutcome runTestCase(
            String submissionId,
            Language language,
            String inputFilePath,
            long timeLimitMs,
            long memoryLimitKb) {

        String container = getOrCreateContainer(submissionId, language);
        Path input = Path.of(inputFilePath).toAbsolutePath();
        if (!Files.isRegularFile(input)) {
            throw new DockerSandboxException("Testcase input file missing: " + input);
        }

        copyInput(container, submissionId, input);

        long hostTimeoutMs = timeLimitMs + this.properties.getRunGraceMs();
        String runCommand = runCommand(language, submissionId, hostTimeoutMs);

        AtomicLong peakMemoryKb = new AtomicLong(0);
        ResultCallback<Statistics> statsCallback = startMemorySampler(container, peakMemoryKb);
        long startedAt = System.nanoTime();
        try {
            ExecOutcome outcome = exec(container, runCommand, hostTimeoutMs);
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000L;

            // GNU timeout exits 124; a host-side timeout means the exec
            // never finished at all. SIGKILL (137) on a non-timeout run is
            // the OOM killer on the shared container.
            boolean timedOut = outcome.timedOut() || outcome.exitCode() == 124;
            boolean oomKilled = !timedOut && outcome.exitCode() == 137;

            return new RunOutcome(
                    timedOut, oomKilled, outcome.exitCode(),
                    outcome.stdout(), outcome.stderr(),
                    elapsedMs, peakMemoryKb.get());
        } finally {
            stopQuietly(statsCallback);
        }
    }

    /** Removes ephemeral container (if created) or cleans submission dirs from static containers + host. */
    public void cleanup(String submissionId) {
        SubmissionContext context = this.activeSubmissions.remove(submissionId);
        if (context != null && context.isEphemeral()) {
            try {
                this.docker.removeContainerCmd(context.containerId()).withForce(true).exec();
                log.info("Cleaned up and removed ephemeral sandbox container '{}' for submission {}",
                        context.containerId(), submissionId);
            } catch (Exception exception) {
                log.warn("Could not remove ephemeral container {}: {}", context.containerId(), exception.getMessage());
            }
        } else {
            String staticContainer = (context != null) ? context.containerId() : null;
            Set<String> targets = (staticContainer != null) ? Set.of(staticContainer) : configuredContainers();
            for (String container : targets) {
                String command = "rm -rf /sandbox/" + submissionId + " /tmp/judge/" + submissionId;
                try {
                    exec(container, command, 10_000L);
                } catch (RuntimeException exception) {
                    log.debug("Cleanup exec failed on {}: {}", container, exception.getMessage());
                }
            }
        }
        deleteHostWorkDir(submissionId);
    }

    // ------------------------------------------------------------------
    // Container management
    // ------------------------------------------------------------------

    private String containerName(Language language) {
        if (language == null) return null;
        String name = this.languageRegistry.containerName(language);
        return (name == null || name.isBlank()) ? null : name;
    }

    private Set<String> configuredContainers() {
        Set<String> containers = new HashSet<>();
        for (String name : this.properties.getContainers().values()) {
            if (name != null && !name.isBlank()) {
                containers.add(name);
            }
        }
        return containers;
    }

    /**
     * Resolves the container to use for this submission:
     * - Returns an existing running static container if mode is auto/static.
     * - If static container is not running or mode is ephemeral, creates a separate container.
     */
    private String getOrCreateContainer(String submissionId, Language language) {
        SubmissionContext existing = this.activeSubmissions.get(submissionId);
        if (existing != null) {
            return existing.containerId();
        }

        String mode = this.properties.getContainerMode();
        if ("static".equalsIgnoreCase(mode) || "auto".equalsIgnoreCase(mode)) {
            String staticName = containerName(language);
            if (staticName != null) {
                boolean running = ensureRunning(staticName);
                if (running) {
                    SubmissionContext ctx = new SubmissionContext(staticName, false, language);
                    this.activeSubmissions.put(submissionId, ctx);
                    return staticName;
                }
                if ("static".equalsIgnoreCase(mode)) {
                    throw new DockerSandboxException(
                            "Container '" + staticName + "' is not running and app.execution.container-mode is static.");
                }
                log.info("Static container '{}' is not running. Spinning up separate ephemeral container for submission {}",
                        staticName, submissionId);
            }
        }

        String containerId = createEphemeralContainer(submissionId, language);
        SubmissionContext ctx = new SubmissionContext(containerId, true, language);
        this.activeSubmissions.put(submissionId, ctx);
        return containerId;
    }

    private String createEphemeralContainer(String submissionId, Language language) {
        String imageName = resolveImage(language);
        ensureImageAvailable(imageName);

        String safeId = submissionId.replaceAll("[^A-Za-z0-9_-]", "_");
        String name = "judge-sub-" + safeId;

        try {
            this.docker.removeContainerCmd(name).withForce(true).exec();
        } catch (NotFoundException ignored) {
        } catch (Exception e) {
            log.debug("Pre-clean of container {} failed: {}", name, e.getMessage());
        }

        long memoryBytes = Math.max(512 * 1024 * 1024L, this.properties.getCompileMemoryKb() * 1024L);
        HostConfig hostConfig = HostConfig.newHostConfig()
                .withNetworkMode("none")
                .withMemory(memoryBytes)
                .withMemorySwap(memoryBytes)
                .withPidsLimit(this.properties.getPidsLimit());

        var createCmd = this.docker.createContainerCmd(imageName)
                .withName(name)
                .withCmd("/bin/sh", "-c", "trap : TERM INT; sleep 3600 & wait")
                .withHostConfig(hostConfig)
                .withWorkingDir("/sandbox");

        if (this.properties.getContainerUser() != null && !this.properties.getContainerUser().isBlank()) {
            createCmd.withUser(this.properties.getContainerUser());
        }

        try {
            CreateContainerResponse response = createCmd.exec();
            String containerId = response.getId();
            this.docker.startContainerCmd(containerId).exec();

            // Prepare base directories as root so they are accessible to any user
            try {
                exec(containerId, "mkdir -p /sandbox /tmp/judge && chmod 777 /sandbox /tmp/judge", 10_000L, "0:0");
            } catch (Exception ex) {
                log.debug("Non-root directory creation for {}: {}", containerId, ex.getMessage());
                exec(containerId, "mkdir -p /sandbox /tmp/judge", 10_000L, null);
            }

            log.info("Created and started separate sandbox container '{}' (id: {}) using image '{}'",
                    name, containerId, imageName);
            return containerId;
        } catch (RuntimeException exception) {
            throw new DockerSandboxException(
                    "Failed to create separate container for language '" + language + "': " + exception.getMessage(),
                    exception);
        }
    }

    private String resolveImage(Language language) {
        String staticName = containerName(language);
        if (staticName != null) {
            try {
                InspectContainerResponse info = this.docker.inspectContainerCmd(staticName).exec();
                if (info.getConfig() != null && info.getConfig().getImage() != null && !info.getConfig().getImage().isBlank()) {
                    String img = info.getConfig().getImage();
                    log.debug("Found image '{}' from existing static container '{}'", img, staticName);
                    return img;
                }
            } catch (Exception ignored) {
            }
        }

        String configuredImage = this.properties.getImages().get(language.name());
        if (configuredImage != null && !configuredImage.isBlank()) {
            return configuredImage;
        }

        return defaultImage(language);
    }

    private static String defaultImage(Language language) {
        return switch (language) {
            case cpp -> "gcc:14.2";
            case java -> "eclipse-temurin:21-jdk-jammy";
            case python -> "python:3.12-slim";
            case javascript -> "node:22-slim";
        };
    }

    private void ensureImageAvailable(String imageName) {
        try {
            this.docker.inspectImageCmd(imageName).exec();
        } catch (NotFoundException e) {
            log.info("Docker image '{}' not found locally. Pulling image...", imageName);
            try {
                this.docker.pullImageCmd(imageName)
                        .exec(new ResultCallback.Adapter<PullResponseItem>())
                        .awaitCompletion(5, TimeUnit.MINUTES);
                log.info("Successfully pulled image '{}'", imageName);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new DockerSandboxException("Interrupted while pulling image '" + imageName + "'", ie);
            } catch (Exception pe) {
                throw new DockerSandboxException(
                        "Image '" + imageName + "' could not be pulled: " + pe.getMessage(), pe);
            }
        } catch (RuntimeException e) {
            log.warn("Could not inspect image '{}': {}", imageName, e.getMessage());
        }
    }

    /** Checks if the container is running. If stopped, attempts to start it. */
    private boolean ensureRunning(String container) {
        try {
            InspectContainerResponse info = this.docker.inspectContainerCmd(container).exec();
            if (Boolean.TRUE.equals(info.getState().getRunning())) {
                return true;
            }
            this.docker.startContainerCmd(container).exec();
            for (int attempt = 0; attempt < 8; attempt++) {
                Thread.sleep(250);
                info = this.docker.inspectContainerCmd(container).exec();
                if (Boolean.TRUE.equals(info.getState().getRunning())) {
                    return true;
                }
            }
            log.warn("Container '{}' exists but failed to remain running", container);
            return false;
        } catch (NotFoundException exception) {
            log.debug("Container '{}' not found", container);
            return false;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new DockerSandboxException("Interrupted while starting container", exception);
        } catch (RuntimeException exception) {
            log.warn("Could not start container '{}': {}", container, exception.getMessage());
            return false;
        }
    }

    // ------------------------------------------------------------------
    // docker cp staging
    // ------------------------------------------------------------------

    private void stageSource(String container, String submissionId, Language language, String code) {
        Path workDir = prepareHostWorkDir(submissionId, language, code);
        String destination = "/sandbox/" + submissionId;
        ensureDir(container, destination);
        try {
            this.docker.copyArchiveToContainerCmd(container)
                    .withHostResource(workDir.toString())
                    .withDirChildrenOnly(true)
                    .withRemotePath(destination)
                    .exec();
        } catch (RuntimeException exception) {
            throw new DockerSandboxException(
                    "Could not copy source into container '" + container + "': "
                            + exception.getMessage(),
                    exception);
        }
    }

    private void copyInput(String container, String submissionId, Path input) {
        String destination = "/tmp/judge/" + submissionId;
        ensureDir(container, destination);

        // docker cp preserves the source basename, and the run command
        // reads exactly /tmp/judge/<sid>/input.in - so stage a copy under
        // that fixed name first.
        Path staged = workDirFor(submissionId).resolve("input.in");
        try {
            Files.createDirectories(staged.getParent());
            Files.copy(input, staged, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new DockerSandboxException("Could not stage testcase input", exception);
        }

        try {
            this.docker.copyArchiveToContainerCmd(container)
                    .withHostResource(staged.toString())
                    .withRemotePath(destination)
                    .exec();
        } catch (RuntimeException exception) {
            throw new DockerSandboxException(
                    "Could not copy testcase input into container '" + container + "': "
                            + exception.getMessage(),
                    exception);
        }
    }

    /**
     * docker cp refuses to extract into a path that does not exist yet
     * (404 "Could not find the file"), so create the destination with a
     * quick exec first.
     */
    private void ensureDir(String container, String directory) {
        ExecOutcome outcome = exec(container, "mkdir -p " + directory, 10_000L);
        if (outcome.exitCode() != 0) {
            throw new DockerSandboxException(
                    "Could not create " + directory + " in container '" + container + "': "
                            + outcome.stderr());
        }
    }

    private Path prepareHostWorkDir(String submissionId, Language language, String code) {
        Path workDir = workDirFor(submissionId);
        try {
            Files.createDirectories(workDir);
            Files.writeString(workDir.resolve(this.languageRegistry.sourceFileName(language)),
                    code == null ? "" : code,
                    StandardCharsets.UTF_8,
                    java.nio.file.StandardOpenOption.CREATE,
                    java.nio.file.StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException exception) {
            throw new DockerSandboxException("Could not prepare work directory", exception);
        }
        return workDir;
    }

    private void deleteHostWorkDir(String submissionId) {
        try {
            Path workDir = workDirFor(submissionId);
            if (Files.exists(workDir)) {
                try (var walk = Files.walk(workDir)) {
                    walk.sorted(java.util.Comparator.reverseOrder())
                            .forEach(path -> {
                                try {
                                    Files.deleteIfExists(path);
                                } catch (IOException ignored) {
                                    // best effort
                                }
                            });
                }
            }
        } catch (IOException exception) {
            log.warn("Could not clean work dir for {}: {}", submissionId, exception.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Shell command construction (container paths)
    // ------------------------------------------------------------------

    private static String sandboxDir(String submissionId) {
        return "/sandbox/" + submissionId;
    }

    private static String artifactDir(String submissionId) {
        return "/tmp/judge/" + submissionId;
    }

    /**
     * Build command, or null for interpreted languages.
     *
     * <p>The timeout invocation is deliberately portable: plain integer
     * seconds with no {@code -k} flag, because the judge containers mix
     * GNU coreutils (temurin images) with BusyBox (alpine images) and
     * BusyBox {@code timeout} rejects both {@code -k} and the {@code s}
     * duration suffix. The host-side await is still the exact TLE judge.
     */
    private String compileCommand(Language language, String submissionId) {
        String sandbox = sandboxDir(submissionId);
        String artifact = artifactDir(submissionId);
        long seconds = this.properties.getCompileTimeoutMs() / 1000 + 1;
        String timeout = "timeout " + seconds;

        return switch (language) {
            case cpp -> "mkdir -p " + artifact + " && " + timeout
                    + " g++ -O2 -std=c++17 -o " + artifact + "/exec " + sandbox + "/main.cpp";
            case java -> "mkdir -p " + artifact + " && " + timeout
                    + " javac -d " + artifact + " " + sandbox + "/Main.java";
            case python, javascript -> null;
        };
    }

    /** Run command with stdin redirected from the staged input file. */
    private String runCommand(Language language, String submissionId, long hostTimeoutMs) {
        String sandbox = sandboxDir(submissionId);
        String artifact = artifactDir(submissionId);
        String input = artifact + "/input.in";
        // Inner killer: slightly longer than the host-side judge so the
        // host timeout normally wins the race, but the process can never
        // outlive its container exec indefinitely.
        long seconds = (hostTimeoutMs + 999) / 1000 + 1;
        String timeout = "timeout " + seconds;

        return switch (language) {
            case cpp -> timeout + " " + artifact + "/exec < " + input;
            case java -> timeout + " java -cp " + artifact + " Main < " + input;
            case python -> timeout + " python3 " + sandbox + "/main.py < " + input;
            case javascript -> timeout + " node " + sandbox + "/main.js < " + input;
        };
    }

    // ------------------------------------------------------------------
    // Exec plumbing
    // ------------------------------------------------------------------

    private ExecOutcome exec(String containerId, String shellCommand, long hostTimeoutMs) {
        return exec(containerId, shellCommand, hostTimeoutMs, null);
    }

    private ExecOutcome exec(String containerId, String shellCommand, long hostTimeoutMs, String user) {
        String execId;
        try {
            var execCreateCmd = this.docker.execCreateCmd(containerId)
                    .withCmd("/bin/sh", "-c", shellCommand)
                    .withAttachStdout(true)
                    .withAttachStderr(true);
            String effectiveUser = (user != null && !user.isBlank()) ? user : this.properties.getContainerUser();
            if (effectiveUser != null && !effectiveUser.isBlank()) {
                execCreateCmd.withUser(effectiveUser);
            }
            ExecCreateCmdResponse created = execCreateCmd.exec();
            execId = created.getId();
        } catch (RuntimeException exception) {
            throw new DockerSandboxException(
                    "Could not create exec in '" + containerId + "': " + exception.getMessage(),
                    exception);
        }

        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();
        ResultCallback.Adapter<Frame> callback = new ResultCallback.Adapter<Frame>() {
            @Override
            public void onNext(Frame frame) {
                byte[] payload = frame.getPayload();
                if (payload == null) {
                    return;
                }
                if (frame.getStreamType() == StreamType.STDERR) {
                    writeCapped(stderr, payload);
                } else {
                    writeCapped(stdout, payload);
                }
            }
        };

        boolean finished = false;
        try {
            this.docker.execStartCmd(execId).exec(callback);
            finished = callback.awaitCompletion(hostTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new DockerSandboxException("Interrupted while waiting for execution", exception);
        } catch (RuntimeException exception) {
            throw new DockerSandboxException(
                    "Exec start failed in '" + containerId + "': " + exception.getMessage(),
                    exception);
        } finally {
            if (!finished) {
                try {
                    callback.close();
                } catch (Exception ignored) {
                    // The daemon drops the stream when the exec dies.
                }
            }
        }

        int exitCode = -1;
        if (finished) {
            try {
                InspectExecResponse inspect = this.docker.inspectExecCmd(execId).exec();
                Long code = inspect.getExitCodeLong();
                exitCode = code == null ? -1 : code.intValue();
            } catch (RuntimeException exception) {
                log.debug("Could not inspect exec {}: {}", execId, exception.getMessage());
            }
        }

        return new ExecOutcome(
                !finished,
                exitCode,
                truncate(stdout.toString(StandardCharsets.UTF_8)),
                truncate(stderr.toString(StandardCharsets.UTF_8)));
    }

    // ------------------------------------------------------------------
    // Telemetry helpers
    // ------------------------------------------------------------------

    private static void writeCapped(ByteArrayOutputStream sink, byte[] payload) {
        int room = 256 * 1024 - sink.size();
        if (room > 0) {
            sink.write(payload, 0, Math.min(payload.length, room));
        }
    }

    private String truncate(String value) {
        int max = this.properties.getIoTruncateChars();
        if (value == null || value.length() <= max) {
            return value == null ? "" : value;
        }
        return value.substring(0, max) + "\n... [truncated]";
    }

    /**
     * Best-effort peak memory of the CONTAINER during the run (it is
     * shared per language, so this includes the container baseline).
     */
    private ResultCallback<Statistics> startMemorySampler(String containerId, AtomicLong peakMemoryKb) {
        try {
            return this.docker.statsCmd(containerId)
                    .exec(new ResultCallback.Adapter<Statistics>() {
                        @Override
                        public void onNext(Statistics statistics) {
                            try {
                                MemoryStatsConfig mem = statistics.getMemoryStats();
                                if (mem == null || mem.getUsage() == null) {
                                    return;
                                }
                                long usage = mem.getUsage();

                                long cache = 0L;
                                StatsConfig stats = mem.getStats();
                                if (stats != null) {
                                    // cgroup v1: total_inactive_file / cache; cgroup v2: inactive_file
                                    Long v = stats.getTotalInactiveFile();
                                    if (v == null)
                                        v = stats.getInactiveFile();
                                    if (v == null)
                                        v = stats.getCache();
                                    if (v != null) {
                                        cache = v;
                                    }
                                }

                                long usedKb = Math.max(0L, usage - cache) / 1024L;
                                peakMemoryKb.accumulateAndGet(usedKb, Math::max);
                            } catch (RuntimeException ignored) {
                                // Stats are best-effort telemetry.
                            }
                        }

                        @Override
                        public void onError(Throwable throwable) {
                            // Container may have exited - sampling ends.
                        }
                    });
        } catch (RuntimeException exception) {
            log.debug("Memory stats unavailable for {}: {}", containerId, exception.getMessage());
            return null;
        }
    }

    private void stopQuietly(ResultCallback<Statistics> statsCallback) {
        if (statsCallback != null) {
            try {
                statsCallback.close();
            } catch (Exception ignored) {
                // The daemon closes the stats stream when the container dies.
            }
        }
    }
}
