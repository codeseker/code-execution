import { useEffect, useRef, useState } from "react";
import { WS_ENDPOINT } from "../../utils/api/api";
import { getAccessToken } from "../../utils/cookieService";
import type { SubmissionEvent } from "./types";

export type SocketStatus = "idle" | "connecting" | "open" | "closed";

const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 15_000;

type Options = {
    /**
     * Explicitly reconnect when the token changes (login/refresh) - the
     * handshake validates `?token=` once, so a socket opened before a token
     * rotation would start failing ownership checks.
     */
    enabled?: boolean;
};

/**
 * Live submission lifecycle feed over the raw `/ws` gateway.
 *
 * The socket authenticates with `?token=` (browsers cannot set headers on a
 * handshake), subscribes to `submission:<id>` on open and unsubscribes on
 * teardown. `JOB_COMPLETED` / `JOB_FAILED` end the stream, so the caller can
 * stop listening and fall back to `GET /submissions/{id}` for the full body.
 *
 * Returns the latest event plus connection status so the UI can show whether
 * live updates are available; the polling fallback stays authoritative.
 */
export default function useSubmissionSocket(
    submissionId: string | null | undefined,
    onEvent: (event: SubmissionEvent) => void,
    options: Options = {},
) {
    const enabled = options.enabled ?? true;
    const [status, setStatus] = useState<SocketStatus>("idle");
    const [latest, setLatest] = useState<SubmissionEvent | null>(null);

    // Callbacks live in refs so a re-render never tears down the socket.
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        if (!enabled || !submissionId) {
            setStatus("idle");
            return;
        }

        const token = getAccessToken();
        if (!token) {
            setStatus("idle");
            return;
        }

        let socket: WebSocket | null = null;
        let retryTimer: number | undefined;
        let attempt = 0;
        let disposed = false;

        const connect = () => {
            if (disposed) return;
            setStatus("connecting");

            const url = `${WS_ENDPOINT}?token=${encodeURIComponent(token)}`;
            socket = new WebSocket(url);

            socket.onopen = () => {
                if (disposed) return;
                attempt = 0;
                setStatus("open");
                socket?.send(JSON.stringify({ action: "subscribe", submissionId }));
            };

            socket.onmessage = (message: MessageEvent<string>) => {
                if (disposed) return;
                let event: SubmissionEvent;
                try {
                    event = JSON.parse(message.data) as SubmissionEvent;
                } catch {
                    return;
                }
                setLatest(event);
                onEventRef.current(event);
            };

            socket.onerror = () => {
                // `onclose` always follows, which owns the retry schedule.
            };

            socket.onclose = () => {
                if (disposed) return;
                setStatus("closed");
                attempt += 1;
                const delay = Math.min(RECONNECT_DELAY_MS * attempt, MAX_RECONNECT_DELAY_MS);
                retryTimer = window.setTimeout(connect, delay);
            };
        };

        connect();

        return () => {
            disposed = true;
            if (retryTimer !== undefined) window.clearTimeout(retryTimer);
            if (socket && socket.readyState === WebSocket.OPEN) {
                try {
                    socket.send(JSON.stringify({ action: "unsubscribe", submissionId }));
                } catch {
                    // Socket already gone.
                }
            }
            socket?.close();
            setStatus("closed");
        };
    }, [submissionId, enabled]);

    return { event: latest, status, live: status === "open" };
}