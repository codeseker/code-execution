package com.example.codeexecution.common.websocket;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.example.codeexecution.modules.auth.services.TokenService;
import com.example.codeexecution.modules.auth.services.TokenStoreService;
import com.example.codeexecution.modules.submission.services.SubmissionEventPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Raw WebSocket gateway for submission lifecycle events.
 *
 * Handshake: {@code /ws?token=<accessToken>} - browsers cannot set headers
 * on a WS handshake, so the JWT is validated from the query string (same
 * services the HTTP filter uses, including the blacklist check).
 *
 * Client messages (JSON text frames):
 * <pre>
 * {"action":"subscribe","submissionId":"..."}
 * {"action":"unsubscribe","submissionId":"..."}
 * </pre>
 *
 * The server then pushes the job lifecycle ({@code JOB_QUEUED},
 * {@code JOB_PROCESSING}, {@code JOB_COMPLETED}, {@code JOB_FAILED}) and the
 * run stream ({@code RUN_STARTED}, one {@code CASE_RESULT} per case,
 * {@code RUN_FINISHED}) into room {@code submission:<id>}. Every run-stream
 * frame carries {@code runId} so a late frame from an earlier run can never
 * overwrite a newer one, and {@code RUN_FINISHED} always terminates the run
 * stream - including on compile errors and infrastructure failures.
 * Subscribing also replays the current state so late joiners catch up.
 */
@Component
public class SubmissionWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(SubmissionWebSocketHandler.class);

    /** Close code sent when the handshake token is missing/invalid. */
    private static final CloseStatus UNAUTHORIZED = CloseStatus.POLICY_VIOLATION.withReason("unauthorized");

    private final TokenService tokenService;
    private final TokenStoreService tokenStoreService;
    private final WebSocketSessionRegistry registry;
    private final SubmissionEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public SubmissionWebSocketHandler(
            TokenService tokenService,
            TokenStoreService tokenStoreService,
            WebSocketSessionRegistry registry,
            SubmissionEventPublisher eventPublisher,
            ObjectMapper objectMapper) {
        this.tokenService = tokenService;
        this.tokenStoreService = tokenStoreService;
        this.registry = registry;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = authenticate(session.getUri());
        if (userId == null) {
            session.close(UNAUTHORIZED);
            return;
        }
        this.registry.register(session, userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode node = this.objectMapper.readTree(message.getPayload());
            String action = path(node, "action");
            String submissionId = path(node, "submissionId");

            if (submissionId == null || submissionId.isBlank()) {
                sendError(session, "submissionId is required");
                return;
            }

            if ("subscribe".equals(action)) {
                handleSubscribe(session, submissionId);
            } else if ("unsubscribe".equals(action)) {
                this.registry.leave(this.eventPublisher.room(submissionId), session.getId());
            } else {
                sendError(session, "Unknown action: " + action);
            }
        } catch (Exception exception) {
            log.warn("Bad WebSocket message from {}: {}", session.getId(), exception.getMessage());
            sendError(session, "Malformed message");
        }
    }

    private void handleSubscribe(WebSocketSession session, String submissionId) {
        String userId = this.registry.userIdOf(session.getId());
        // Ownership check: a socket may only listen to its own submissions.
        if (!this.eventPublisher.belongsToUser(submissionId, userId)) {
            sendError(session, "Submission not found or not owned by you");
            return;
        }
        String room = this.eventPublisher.room(submissionId);
        this.registry.join(room, session.getId());
        // Replay the current state so late subscribers catch up instantly.
        this.eventPublisher.replay(submissionId, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        this.registry.unregister(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        this.registry.unregister(session.getId());
    }

    /** Extracts and validates {@code ?token=...}; null when rejected. */
    private String authenticate(URI uri) {
        if (uri == null) {
            return null;
        }
        String token = queryParam(uri.getRawQuery(), "token");
        if (token == null || token.isBlank()) {
            return null;
        }
        if (!this.tokenService.validateToken(token)
                || this.tokenStoreService.isAccessTokenBlacklisted(token)) {
            return null;
        }
        String userId = this.tokenService.getUserIdFromToken(token);
        return (userId == null || userId.isBlank()) ? null : userId;
    }

    private static String queryParam(String rawQuery, String name) {
        if (rawQuery == null) {
            return null;
        }
        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals(name)) {
                return java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private void sendError(WebSocketSession session, String reason) {
        try {
            Map<String, String> payload = Map.of("event", "ERROR", "message", reason);
            synchronized (session) {
                session.sendMessage(new TextMessage(
                        this.objectMapper.writeValueAsString(payload)));
            }
        } catch (IOException ignored) {
            // Socket already gone - nothing to do.
        }
    }

    private static String path(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
