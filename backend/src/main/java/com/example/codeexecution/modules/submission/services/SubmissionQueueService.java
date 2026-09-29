package com.example.codeexecution.modules.submission.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.dtos.JobMessage;
import com.example.codeexecution.modules.submission.entities.Language;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * One Redis list per runtime ({@code queue:cpp}, {@code queue:java},
 * {@code queue:python}, {@code queue:javascript}) so slow runtimes (Java
 * startup) can never starve fast ones (C++).
 *
 * Producers {@code LPUSH} and workers {@code BRPOP}, which makes each queue
 * FIFO. Payloads are the lightweight {@link JobMessage} JSON only - source
 * code and testcase files stay in Mongo/disk.
 */
@Service
public class SubmissionQueueService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionQueueService.class);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final ExecutionProperties properties;

    public SubmissionQueueService(
            StringRedisTemplate redis,
            ObjectMapper objectMapper,
            ExecutionProperties properties) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    /** Redis key for a language's queue, e.g. {@code queue:cpp}. */
    public String queueName(Language language) {
        return this.properties.getQueuePrefix() + language.name();
    }

    /**
     * Appends the job to its language queue and returns its 1-based queue
     * position (reported in {@code JOB_QUEUED}).
     */
    public int enqueue(JobMessage message) {
        String key = queueName(message.language());
        try {
            String payload = this.objectMapper.writeValueAsString(message);
            Long before = this.redis.opsForList().size(key);
            this.redis.opsForList().leftPush(key, payload);
            return (int) ((before == null ? 0 : before) + 1);
        } catch (JsonProcessingException exception) {
            // A record with fixed fields can never fail to serialize, but
            // if it somehow does, fail the API request instead of dropping
            // the job silently.
            throw new IllegalStateException("Could not serialize queue payload", exception);
        }
    }

    /**
     * Non-blocking pop for the worker: returns the FIFO-oldest job or
     * null when the queue is empty.
     *
     * <p>Deliberately NOT {@code BRPOP}: Lettuce multiplexes every
     * template operation over one shared connection, and a blocking
     * command monopolises it - all other Redis traffic (JWT blacklist,
     * OTP, enqueue) would stall for the full poll timeout. Workers
     * instead pop once per interval, which keeps the shared connection
     * free.
     */
    public JobMessage poll(Language language) {
        String payload = this.redis.opsForList().rightPop(queueName(language));
        if (payload == null) {
            return null;
        }
        try {
            return this.objectMapper.readValue(payload, JobMessage.class);
        } catch (JsonProcessingException exception) {
            log.error("Dropping malformed job from {}: {}", queueName(language), payload);
            return null;
        }
    }

    /** Current queue length; 0 when empty. */
    public Long position(Language language) {
        Long size = this.redis.opsForList().size(queueName(language));
        return size == null ? 0 : size;
    }
}
