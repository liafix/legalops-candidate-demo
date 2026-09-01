# LegalOps — IT Operations & Incident Console

A focused candidate demonstrator for a **Junior programmer / IT back-office** role. LegalOps shows one complete, deterministic support-to-engineering workflow using synthetic data only:

**ServiceDesk request → technical task → logs/API/data diagnosis → safe remediation → evidence-backed QA → technical resolution → requester-facing update → audit trail**

> **Candidate-project disclaimer**  
> Built from publicly available role/company context. It uses synthetic data only. It is **not** a Poradca podnikateľa product, internal system, or representation of its architecture.

## Quick review

- **Primary scenario:** `INC-1042 — Published document not synchronized`
- **Stack:** Next.js 15.5.24, React 19.2.8, TypeScript, Prisma, PostgreSQL, Zod, Vitest, React Testing Library
- **Quality gate:** production dependency audit → ESLint → TypeScript → unit/component tests → PostgreSQL migrations → database-backed golden-path test → production build
- **Live demo:** added after the final CI + deployment gate

## 3-minute walkthrough

1. Open **INC-1042** from the Operations Overview.
2. Read the original synthetic **ServiceDesk request** and its translation into a technical task.
3. Start investigation.
4. Correlate `req_83fc` across the Log Explorer and API Inspector.
5. Verify document version 7 is `PUBLISHED` but synchronization is `FAILED`.
6. Run the predefined **Retry synchronization** remediation.
7. Observe the new 200 API request, correlated success log, `COMPLETED` data state and audit events.
8. Complete the backend-validated QA checks.
9. Resolve the incident with a technical note.
10. Compare the technical resolution with the concise requester-facing ServiceDesk update.
11. Reset the demo to restore the deterministic starting state.

## Why this project exists

The demo is intentionally not another generic frontend dashboard. It is designed to demonstrate the working habits expected in junior development and IT back-office work:

- turning an internal user report into a concrete technical task,
- investigating logs, HTTP/API behavior and database state,
- applying a constrained remediation rather than arbitrary production commands,
- validating acceptance criteria before resolution,
- maintaining traceability through an audit trail,
- and communicating the result back to a non-technical requester.

## Architecture

```text
Browser
  ↓
Next.js / React
  ↓ REST/JSON route handlers
Application + domain services
  ↓
Prisma
  ↓
PostgreSQL
```

The application deliberately stays a single deployable service. Domain boundaries are logical rather than being split into unnecessary microservices.

## Core engineering decisions

### Server-side workflow invariants

The UI is not trusted to enforce the workflow. Backend rules reject invalid transitions such as:

```text
OPEN → RESOLVED
OPEN → remediation
COMPLETED sync → retry
READY_FOR_QA → RESOLVED without required QA
```

The intended path is:

```text
OPEN
  ↓
INVESTIGATING
  ↓ successful remediation
READY_FOR_QA
  ↓ evidence-backed QA + resolution note
RESOLVED
```

### Incident-scoped diagnostics

Logs and API requests are related directly to the incident, not only to a shared service. This prevents cross-incident contamination when several incidents involve the same service.

Primary access paths are indexed for:

- chronological incident logs,
- incident + severity filtering,
- request ID correlation,
- incident API request history,
- and incident audit history.

### Safe remediation

The demo does not expose arbitrary shell commands or arbitrary SQL. The only write operation is an explicit domain action: **Retry synchronization**.

### Evidence-backed QA

QA checks are not decorative checkboxes. The backend verifies evidence such as:

- the latest incident API request is successful,
- document synchronization is `COMPLETED`,
- no new incident-scoped `ERROR` log exists after remediation,
- and the expected document version is synchronized.

### Technical and requester-facing communication

Resolution stores both:

- a technical resolution note for engineering traceability,
- and a concise requester-facing ServiceDesk update suitable for a non-technical colleague.

### Deterministic reset

The seed/reset path executes atomically in one database transaction. It restores the same `INC-1042` / `DOC-2084` scenario for every reviewer.

## Data model

Primary entities:

```text
Incident
Service
Document
DiagnosticLog
ApiRequest
QaCheck
AuditEvent
```

`Incident` also stores the synthetic ServiceDesk context: requester, channel, original request, affected product and translated technical task.

## Testing strategy

The repository separates fast tests from the database-backed release check.

### Unit / component tests

```bash
npm test
```

These cover:

- incident state rules,
- remediation guards,
- QA and resolution invariants,
- API validation contracts,
- mocked service workflows,
- request/log/audit correlation,
- incident-scoped diagnostic queries,
- Log Explorer interactions,
- and the reviewer section navigation.

### Database-backed golden path

```bash
npm run test:integration
```

CI provisions PostgreSQL, applies the committed migrations and verifies the real persisted path:

```text
seed
→ ServiceDesk context present
→ OPEN
→ INVESTIGATING
→ remediation
→ correlated API + log
→ QA
→ RESOLVED
→ audit assertions
→ reset
→ original OPEN / FAILED state restored
```

## Code quality

```bash
npm run lint
npm run typecheck
npm run format
npm run format:check
```

The repository includes ESLint with Next.js Core Web Vitals rules plus a Prettier configuration. Formatting artifacts and TypeScript incremental build output are excluded from Git.

## Security and release posture

- Next.js is pinned to the patched 15.x Maintenance LTS security release used by this candidate build.
- React and React DOM are pinned to 19.2.8.
- Direct package versions are exact-pinned.
- Production dependencies are checked with `npm audit --omit=dev --audit-level=high` in CI.
- No secrets are committed.
- Database writes are constrained to defined domain actions.
- The public demo contains synthetic data only.

## Local setup

A PostgreSQL `DATABASE_URL` is required.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

For an already provisioned deployment database:

```bash
npm run db:migrate:deploy
npm run db:seed
```

## CI release gate

GitHub Actions runs:

```text
lockfile validation / bootstrap
→ npm ci
→ production dependency audit
→ Prisma generate
→ ESLint
→ TypeScript
→ unit + component tests
→ Prisma migrate deploy on PostgreSQL
→ database-backed golden-path test
→ production build
```

The final public release must commit the generated `package-lock.json`. If the first CI run starts without one, the workflow generates it from exact direct versions and uploads it as the `package-lock-bootstrap` artifact so it can be committed before deployment.

## Deployment checklist

Before sharing the project with an employer:

1. Commit `package-lock.json` produced by the first networked CI run.
2. Confirm GitHub Actions is fully green.
3. Configure a real PostgreSQL `DATABASE_URL` in the deployment environment.
4. Run `npm run db:migrate:deploy` and `npm run db:seed`.
5. Deploy the application.
6. Smoke-test the full `INC-1042` golden path and reset behavior on the live URL.
7. Add the verified live URL and a real application screenshot to this README.

## Scope boundary

This is not a JIRA clone, production legal CMS, authentication platform, or full observability suite. It is a deliberately narrow candidate demonstration of troubleshooting, API/data reasoning, SQL-aware data access, QA discipline, IT back-office translation and technical communication.
