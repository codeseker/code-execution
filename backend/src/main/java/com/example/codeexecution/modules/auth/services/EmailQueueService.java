package com.example.codeexecution.modules.auth.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.example.codeexecution.modules.auth.dtos.EmailJobMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Redis list backing the async email pipeline ({@code queue:email} by
 * default). Producers {@code LPUSH} and the single email worker
 * {@code RPOPs}, which makes delivery FIFO: registration enqueues the OTP
 * job and returns immediately, so SMTP latency never blocks the API.
 *
 * <p>Like {@code SubmissionQueueService}, the worker polls with a
 * non-blocking RPOP (never BRPOP): Lettuce multiplexes every template
 * operation over one shared connection and a blocking command would
 * stall all other Redis traffic (JWT blacklist, OTP, judge queues) for
 * the full poll timeout.
 */
@Service
public class EmailQueueService {

    private static final Logger log = LoggerFactory.getLogger(EmailQueueService.class);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final String queueKey;

    public EmailQueueService(
            StringRedisTemplate redis,
            ObjectMapper objectMapper,
            @Value("${app.email.queue-key:queue:email}") String queueKey) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.queueKey = queueKey;
    }

    /** Redis key of the email queue, e.g. {@code queue:email}. */
    public String queueKey() {
        return this.queueKey;
    }

    /**
     * Appends an email job to the queue.
     *
     * A serialization failure rethrows so the caller (register) fails the
     * request loudly instead of silently dropping the OTP email.
     */
    public void enqueue(EmailJobMessage message) {
        try {
            String payload = this.objectMapper.writeValueAsString(message);
            this.redis.opsForList().leftPush(this.queueKey, payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize email job", exception);
        }
    }

    /**
     * Non-blocking pop for the worker: returns the FIFO-oldest job or
     * null when the queue is empty.
     */
    public EmailJobMessage poll() {
        String payload = this.redis.opsForList().rightPop(this.queueKey);
        if (payload == null) {
            return null;
        }
        try {
            return this.objectMapper.readValue(payload, EmailJobMessage.class);
        } catch (JsonProcessingException exception) {
            log.error("Dropping malformed email job from {}: {}", this.queueKey, payload);
            return null;
        }
    }

    /** Current queue length; 0 when empty. */
    public Long size() {
        Long size = this.redis.opsForList().size(this.queueKey);
        return size == null ? 0 : size;
    }
}
