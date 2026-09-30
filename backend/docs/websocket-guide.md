# WebSocket Guide — Submission Events

Everything a frontend needs to integrate the real-time judge gateway: connection
handshake, the client → server protocol, every server → client event with its
exact payload DTO, replay/catch-up semantics and a copy-paste client cookbook.

The gateway is a raw WebSocket endpoint at **`/ws`** (`WebSocketConfig`,
`SubmissionWebSocketHandler`). It carries submission lifecycle events only —
all other traffic stays on the HTTP API.

---

## 1. Connecting

```js
// ws:// for local dev, wss:// in production
const ws = new WebSocket(`ws://localhost:8080/ws?token=${accessToken}`);
```

| Aspect | Detail |
|---|---|
| Path | `/ws` (no trailing sub-path; the submission id is **not** in the URL) |
| Auth | `?token=<accessToken>` — the **same access token** you pass as `Authorization: Bearer` on HTTP. Browsers cannot set headers on a WS handshake, hence the query param. The server validates the signature *and* checks the logout blacklist, so logging out over HTTP also kills the socket. |
| Rejected handshake | Missing / invalid / blacklisted token → the HTTP upgrade still completes (`101`), then the server **immediately sends a close frame: code `1008` (POLICY_VIOLATION), reason `unauthorized`** — so the client sees `onclose` with code 1008, not a failed connect. Do not retry with the same token. |
| Origin | Any origin is allowed (`setAllowedOriginPatterns("*")`); the token is the only auth. |
| Multiplexing | One socket can subscribe to **many** submissions at once (e.g. a background submission while browsing another problem). |
| Heartbeat | The server sends **no pings/heartbeats**. Reconnection, backoff and resubscribing are the client's job (re-subscribing is cheap and lossless — see §4). |

---

## 2. Client → server protocol

JSON text frames. Only two actions exist:

```json
{"action": "subscribe",   "submissionId": "6abba614b713b8d99563d7b5"}
{"action": "unsubscribe", "submissionId": "6abba614b713b8d99563d7b5"}
```

| Rule | Behaviour |
|---|---|
| `submissionId` | **Required for both actions.** Missing/blank → `ERROR` frame `"submissionId is required"`. |
| `subscribe` | Joins room `submission:<id>` **and immediately replays the current state** (§4). |
| `unsubscribe` | Leaves the room; no confirmation frame is sent. |
| Ownership | A socket may only subscribe to **its own** submissions (the token's user must own the id — holding the admin `submission:read` permission does *not* help here). Otherwise → `ERROR` frame `"Submission not found or not owned by you"`. |
| Unknown action | → `ERROR` frame `"Unknown action: <action>"`. |
| Bad JSON / not an object | → `ERROR` frame `"Malformed message"`. |

You only get events for rooms you explicitly subscribed to — nothing is
broadcast globally.

---

## 3. Event catalogue (server → client)

Every frame is a JSON object carrying an `"event"` discriminator.

| Event | Emitted when | Payload DTO |
|---|---|---|
| `JOB_QUEUED` | Right after `POST .../submit`, `.../example-eval` or `.../run` accepted the job (also returned in the HTTP response) | `submissionId`, `queuePosition`, `language`¹ |
| `JOB_PROCESSING` | A worker picked the job up (status → `PROCESSING`) | `submissionId` |
| `TESTCASE_PROGRESS` | Each stored test case finishes (example-eval & full submission only) | `submissionId`, `passed`, `completed`, `total`, `lastVerdict` |
| `JOB_COMPLETED` | Evaluation finished (status → `COMPLETED`), carries the full result | `submissionId`, `result` |
| `JOB_FAILED` | Unrecoverable failure (status → `FAILED`: sandbox/Docker error, problem vanished, …) | `submissionId`, `error` |
| `ERROR` | A client message was rejected (control plane — not tied to a submission) | `message` |

¹ `language` is present only on the **live** `JOB_QUEUED`; the replay variant omits it.

> Compile errors are **not** failures: a `COMPILE_ERROR` submission reaches
> `JOB_COMPLETED` with `result.overallVerdict = "COMPILE_ERROR"`. `JOB_FAILED`
> is reserved for infrastructure/system errors.

### 3.1 `JOB_QUEUED`

```json
{
  "event": "JOB_QUEUED",
  "submissionId": "6abcadb76f403f54279e0bac",
  "queuePosition": 1,
  "language": "python"
}
```

- `queuePosition` — 1-based position in that language's Redis queue at enqueue
  time (informational; jobs are judged FIFO per language).
- Replay variant (first frame after `subscribe` while still `QUEUED`) omits
  `language`: `{"event":"JOB_QUEUED","submissionId":"...","queuePosition":1}`.

### 3.2 `JOB_PROCESSING`

```json
{ "event": "JOB_PROCESSING", "submissionId": "6abcadb76f403f54279e0bac" }
```

### 3.3 `TESTCASE_PROGRESS`

```json
{
  "event": "TESTCASE_PROGRESS",
  "submissionId": "6abcadcf6f403f54279e0bae",
  "passed": 3,
  "completed": 5,
  "total": 12,
  "lastVerdict": "ACCEPTED"
}
```

| Field | Type | Meaning |
|---|---|---|
| `passed` | int | Test cases with verdict `ACCEPTED` so far |
| `completed` | int | Test cases run so far (increments 1 → `total`) |
| `total` | int | Test cases in this run (samples for example-eval, all for a full submission) |
| `lastVerdict` | `Verdict` | Verdict of the test case that just finished |

Never emitted for `CUSTOM_RUN` (a single run has no test cases to iterate).

### 3.4 `JOB_COMPLETED`

```json
{
  "event": "JOB_COMPLETED",
  "submissionId": "6abcadcf6f403f54279e0bae",
  "result": { ...SubmissionResultResponse, see §5... }
}
```

On **replay** the `result` may be `null` in a narrow race (status already
`COMPLETED` but the result document not yet visible) — treat `null` as "poll
`GET /submissions/{id}`".

### 3.5 `JOB_FAILED`

```json
{
  "event": "JOB_FAILED",
  "submissionId": "6abcadcf6f403f54279e0bae",
  "error": "Cannot reach the Docker daemon (unix:///var/run/docker.sock): ..."
}
```

- Live: the exception message, or `"System error"` when none is available.
- Replay: the generic `"Submission failed"`.
- **Details are not on the socket**: poll `GET /submissions/{id}` — a `FAILED`
  submission's `result.overallVerdict` is `SYSTEM_ERROR` and
  `result.compileErrorLogs` carries the reason.

### 3.6 `ERROR`

```json
{ "event": "ERROR", "message": "Submission not found or not owned by you" }
```

Known `message` values: `"submissionId is required"`,
`"Unknown action: <action>"`, `"Submission not found or not owned by you"`,
`"Malformed message"`.

---

## 4. Replay / catch-up (late joiners & reconnects)

Immediately after a successful `subscribe`, the server pushes **one** frame
describing the submission's *current* state, so you can never miss an event —
subscribe **after** the HTTP call returns and you still see `JOB_QUEUED`:

| Submission status | Replay frame |
|---|---|
| `QUEUED` | `JOB_QUEUED` (with a freshly computed `queuePosition`, no `language`) |
| `PROCESSING` | `JOB_PROCESSING` |
| `COMPLETED` | `JOB_COMPLETED` + `result` (possibly `null`, see §3.4) |
| `FAILED` | `JOB_FAILED`, `error: "Submission failed"` |
| unknown / not yours | `ERROR` frame instead of a replay |

Consequences for the client:

- **Reconnect is lossless**: on `onopen`, resubscribe to every active
  submission id and render the replay frame as current state.
- Subscribe happens *after* joining the room, so no event falls in a gap; in a
  narrow race a live frame can arrive just before its replay. Treat frames as
  idempotent state updates and **ignore a status that moves backwards**.
- No `unsubscribe` confirmation — leaving is fire-and-forget.

---

## 5. Shared DTO reference

### `SubmissionResultResponse` (`result` of `JOB_COMPLETED`)

| Field | Type | Notes |
|---|---|---|
| `submissionId` | string | Echo of the submission id |
| `overallVerdict` | `Verdict` | See §6 |
| `totalExecutionTimeMs` | number | Sum across test cases (single run for `CUSTOM_RUN`) |
| `peakMemoryKb` | number | Max RSS observed across runs |
| `passedTestCases` | number | Accepted count |
| `totalTestCases` | number | `0` for `COMPILE_ERROR` |
| `compileErrorLogs` | string \| null | Compiler output for `COMPILE_ERROR`; failure reason for `SYSTEM_ERROR`; else `null` |
| `testCaseResults` | `TestCaseResultResponse[]` | Empty on `COMPILE_ERROR` |

### `TestCaseResultResponse` (one row per test case)

| Field | Type | Notes |
|---|---|---|
| `testCaseId` | string | Stored test-case id; the literal `"custom-input"` for `CUSTOM_RUN` |
| `status` | `Verdict` | This row's verdict |
| `executionTimeMs` | number | |
| `memoryUsedKb` | number | |
| `stdout` | string \| null | IO visibility rules below |
| `stderr` | string \| null | |
| `expectedOutput` | string \| null | Always `null` for `CUSTOM_RUN` (nothing to compare) |
| `actualOutput` | string \| null | `null` when the run produced no comparable output (e.g. TLE) |

**IO visibility** (identical rule everywhere: this event, replay, and
`GET /submissions/{id}`) — driven by `SubmissionType.exposesIo()`:

| Submission type | `stdout` / `stderr` / `expectedOutput` / `actualOutput` |
|---|---|
| `EXAMPLE_EVAL` | populated (sample cases only) |
| `CUSTOM_RUN` | populated (`expectedOutput` always `null`) |
| `FULL_SUBMISSION` | **all `null`** — hidden test data never leaves the server |

Strings are truncated to `app.execution.io-truncate-chars` (default **4096**)
characters, followed by `"\n... [truncated]"`.

---

## 6. Enums (serialized as plain strings)

| Enum | Values |
|---|---|
| `Language` | `cpp`, `java`, `python`, `javascript` (lowercase by design) |
| `SubmissionStatus` | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `SubmissionType` | `EXAMPLE_EVAL`, `FULL_SUBMISSION`, `CUSTOM_RUN` |
| `Verdict` | `ACCEPTED`, `WRONG_ANSWER`, `COMPILE_ERROR`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `RUNTIME_ERROR`, `SYSTEM_ERROR` |

---

## 7. HTTP ↔ event mapping

| HTTP call | Events you will receive (after subscribing) |
|---|---|
| `POST /problems/{id}/submit` | `JOB_QUEUED` → `JOB_PROCESSING` → `TESTCASE_PROGRESS` ×N → `JOB_COMPLETED` or `JOB_FAILED` |
| `POST /problems/{id}/example-eval` | same as above (N = sample cases, IO visible) |
| `POST /problems/{id}/run` | `JOB_QUEUED` → `JOB_PROCESSING` → `JOB_COMPLETED` or `JOB_FAILED` (no progress events) |
| `GET /submissions/{id}` | polling fallback — same data as the events, use it when the socket is down |

The HTTP response of every submit/run already contains `submissionId`, the
initial `status` and `queuePosition` — subscribe with that id, the replay
covers anything emitted in between.

---

## 8. Client cookbook

```js
function watchSubmission(accessToken, submissionId, onUpdate) {
  const ws = new WebSocket(`ws://localhost:8080/ws?token=${accessToken}`);

  ws.onopen = () => {
    // Lossless on reconnect: the replay frame re-delivers current state.
    ws.send(JSON.stringify({ action: "subscribe", submissionId }));
  };

  ws.onmessage = (raw) => {
    const frame = JSON.parse(raw.data);
    switch (frame.event) {
      case "JOB_QUEUED":
        // frame.queuePosition, frame.language (absent on replay)
        break;
      case "JOB_PROCESSING":
        break;
      case "TESTCASE_PROGRESS":
        // frame.passed / frame.completed / frame.total / frame.lastVerdict
        break;
      case "JOB_COMPLETED":
        // frame.result: SubmissionResultResponse — terminal state
        ws.close();
        break;
      case "JOB_FAILED":
        // frame.error — fetch details via GET /submissions/{id}
        ws.close();
        break;
      case "ERROR":
        console.warn("ws error:", frame.message);
        break;
    }
    onUpdate?.(frame);
  };

  ws.onclose = (event) => {
    if (event.code === 1008) return; // bad/expired token — refresh first
    // Reconnect with backoff, then resubscribe (handled in onopen).
  };

  return ws;
}
```

Minimal happy path:

```js
const res = await fetch(`/problems/${problemId}/submit`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ code, language }),
});
const { data } = await res.json();          // { submissionId, status, queuePosition, ... }
watchSubmission(token, data.submissionId, renderUpdate);
```

---

## 9. Gotchas

- **Don't derive anything from `queuePosition`** — it is informational; the
  only truth is the status stream.
- **`TESTCASE_PROGRESS` totals differ per type**: example-eval counts samples
  only, full submissions count every hidden + sample case.
- **Socket close 1008 / `unauthorized`** means the token was rejected —
  refresh the access token over HTTP, then reconnect. A close with any other
  code is transient: reconnect with exponential backoff and resubscribe.
- **`JOB_FAILED.error` is not the compile error** — for compile diagnostics
  read `result.compileErrorLogs` on `JOB_COMPLETED`.
- **Backwards status frames can arrive** in the replay race (§4) — keep the
  highest status you've seen per submission and ignore older ones.
- Room names (`submission:<id>`) are internal; clients never address them —
  the `submissionId` in the subscribe message does it all.
