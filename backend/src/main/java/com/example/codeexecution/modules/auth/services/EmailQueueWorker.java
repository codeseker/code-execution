package com.example.codeexecution.modules.auth.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.example.codeexecution.modules.auth.dtos.EmailJobMessage;

import jakarta.annotation.PreDestroy;

/**
 * Single in-app consumer of the Redis email queue: one daemon thread
 * polls {@code queue:email} and hands each job to {@link EmailService},
 * so SMTP round-trips happen off the request thread and a slow or
 * down mail server never delays register responses.
 *
 * <p>Follows the {@code SubmissionWorker} pattern: non-blocking RPOP on
 * an idle interval (keeps Lettuce's shared connection free), a short
 * retry window for transient SMTP failures, then the job is dropped with
 * an error log rather than blocking the queue for everyone else.
 */
@Component
public class EmailQueueWorker {

    private static final Logger log = LoggerFactory.getLogger(EmailQueueWorker.class);

    /** Attempts per job before it is dropped (SMTP hiccups only). */
    private static final int MAX_ATTEMPTS = 3;

    /** Pause between retry attempts and after an unexpected crash. */
    private static final long RETRY_DELAY_MS = 1000;

    private final EmailQueueService queueService;
    private final EmailService emailService;
    private final boolean enabled;
    private final long pollIntervalMs;

    private Thread thread;
    private volatile boolean running;

    public EmailQueueWorker(
            EmailQueueService queueService,
            EmailService emailService,
            @Value("${app.email.worker-enabled:true}") boolean enabled,
            @Value("${app.email.worker-poll-interval-ms:250}") long pollIntervalMs) {
        this.queueService = queueService;
        this.emailService = emailService;
        this.enabled = enabled;
        this.pollIntervalMs = pollIntervalMs;
    }

    /** Starts the consumer once the app is ready (seeding has run). */
    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!this.enabled || this.running) {
            return;
        }
        this.running = true;
        this.thread = new Thread(this::loop, "email-worker");
        this.thread.setDaemon(true);
        this.thread.start();
        log.info("Started email queue worker (queue: {})", this.queueService.queueKey());
    }

    @PreDestroy
    public void stop() {
        this.running = false;
        if (this.thread != null) {
            this.thread.interrupt();
        }
    }

    private void loop() {
        while (this.running && !Thread.currentThread().isInterrupted()) {
            try {
                EmailJobMessage job = this.queueService.poll();
                if (job == null) {
                    Thread.sleep(this.pollIntervalMs); // idle: keep the shared Redis connection free
                    continue;
                }
                send(job);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception exception) {
                log.error("Email worker crashed on a job: {}", exception.getMessage());
                try {
                    Thread.sleep(RETRY_DELAY_MS); // back off instead of hot-looping
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    /** Sends one job, retrying transient SMTP failures a few times. */
    private void send(EmailJobMessage job) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                dispatch(job);
                return;
            } catch (Exception exception) {
                log.warn("Could not send {} email to {} (attempt {}/{}): {}",
                        job.type(), job.to(), attempt, MAX_ATTEMPTS, exception.getMessage());
                if (attempt == MAX_ATTEMPTS) {
                    log.error("Dropping {} email job for {}: {}",
                            job.type(), job.to(), exception.getMessage());
                    return;
                }
                try {
                    Thread.sleep(RETRY_DELAY_MS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private void dispatch(EmailJobMessage job) {
        switch (job.type()) {
            case OTP -> this.emailService.sendOtpEmail(job.to(), job.username(), job.value());
            case PASSWORD_RESET -> this.emailService.sendPasswordResetEmail(job.to(), job.username(), job.value());
        }
    }
}
