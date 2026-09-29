package com.example.codeexecution.common.websocket;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

/**
 * In-memory registry of live WebSocket connections.
 *
 * - which user owns each socket (established at handshake via {@code ?token=})
 * - which sockets joined which {@code submission:<id>} room
 *
 * Rooms are the isolation boundary: a socket only ever receives events for
 * submissions it explicitly subscribed to (and owns).
 */
@Component
public class WebSocketSessionRegistry {

    private record SessionHolder(String userId, WebSocketSession session) {
    }

    private final Map<String, SessionHolder> sessions = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();

    public void register(WebSocketSession session, String userId) {
        this.sessions.put(session.getId(), new SessionHolder(userId, session));
    }

    public void unregister(String sessionId) {
        this.sessions.remove(sessionId);
        // Clean up any rooms the socket was still part of.
        this.rooms.values().forEach(members -> members.remove(sessionId));
        this.rooms.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }

    /** Owner of a socket, or null if it never completed the handshake. */
    public String userIdOf(String sessionId) {
        SessionHolder holder = this.sessions.get(sessionId);
        return holder == null ? null : holder.userId();
    }

    public WebSocketSession session(String sessionId) {
        SessionHolder holder = this.sessions.get(sessionId);
        return holder == null ? null : holder.session();
    }

    public void join(String room, String sessionId) {
        this.rooms.computeIfAbsent(room, key -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void leave(String room, String sessionId) {
        Set<String> members = this.rooms.get(room);
        if (members != null) {
            members.remove(sessionId);
            if (members.isEmpty()) {
                this.rooms.remove(room, members);
            }
        }
    }

    /** Live sockets currently subscribed to the room. */
    public Set<WebSocketSession> membersOf(String room) {
        Set<String> ids = this.rooms.getOrDefault(room, Collections.emptySet());
        Set<WebSocketSession> result = ConcurrentHashMap.newKeySet();
        for (String id : ids) {
            WebSocketSession session = session(id);
            if (session != null && session.isOpen()) {
                result.add(session);
            }
        }
        return result;
    }
}
