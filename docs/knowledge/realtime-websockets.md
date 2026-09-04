# Real-Time and WebSockets

> Your best system-design story: two distinct bugs, one topology, and why the obvious fix is only half a fix.
> Related: [`scaling-and-replicas.md`](./scaling-and-replicas.md) · [`nginx.md`](./nginx.md) · [`async-and-messaging.md`](./async-and-messaging.md)

---

## 1. The options, and why WebSockets

🔵 Four ways to get server data to a browser:

| Technique | Direction | Cost | Use when |
|---|---|---|---|
| **Polling** | Client asks repeatedly | Wasteful — most responses empty | Simple, infrequent updates |
| **Long-polling** | Server holds the request open until it has data | Better, still one request per message | Fallback where WS is blocked |
| **SSE** (Server-Sent Events) | Server → client only, over plain HTTP | Cheap, auto-reconnects, HTTP/2 friendly | **Notifications, feeds** |
| **WebSocket** | Bidirectional, one persistent TCP connection | Persistent connection per client | Chat, collaboration, games |

🟢 You use WebSockets via Socket.IO for user notifications.

⚠️ **Be ready for "why not SSE?"** — it's a fair challenge, because your traffic is *server → client only*, which is exactly SSE's shape. The honest answer:

> "Notifications are one-directional, so SSE would have fit and would have been simpler — it's just HTTP, it reconnects natively, and it doesn't need the upgrade handling in nginx. I chose Socket.IO for the room abstraction and because I wanted bidirectional capacity available later. If I were choosing again for this exact feature, SSE is defensible and lighter."

**Conceding a reasonable alternative doesn't weaken you** — it shows you evaluated rather than defaulted.

🔵 **Socket.IO is not WebSocket.** It's a protocol *on top of* WebSocket with fallbacks, auto-reconnect, rooms, namespaces and acknowledgements. A raw WebSocket client cannot talk to a Socket.IO server. That misunderstanding is common enough to be worth stating.

---

## 2. What you built, and got right

🟢 `apps/api/src/v1/modules/user-notifications/user-notifications.gateway.ts`:

- **WebSocket gateway** on a dedicated **namespace** — logical channel multiplexed over one connection.
- **Handshake authentication** — `server.use(...)` is Socket.IO **middleware** verifying the JWT *before* the connection is established.
- **Rooms** — `client.join(userNotificationRoom(user.id))` puts each socket in a per-user **topic**. Emitting to a room is **fan-out to subscribers**, which *is* publish–subscribe.
- **Server push** — the server initiates; the client doesn't poll.

### Why authenticate at the handshake 🔵

Be ready to explain this, because it's a real design decision:

- **One auth check** instead of one per message.
- Unauthenticated sockets never consume a connection slot — they're rejected before the connection exists.
- The alternative — per-message auth — is needed only when authorisation can change mid-connection.

⚠️ **The trade-off you should volunteer:** a JWT verified once at handshake means a **long-lived connection outlives token expiry**. A revoked or expired token stays connected until the socket drops. The mitigations are periodic re-auth over the socket or a max connection lifetime. Neither is implemented — know that.

> **Say this:** "Notifications are pushed over an authenticated WebSocket namespace. Auth happens in handshake middleware so an unauthenticated socket never gets established. Each socket joins a per-user room, so publishing is a fan-out to that topic rather than a broadcast the client filters. The gap is that a connection authenticated once outlives token expiry."

---

## 3. Where it broke: two bugs, one cause

🟢 The gateway design was sound. **The bug was in how it met the replica topology** — with `replicas: 2`, a socket lives in *one* replica's memory ([`scaling-and-replicas.md`](./scaling-and-replicas.md#6-where-statelessness-breaks-websockets)).

### Failure mode 1 — the silent one: dropped notifications

```
1. Worker finishes processing media
2. Worker enqueues a job on USER_NOTIFICATIONS_QUEUE (Redis)
3. BOTH api replicas consume that queue          ← competing consumers
4. Redis hands the job to whichever asks first — say replica 2
5. Replica 2 writes the notification row to Postgres              ✅
6. Replica 2 calls gateway.notifyUser(...)
       → server.to("user:42").emit(...)
       → replica 2 looks in ITS OWN room map
       → empty; the user's socket lives on replica 1
       → the emit goes nowhere. No error. No log. Nothing.       ❌
```

**Why it was so hard to notice.** The row *did* land in Postgres. The user refreshes, the notification appears over HTTP, and it reads as "real-time is a bit flaky" rather than a structural bug.

**Expected loss: ~50% of live notifications** — the browser lands on a random replica and the job lands on a random replica, so they match about half the time.

### Failure mode 2 — the noisy one: the handshake

🟢 `apps/web/src/lib/hooks/useWebsocket.ts` originally created the connection without specifying transports.

🔵 **Socket.IO's default is `["polling", "websocket"]`.** It does *not* open a WebSocket first. It starts with **HTTP long-polling** and only then upgrades — deliberate compatibility design, because polling works through proxies that block upgrades.

But polling means the handshake spans **multiple separate HTTP requests**, each load-balanced independently:

```
GET  /socket.io/?EIO=4&transport=polling          → replica 1 → creates session "abc"
POST /socket.io/?EIO=4&transport=polling&sid=abc  → replica 2 → "abc"? never heard of it
                                                  → 400 {"code":1,"message":"Session ID unknown"}
```

Symptoms: intermittent connection failures, reconnect storms, `Session ID unknown` in the network tab.

The requirement being violated is **session affinity** (**sticky sessions**). Your nginx has none — see [`nginx.md`](./nginx.md#job-2--load-balancing-and-service-discovery).

---

## 4. Why one fix wasn't enough

| Fix | Fixes #1 (dropped emits) | Fixes #2 (handshake) |
|---|:--:|:--:|
| `transports: ["websocket"]` on the client | ❌ | ✅ |
| Sticky sessions (`ip_hash`) in nginx | ❌ | ✅ |
| **`@socket.io/redis-adapter`** | ✅ | ❌ |

**They solve different problems.** The adapter is non-negotiable — no amount of affinity helps when the *emit originates on a replica the user was never connected to*. Forcing the WebSocket transport is the cheaper partner: one upgrade request, no multi-request session to lose, and no polling overhead.

🔵 **The concept: a pub/sub backplane.** With the Redis adapter, `emit` no longer means "look in my local map" — it means "publish to a Redis pub/sub channel", and *every* replica receives it and relays to its own local sockets in that room. Redis becomes the shared nervous system, exactly as it already was for cache and queues.

This is the general solution for **any** in-memory state in a horizontally-scaled system: move it to shared infrastructure.

---

## 5. ✅ What shipped

🟢 **1. The backplane** — `apps/api/src/common/adapters/redis-io.adapter.ts`

A custom `IoAdapter` subclass swapping Socket.IO's in-memory adapter for `@socket.io/redis-adapter`.

**Two Redis clients are required, and the reason is worth knowing:** a Redis connection in **subscriber mode cannot issue ordinary commands**. Publishing needs its own connection — hence `pubClient.duplicate()`.

Wired in `apps/api/src/main.ts` *before* `app.listen()`, and guarded: if `REDIS_URL` is unset the app falls back to the in-memory adapter and logs a warning, so single-process local dev still works.

🟢 **Two bugs found in the fix itself**, both worth telling as stories:

**(a) The SIGTERM handler broke shutdown.** Installing a `SIGTERM` listener **removes Node's default termination behaviour**. The process ran cleanup then hung until Docker `SIGKILL`ed it 10 seconds later. Fixed with an explicit `process.exit(0)` in a `.finally()`.

⚠️ *The first test was misleading* — Git Bash on Windows reported "exited cleanly" because Windows `kill` isn't a real POSIX signal. It only reproduced in `docker run node:22-bookworm-slim`. **The lesson — verify signal handling in the runtime you actually deploy to — is a genuinely good thing to say out loud.**

**(b) Redis errors were fatal.** A node-redis client is an `EventEmitter`, and **an `'error'` event with no listener is re-thrown as an uncaught exception.** Zero listeners by default meant one dropped Redis connection would crash the API. Fixed by attaching `.on('error')` to both clients — mandatory, not defensive.

🟢 The shutdown handler deliberately does **not** call `app.enableShutdownHooks()`: that switches on Nest's lifecycle hooks globally and changes how every BullMQ processor shuts down — a blast radius far wider than this fix.

🟢 **2. The handshake** — `apps/web/src/lib/hooks/useWebsocket.ts`

Added `transports: ["websocket"]`. A WebSocket upgrade is a single request, so the connection is pinned to one replica from the start.

⚠️ **The cost, which you must volunteer:** this removes the polling fallback entirely. Users behind proxies that block WebSocket upgrades now get *nothing* rather than degraded-but-working polling. For a consumer product that's a real trade; the alternative was sticky sessions, which would have meant giving up dynamic upstream resolution.

### Verified, not assumed 🟢

Proven by simulating the production topology — two Socket.IO servers, a client on server A, the emit from server B:

```
=== Redis adapter DISABLED (previous prod behaviour) ===
   [replica :4101] socket connected, joined user:42
   [replica :4102] emitting to user:42 (this replica holds no sockets)
   Client received notification: NO
   RESULT: FAIL — notification silently dropped

=== Redis adapter ENABLED (the fix) ===
   Client received notification: YES
   RESULT: PASS — cross-replica emit delivered
```

**The failing run matters as much as the passing one** — it proves the bug was real and reproducible rather than theoretical. Reproduce-then-fix is the habit interviewers are listening for.

---

## 6. The story, told well

> **Say this:** "I run the API at two replicas, and WebSockets are the one thing that isn't stateless — the socket lives in one replica's memory. That gave me two bugs. With Socket.IO's default transports the handshake starts on HTTP long-polling, which spans several requests, and without sticky sessions each one hits a different replica, so it fails with 'session ID unknown'. The worse one was silent: the notification job is consumed by whichever replica grabs it, and an emit from that replica never reaches a socket held by the other — the row still landed in Postgres, so it looked like flaky real-time rather than a structural bug, and it was dropping about half.
>
> The fix is a Redis pub/sub backplane so any node can reach any socket, plus forcing the WebSocket transport so the handshake is one request. They fix different halves — the adapter is the non-negotiable one, because affinity doesn't help when the emit starts on the wrong node.
>
> I reproduced it first with two local Socket.IO servers so I could prove the failure before and the delivery after. The fix itself then had two bugs of its own — my SIGTERM handler removed Node's default termination so the container hung until Docker killed it, and I hadn't attached error listeners to the Redis clients, which in node-redis means an uncaught exception on any reconnect. I only caught the SIGTERM one because I stopped trusting the Windows test and re-ran it in a Linux container."

**That answer demonstrates:** distributed-systems reasoning, the ability to distinguish two failure modes with one root cause, knowing a partial fix from a complete one, empirical verification, and honesty about bugs in your own fix. That last one is rarer than the rest.

---

## Interview drills

**"How do you do real-time?"**
Socket.IO namespace, handshake-authenticated, per-user rooms, Redis adapter for cross-replica delivery. Then volunteer the SSE alternative (§1) before they ask.

**"What happens when you scale a WebSocket server?"**
The single best question you can get. §3 and §4.

**"How do you authenticate a WebSocket?"**
Handshake middleware, not per message. Say why, then volunteer the expiry gap (§2).

**"Why two Redis clients?"**
Subscriber mode can't issue ordinary commands. A small detail that proves you read the library rather than copied the snippet.

**"Tell me about a bug you caused."**
The SIGTERM handler. It has everything: a subtle platform behaviour, a misleading first test, and the discipline to re-verify in the real runtime.
