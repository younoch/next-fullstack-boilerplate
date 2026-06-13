# ADR-001: Three-Service Separation (app / worker / websocket)

**Date:** 2026-06-13
**Status:** Accepted

## Context

This repository runs a Next.js application that also needs background job processing and realtime message delivery. Historically, Socket.io was initialized inside a Next.js API route and workers connected directly to that in-process socket. That pattern mixes long-running, persistent processes (workers and websocket servers) with request/response serverless routing semantics and causes operational, reliability, and scaling issues.

## Decision

We will maintain three separate Docker services, each with a single responsibility:

- `app` — Next.js App Router only (HTTP request/response handlers and UI)
- `worker` — Long-running RabbitMQ consumers and background job processors
- `websocket` — Dedicated Socket.io server for persistent realtime connections

All code changes adopt this separation: Socket.io is moved out of `src/pages/api/` into `src/websocket/server.ts`. Workers connect to the `websocket` service via environment configuration. The Next.js app exposes a shim API route that returns 204 to indicate the websocket is handled elsewhere.

## Alternatives Considered

- Keep Socket.io inside Next.js API route (status quo): rejected because Next.js serverless/runtime is not designed for persistent socket servers; restarting or scaling the app can disconnect clients and mix resource lifecycles.
- Use a third-party managed realtime service (Pusher/Ably): rejected for now due to cost and desire for local dev parity and full control.

## Consequences

- Pros:
  - Clear separation of concerns simplifies scaling (scale each service independently).
  - Workers run in a long-lived process without being tied to HTTP request lifecycle.
  - Socket.io server can be tuned and monitored independently (memory, connections, timeouts).

- Cons:
  - Slightly more complex local development (additional Docker service), but `docker-compose` already orchestrates multi-service local dev.
  - Requires careful environment configuration for cross-service URLs (documented via `WEBSOCKET_URL` and `NEXT_PUBLIC_WEBSOCKET_URL`).

## Migration Notes

- Socket server moved to `src/websocket/server.ts`.
- `src/pages/api/socket.ts` replaced with a 204 shim and informational log.
- Worker connects to `process.env.WEBSOCKET_URL` (default `http://websocket:3000`).
- Web client connects to `process.env.NEXT_PUBLIC_WEBSOCKET_URL` (default `http://localhost:3001` in docker-compose for host dev).

## Related ADRs

- None yet.
