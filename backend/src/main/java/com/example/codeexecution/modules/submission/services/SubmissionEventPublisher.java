package com.example.codeexecution.modules.submission.services;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.example.codeexecution.common.websocket.WebSocketSessionRegistry;
import com.example.codeexecution.modules.submission.dtos.JobMessage;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionResult;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;
import com.example.codeexecution.modules.submission.mapper.SubmissionResponseMapper;
import com.example.codeexecution.modules.submission.repositories.SubmissionRepository;
import com.example.codeexecution.modules.submission.repositories.SubmissionResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Broadcasts submission lifecycle events to the {@code submission:<id>}
 * room via the raw WebSocket gateway.
 *
 * Event names follow the spec: {@code JOB_QUEUED}, {@code JOB_PROCESSING},
 * {@code TESTCASE_PROGRESS}, {@code JOB_COMPLETED}, {@code JOB_FAILED}.
 * {@link #replay} answers a late subscription with the current state so no
 * event is ever missed even if the socket connected after the fact.
 */
@Service
public class SubmissionEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(SubmissionEventPublisher.class);

    private final WebSocketSessionRegistry registry;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final SubmissionQueueService queueService;
    private final ObjectMapper objectMapper;

    public SubmissionEventPublisher(
            WebSocketSessionRegistry registry,
            SubmissionRepository submissionRepository,
            SubmissionResultRepository resultRepository,
            SubmissionQueueService queueService,
            ObjectMapper objectMapper) {
        this.registry = registry;
        this.submissionRepository = submissionRepository;
        this.resultRepository = resultRepository;
        this.queueService = queueService;
        this.objectMapper = objectMapper;
    }

    /** Room name for a submission, e.g. {@code submission:64f...}. */
    public String room(String submissionId) {
        return "submission:" + submissionId;
    }

    /** Ownership check used before letting a socket join a room. */
    public boolean belongsToUser(String submissionId, String userId) {
        if (userId == null) {
            return false;
        }
        return this.submissionRepository.findById(submissionId)
                .map(submission -> userId.equals(submission.getUserId()))
                .orElse(false);
    }

    public void publishQueued(JobMessage job, int queuePosition) {
        publish(job.submissionId(), "JOB_QUEUED", Map.of(
                "submissionId", job.submissionId(),
                "queuePosition", queuePosition,
                "language", job.language().name()));
    }

    public void publishProcessing(String submissionId) {
        publish(submissionId, "JOB_PROCESSING",
                Map.of("submissionId", submissionId));
    }

    public void publishProgress(
            String submissionId, int passed, int completed, int total, String lastVerdict) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("submissionId", submissionId);
        data.put("passed", passed);
        data.put("completed", completed);
        data.put("total", total);
        data.put("lastVerdict", lastVerdict);
        publish(submissionId, "TESTCASE_PROGRESS", data);
    }

    public void publishCompleted(String submissionId, SubmissionResult result, boolean includeIo) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("submissionId", submissionId);
        data.put("result", SubmissionResponseMapper.toResultResponse(result, includeIo));
        publish(submissionId, "JOB_COMPLETED", data);
    }

    public void publishFailed(String submissionId, String reason) {
        publish(submissionId, "JOB_FAILED", Map.of(
                "submissionId", submissionId,
                "error", reason == null ? "System error" : reason));
    }

    /**
     * Sends the current state of the submission to a single socket that
     * just subscribed (catch-up for late joiners).
     */
    public void replay(String submissionId, WebSocketSession session) {
        Submission submission = this.submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            send(session, "JOB_FAILED", Map.of(
                    "submissionId", submissionId, "error", "Submission not found"));
            return;
        }

        SubmissionStatus status = submission.getStatus();
        switch (status) {
            case QUEUED -> send(session, "JOB_QUEUED", Map.of(
                    "submissionId", submissionId,
                    "queuePosition", Math.max(1, this.queueService.position(submission.getLanguage()))));
            case PROCESSING -> send(session, "JOB_PROCESSING",
                    Map.of("submissionId", submissionId));
            case COMPLETED -> {
                SubmissionResult result = this.resultRepository
                        .findBySubmissionId(submissionId).orElse(null);
                boolean includeIo = submission.getType() == SubmissionType.EXAMPLE_EVAL;
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("submissionId", submissionId);
                data.put("result", result == null
                        ? null
                        : SubmissionResponseMapper.toResultResponse(result, includeIo));
                send(session, "JOB_COMPLETED", data);
            }
            case FAILED -> send(session, "JOB_FAILED", Map.of(
                    "submissionId", submissionId, "error", "Submission failed"));
        }
    }

    private void publish(String submissionId, String event, Map<String, Object> data) {
        String room = room(submissionId);
        for (WebSocketSession session : this.registry.membersOf(room)) {
            send(session, event, data);
        }
    }

    private void send(WebSocketSession session, String event, Map<String, Object> data) {
        if (session == null || !session.isOpen()) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", event);
        payload.putAll(data);
        try {
            String json = this.objectMapper.writeValueAsString(payload);
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (Exception exception) {
            log.debug("Could not push {} to {}: {}", event, session.getId(), exception.getMessage());
        }
    }
}
