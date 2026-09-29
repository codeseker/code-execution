package com.example.codeexecution.common.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Registers the raw submission-event gateway at {@code /ws}. The handshake
 * itself is stateless: the handler validates {@code ?token=} itself, so no
 * Spring Security session is involved.
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SubmissionWebSocketHandler submissionWebSocketHandler;

    public WebSocketConfig(SubmissionWebSocketHandler submissionWebSocketHandler) {
        this.submissionWebSocketHandler = submissionWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(this.submissionWebSocketHandler, "/ws")
                .setAllowedOriginPatterns("*");
    }
}
