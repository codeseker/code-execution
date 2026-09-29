package com.example.codeexecution.modules.submission.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * All tunables for the code execution system: Redis queues, in-app
 * workers, Docker sandbox limits and the per-language image registry.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.execution")
public class ExecutionProperties {

    /** Prefix of the per-language Redis lists, e.g. {@code queue:}. */
    private String queuePrefix = "queue:";

    /** Start one polling worker thread per language on boot. */
    private boolean workersEnabled = true;

    /**
     * Idle interval between queue polls. Workers use non-blocking RPOP
     * (never BRPOP) so they cannot monopolise Lettuce's shared
     * connection.
     */
    private long workerPollIntervalMs = 250;

    /** Host directory for per-submission source files and artifacts. */
    private String workDir = "./storage/executions";

    /** Docker daemon endpoint (unix socket or tcp://). */
    private String dockerHost = "unix:///var/run/docker.sock";

    /**
     * Centralized runtime registry: language code -> EXISTING container
     * name on this machine (e.g. {@code cpp -> cpp}). The judge runs code
     * via {@code docker exec} inside these containers; a language with no
     * entry is rejected at submit time.
     */
    private Map<String, String> containers = new HashMap<>();

    /**
     * Optional user override for exec sessions. Empty (default) = the
     * container's own configured user, since the containers are managed
     * outside the app.
     */
    private String containerUser = "";

    /** Extra wall-clock grace on top of a testcase's timeLimitMs. */
    private long runGraceMs = 1500;

    /** Budget for the compile phase (g++ / javac). */
    private long compileTimeoutMs = 15000;

    private long compileMemoryKb = 524288;

    /** Stored stdout/stderr are truncated to this many characters. */
    private int ioTruncateChars = 4096;

    /** Hard cap on submitted source code. */
    private int maxCodeChars = 100000;

    /** PID limit for sandbox containers (fork-bomb protection). */
    private long pidsLimit = 64;
}
