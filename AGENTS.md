# AGENTS.md — Execution Rules for AI Coding Agents

> This file governs Claude Code, Cursor, Codex, and any other autonomous agent
> working in this repository. Rules are non-negotiable unless the developer
> explicitly overrides in the current session with "I know this breaks the rule."

---

## Stack Reference

| Layer | Technology |
|---|---|
| Frontend + API | Next.js (App Router) |
| Background Jobs | NestJS Workers (separate Docker service) |
| Realtime | Socket.io (separate Docker service) |
| Database | PostgreSQL via Prisma |
| Queue | RabbitMQ |
| Cache / Idempotency | Redis |
| ORM | Prisma (single `schema.prisma`) |
| Logging | pino via `src/lib/logger.ts` |
| Validation | Zod |
| Auth | NextAuth.js |

---

## Absolute Rules — Never Violate

### 1. Three Docker Services — Never Merge

```
app       → Next.js only (request/response)
worker    → RabbitMQ consumers only (long-running)
websocket → Socket.io only (persistent connections)
```

Never place a RabbitMQ consumer or Socket.io server inside `src/app/api/`.
Never import `src/workers/` from `src/app/`.

### 2. No Direct RabbitMQ Publish from Services

```typescript
// FORBIDDEN
await rabbitmq.publish('tax.calculated', result);

// REQUIRED — Outbox pattern
await prisma.$transaction([
  prisma.taxCalculation.create({ data: result }),
  prisma.outboxEvent.create({
    data: { type: 'tax.calculated', payload: result, status: 'PENDING' }
  }),
]);
```

### 3. Every Worker Handler Requires Idempotency Check

```typescript
// REQUIRED at the top of every handler
const key = `<domain>:<jobType>:${job.id}`;
if (await redis.get(key)) return; // duplicate — skip silently
// ... process ...
await redis.set(key, '1', 'EX', 86400);
```

### 4. No Prisma Calls Outside Repository Files

Prisma access is only allowed in `src/features/<domain>/server/<domain>Repository.ts`.
Services call repositories. API routes call services. Never shortcut this chain.

### 5. No console.log — Ever

```typescript
// FORBIDDEN
console.log('done', result);

// REQUIRED
import { logger } from '@/lib/logger';
logger.info({ taskId, result }, 'Tax calculation completed');
logger.error({ err, taskId }, 'Worker failed');
```

### 6. No Hardcoded Values

No secrets, URLs, timeouts, or magic numbers in source code.
All config via `process.env`. Add missing vars to `.env.example`.

---

## Directory Rules

When creating new files, follow this placement:

| What | Where |
|---|---|
| New API endpoint | `src/app/api/<domain>/route.ts` |
| New page | `src/app/<page-name>/page.tsx` |
| Business logic | `src/features/<domain>/server/<domain>Service.ts` |
| DB queries | `src/features/<domain>/server/<domain>Repository.ts` |
| Zod schemas | `src/features/<domain>/schemas/<domain>Schema.ts` |
| Client fetch calls | `src/features/<domain>/client/<domain>ApiClient.ts` |
| Shared types | `src/features/<domain>/types.ts` |
| New worker handler | `src/workers/handlers/<domain>JobHandler.ts` |
| Infrastructure client | `src/lib/<name>.ts` |
| ADR | `docs/adr/00X-<short-title>.md` |

Never create:
- A second `services/` folder at root level
- `test-*.ts` files outside `__tests__/` directories
- Files named `utils.ts` or `helpers.ts` (name by what they actually do)

---

## Prisma Rules

- Single `schema.prisma` file — no merging scripts, no multiple schema files
- Domain sections separated by comments: `// === CORE DOMAIN ===` / `// === TAX DOMAIN ===`
- Every new model gets `@@map("snake_case_table_name")`
- Every foreign key field gets an explicit `@relation`
- Run `prisma migrate dev --name <descriptive-name>` — never `prisma db push` in development

---

## Before Generating Any Code — Run This Checklist

```
[ ] Does this belong in app / worker / websocket? Confirm correct service.
[ ] Does this write to DB and emit an event? → Must use Outbox pattern.
[ ] Is this a worker handler? → Must have idempotency check at top.
[ ] Does this query the DB? → Must go through repository, not service directly.
[ ] Does this log anything? → Must use logger, not console.log.
[ ] Are there any hardcoded values? → Move to process.env.
[ ] Will concurrent requests cause a race condition? → Add DB-level lock or Redis lock.
[ ] Does this need a Zod schema for input validation? → Add it.
```

---

## When Asked to Violate a Rule

If the developer's request would break any rule above:

1. State which rule is violated
2. Describe the production failure scenario in one sentence
3. Ask: "Proceed anyway, or use the correct pattern?"

Do not silently comply. Do not lecture beyond one sentence.

Example:
```
⚠️ Rule 2 violated: direct RabbitMQ publish without outbox.
Production risk: if publish fails after DB write, the event is permanently lost.
Proceed anyway, or should I implement the outbox pattern?
```

---

## ADR — Write One for Every Non-Obvious Decision

```markdown
# ADR-00X: Title

**Date:** YYYY-MM-DD
**Status:** Accepted

## Context
[One paragraph: what problem forced this decision]

## Decision
[What was chosen]

## Alternatives Considered
- Option A — [why rejected]
- Option B — [why rejected]

## Trade-offs
[What we give up]
```

---

## Experiment Log — Write Hypothesis Before Running

If the developer is running a chaos experiment or parameter change:

```markdown
## Experiment: [Title] — YYYY-MM-DD

**Hypothesis:** [expected outcome and why]
**Setup:** [commands / config changes]
**Observation:** [what actually happened]
**Root Cause:** [the mechanism]
**Fix:** [code or config change applied]
```

---

## Domain Vocabulary

Use these exact terms consistently across code, comments, and logs:

| Term | Meaning |
|---|---|
| `TaxProfile` | A user's tax filing context for a fiscal year |
| `TaxCalculation` | One computed result for a TaxProfile |
| `input_snapshot` | Frozen copy of user input at calculation time |
| `taskId` | RabbitMQ job identifier, used as idempotency key prefix |
| `outboxEvent` | Pending domain event waiting to be published to RabbitMQ |
| `fiscalYear` | BD tax year string e.g. `"2024-25"` |