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

### Two streams, one envelope

Every server → client frame is flat: `{"event": "<NAME>", ...fields}`. The room
carries two independent streams:

| Stream | Events | Terminal event |
|---|---|---|
| Job lifecycle | `JOB_QUEUED`, `JOB_PROCESSING`, `TESTCASE_PROGRESS`, `JOB_COMPLETED`, `JOB_FAILED` | `JOB_COMPLETED` / `JOB_FAILED` |
| Run stream | `RUN_STARTED` → one `CASE_RESULT` per testcase → `RUN_FINISHED` | `RUN_FINISHED` — always exactly one |

**`runId` is your isolation key.** One run is one submission, so
`runId == submissionId`, and it is present on *every* run-stream frame. A client
**must** ignore any `RUN_STARTED` / `CASE_RESULT` / `RUN_FINISHED` whose
`runId` is not the run it is currently rendering, otherwise a late frame from a
previous run can repaint a newer one. `TESTCASE_PROGRESS` is the legacy
counter-only view, kept for clients written before per-case streaming; ignore it
if you consume `CASE_RESULT`.

---

## 3. Event catalogue (server → client)

Every frame is a JSON object carrying an `"event"` discriminator.

| Event | Emitted when | Payload DTO |
|---|---|---|
| `JOB_QUEUED` | Right after `POST .../submit`, `.../example-eval` or `.../run` accepted the job (also returned in the HTTP response) | `submissionId`, `queuePosition`, `language`¹ |
| `JOB_PROCESSING` | A worker picked the job up (status → `PROCESSING`) | `submissionId` |
| `TESTCASE_PROGRESS` | Legacy counter view, one per finished case | `submissionId`, `passed`, `completed`, `total`, `lastVerdict` |
| `RUN_STARTED` | The judge compiled successfully and is about to run the plan | `submissionId`, `runId`, `totalCases` |
| `CASE_RESULT` | **One per testcase, as soon as that case finishes** | `submissionId`, `runId`, `caseIndex`, `caseId`, `kind`, `status`, `input`, `expectedOutput`, `actualOutput`, `stdout`, `stderr`, `runtimeMs`, `memoryKb` |
| `RUN_FINISHED` | Terminal event of the run stream (always sent exactly once) | `submissionId`, `runId`, `overallStatus`, `passedCount`, `totalCount`, `failedCaseIndex`, `totalRuntimeMs`, `peakMemoryKb`, `compileError` |
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

### 3.3 `RUN_STARTED`

```json
{ "event": "RUN_STARTED", "submissionId": "6abcadcf6f403f54279e0bae",
  "runId": "6abcadcf6f403f54279e0bae", "totalCases": 5 }
```

| Field | Type | Meaning |
|---|---|---|
| `runId` | string | Isolation key for this run (equals `submissionId`) |
| `totalCases` | int | Cases the judge is about to run: samples (+ custom cases on a run) or every case on a submit |

Reset any per-case state you are holding when this arrives.

### 3.4 `CASE_RESULT`

Published **as each testcase finishes**, so a UI can light up that tab without
waiting for the whole run.

```json
{
  "event": "CASE_RESULT",
  "submissionId": "6abcadcf6f403f54279e0bae",
  "runId": "6abcadcf6f403f54279e0bae",
  "caseIndex": 2,
  "caseId": "6ac257f0a4cbc9d5f1fcfd4d",
  "kind": "SAMPLE",
  "status": "WRONG_ANSWER",
  "input": "3 9\n2 7 11\n4 4\n1 2 3 4\n",
  "expectedOutput": "0 1\n0 2\n",
  "actualOutput": "0 1\n1 2\n",
  "stdout": "0 1\n1 2\n",
  "stderr": "",
  "runtimeMs": 31,
  "memoryKb": 12288
}
```

| Field | Type | Meaning |
|---|---|---|
| `caseIndex` | int | 1-based position in this run; stable and identical to `result.testCaseResults[i].caseIndex` |
| `caseId` | string | Stored testcase id, or `custom-<n>` for a caller's own case |
| `kind` | `SAMPLE` \| `CUSTOM` \| `HIDDEN` | Visibility class — see the table in §5 |
| `status` | `Verdict` | This case's verdict |
| `input` | string \| null | Exact stdin fed to the program. **null for `HIDDEN`** |
| `expectedOutput` | string \| null | **null for `CUSTOM`** (nothing to compare) and for `HIDDEN` |
| `actualOutput` | string \| null | Program stdout. **Empty string means it printed nothing** (that is not the same as `null`, which means "not exposed") |
| `stdout` / `stderr` | string \| null | Raw streams; **null for `HIDDEN`** |
| `runtimeMs` / `memoryKb` | number | Always present, for every kind |

On a submit the judge **stops at the first failing case**, so the last
`CASE_RESULT` is the failing one and `totalCount` still reports the full plan.

### 3.5 `RUN_FINISHED`

```json
{ "event": "RUN_FINISHED", "submissionId": "6abcadcf6f403f54279e0bae",
  "runId": "6abcadcf6f403f54279e0bae", "overallStatus": "WRONG_ANSWER",
  "passedCount": 3, "totalCount": 5, "failedCaseIndex": 4,
  "totalRuntimeMs": 128, "peakMemoryKb": 12288, "compileError": null }
```

| Field | Type | Meaning |
|---|---|---|
| `overallStatus` | `Verdict` | Final verdict of the run |
| `passedCount` | int | Cases judged `ACCEPTED` |
| `totalCount` | int | Cases **actually judged**; `0` for `COMPILE_ERROR` (nothing ran) |
| `failedCaseIndex` | int \| null | 1-based index of the first failing case, `null` when accepted |
| `compileError` | string \| null | Compiler output; set only when the run short-circuited on a compile error, or when it ended in `SYSTEM_ERROR` |

Guarantees:

- **Always sent exactly once per run**, including on compile errors, on the
  overall run budget being exhausted (`SYSTEM_ERROR`) and after an
  infrastructure error — so a client never waits forever.
- On a compile error there are **no** `CASE_RESULT` frames at all:
  `RUN_STARTED` → `RUN_FINISHED` with `compileError` set.
- `JOB_COMPLETED` / `JOB_FAILED` still arrive afterwards and carry the
  authoritative persisted result.

### 3.6 `TESTCASE_PROGRESS` (legacy)

```json
{ "event": "TESTCASE_PROGRESS", "submissionId": "6abcadcf6f403f54279e0bae",
  "passed": 3, "completed": 4, "total": 5, "lastVerdict": "ACCEPTED" }
```

Counter-only view kept for older clients; `CASE_RESULT` supersedes it.

### 3.7 `JOB_COMPLETED`

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

### 3.8 `JOB_FAILED`

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

### 3.9 `ERROR`

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
| `COMPLETED` | `JOB_COMPLETED` + `result` (possibly `null`, see §3.7) |
| `FAILED` | `JOB_FAILED`, `error: "Submission failed"` |
| unknown / not yours | `ERROR` frame instead of a replay |

The replay frame is always a **job-lifecycle** frame, never a run-stream frame:
a mid-run reconnect therefore re-syncs the whole run from
`GET /submissions/{id}` (the polling fallback) rather than from the socket. That
is why the persisted result is the authoritative record — it carries every
judged case, its `caseIndex`/`kind` and the failing case, whether or not the
client was connected when it happened.

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
| `totalExecutionTimeMs` | number | Sum across the judged cases |
| `peakMemoryKb` | number | Max RSS observed across runs |
| `passedTestCases` | number | Accepted count |
| `totalTestCases` | number | `0` for `COMPILE_ERROR`; on a submit that stopped early it is the **full plan size**, not the number of rows |
| `compileErrorLogs` | string \| null | Compiler output for `COMPILE_ERROR`; failure reason for `SYSTEM_ERROR`; else `null` |
| `failedCaseIndex` | int \| null | 1-based index of the first failing case; `null` when accepted. Optional — absent on results stored before it existed |
| `testCaseResults` | `TestCaseResultResponse[]` | Empty on `COMPILE_ERROR`; shorter than the plan when a submit stopped at its first failure |

### `TestCaseResultResponse` (one row per test case)

| Field | Type | Notes |
|---|---|---|
| `testCaseId` | string | Stored test-case id, or `custom-<n>` |
| `caseIndex` | int \| null | 1-based position in the run; `null` on rows stored before it existed |
| `kind` | `JudgeCaseKind` \| null | `SAMPLE` / `CUSTOM` / `HIDDEN`; `null` on old rows |
| `status` | `Verdict` | This row's verdict |
| `executionTimeMs` | number | |
| `memoryUsedKb` | number | |
| `stdout` | string \| null | IO visibility rules below |
| `stderr` | string \| null | |
| `expectedOutput` | string \| null | `null` for `CUSTOM` (nothing to compare) and for `HIDDEN` |
| `actualOutput` | string \| null | `""` means the program printed nothing; `null` means not exposed |

**IO visibility is decided per CASE** (identical rule in `CASE_RESULT`, the
`JOB_COMPLETED` result, replay, and `GET /submissions/{id}`), driven by `kind`:

| `kind` | `stdout` / `stderr` / `expectedOutput` / `actualOutput` |
|---|---|
| `SAMPLE` | populated — samples are public (already served by `GET /problems/{slug}`), so a submit that fails one can be explained |
| `CUSTOM` | populated, `expectedOutput` always `null` |
| `HIDDEN` | **all `null`** — a hidden case's input and expected output never leave the server |

So a `FULL_SUBMISSION` is *not* blank: its sample rows are populated and only
its hidden rows are empty. `status`, `executionTimeMs` and `memoryUsedKb` are
present for every kind, including hidden ones.

Strings are truncated to `app.execution.io-truncate-chars` (default **4096**)
characters, followed by `"\n... [truncated]"`.

---

## 6. Enums (serialized as plain strings)

| Enum | Values |
|---|---|
| `Language` | `cpp`, `java`, `python`, `javascript` (lowercase by design) |
| `SubmissionStatus` | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `SubmissionType` | `EXAMPLE_EVAL`, `FULL_SUBMISSION`, `CUSTOM_RUN` |
| `JudgeCaseKind` | `SAMPLE`, `CUSTOM`, `HIDDEN` |
| `Verdict` | `ACCEPTED`, `WRONG_ANSWER`, `COMPILE_ERROR`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `RUNTIME_ERROR`, `SYSTEM_ERROR` |

---

## 7. HTTP ↔ event mapping

| HTTP call | Body | Cases judged | Events (after subscribing) |
|---|---|---|---|
| `POST /problems/{id}/submit` | `{code, language}` | every stored case; **stops at the first failure** | `JOB_QUEUED` → `JOB_PROCESSING` → `RUN_STARTED` → (`CASE_RESULT` + `TESTCASE_PROGRESS`) ×N → `RUN_FINISHED` → `JOB_COMPLETED`\|`JOB_FAILED` |
| `POST /problems/{id}/example-eval` | `{code, language}` | the sample cases only, all of them | same as above (N = samples) |
| `POST /problems/{id}/run` | `{code, language, customTestcases?}` | the sample cases, then the caller's custom cases | same as above (N = samples + customs) |
| `GET /submissions/{id}` | — | — | polling fallback — same data as the events, use it when the socket is down |

**The sample test cases never come from the client.** `run` and `example-eval`
take no testcase input: the worker loads the samples from storage, so a client
can neither override, inject nor reorder them. The only client-influenced cases
are `customTestcases` on a run — raw stdin strings in tab order, with no
expected output, so they can never be `WRONG_ANSWER`. A legacy `input` field is
accepted and **ignored** with a server-side warning, so an older client keeps
working.

The HTTP response of every submit/run already contains `submissionId`, the
initial `status` and `queuePosition` — subscribe with that id, the replay
covers anything emitted in between.

---

## 8. Client cookbook

```js
function watchSubmission(accessToken, submissionId, onUpdate) {
  const ws = new WebSocket(`ws://localhost:8080/ws?token=${accessToken}`);
  let runId = submissionId; // one run == one submission

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
      case "RUN_STARTED":
        if (frame.runId !== runId) break;
        onUpdate({ totalCases: frame.totalCases, cases: [], summary: null });
        break;
      case "CASE_RESULT":
        // Drop stale frames so an old run can never repaint the current one.
        if (frame.runId !== runId) break;
        onUpdate({ upsertCase: frame }); // { caseIndex, kind, status, ... }
        break;
      case "RUN_FINISHED":
        if (frame.runId !== runId) break;
        onUpdate({ summary: frame }); // terminal for the run stream
        break;
      case "TESTCASE_PROGRESS":
        break; // legacy counter view
      case "JOB_COMPLETED":
        // frame.result: SubmissionResultResponse — authoritative final state
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
const res = await fetch(`/problems/${problemId}/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  // No testcase input: the judge loads the samples itself. Custom cases only.
  body: JSON.stringify({ code, language, customTestcases: ["1 5\n4 6\n"] }),
});
const { data } = await res.json();          // { submissionId, status, queuePosition, ... }
watchSubmission(token, data.submissionId, renderUpdate);
```

---

## 9. Gotchas

- **Don't derive anything from `queuePosition`** — it is informational; the
  only truth is the status stream.
- **Always check `runId`** on run-stream frames. `runId == submissionId` here,
  but the field exists so a client can tell "my current run" from "a frame
  that arrived late from the previous one".
- **`totalCount` is what was judged, `RUN_STARTED.totalCases` is what was
  planned.** They differ when a submit stopped at its first failure, and
  `totalCount` is `0` for a compile error.
- **A submit stops at its first failing case**, so
  `result.testCaseResults.length < result.totalTestCases` is normal and
  `failedCaseIndex` points at the row that ended it.
- **`CASE_RESULT.input` for a `HIDDEN` case is always `null`, never a partial
  value** — do not try to reconstruct it.
- **An empty `actualOutput` (`""`) means the program printed nothing**; `null`
  means the data is not exposed. Render them differently, or a Wrong Answer
  will look like an empty output box.
- **Socket close 1008 / `unauthorized`** means the token was rejected —
  refresh the access token over HTTP, then reconnect. A close with any other
  code is transient: reconnect with exponential backoff and resubscribe.
- **`JOB_FAILED.error` is not the compile error** — for compile diagnostics
  read `result.compileErrorLogs` on `JOB_COMPLETED`.
- **Backwards status frames can arrive** in the replay race (§4) — keep the
  highest status you've seen per submission and ignore older ones.
- **`RUN_FINISHED` is the only run-stream terminal event.** Treat a run as
  over when it arrives (or when `JOB_COMPLETED`/`JOB_FAILED` does); the server
  also emits it on a compile error and on infrastructure failure, so the stream
  is never left open.
- Room names (`submission:<id>`) are internal; clients never address them —
  the `submissionId` in the subscribe message does it all.
