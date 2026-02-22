# Deep Analysis Code Analyser Web App: Detailed Implementation Plan

Version: 1.0  
Prepared: February 22, 2026  
Source Inputs: `Product_Requirements_Document.docx`, `Technical_Requirements_Document.docx`

## 1. Plan Objective

Build and launch the MVP of the Deep Analysis coding practice platform in 12 weeks as a solo developer, with:

- Authentication via Firebase Auth (email/password, optional Google)
- Problem browsing and solving (Python only for MVP)
- Monaco editor with Run/Submit
- Attempt tracking with code snapshots
- On-demand analysis engine
- Analysis UI (summary, concept breakdown, timeline, diff)
- Basic progress dashboard

## 2. Scope Definition

### 2.1 In Scope (MVP)

- FR-1.1, FR-1.3, FR-1.4, FR-1.5 (implemented via Firebase Auth + app profile sync)
- FR-2.1 to FR-2.5 (problem list/filter/search/details)
- FR-3.1, FR-3.3 to FR-3.7 (editor, autosave, run/submit, execution results, limits)
- FR-4.1 to FR-4.5 (attempt and session tracking)
- FR-5.1 to FR-5.7 (rule-based analysis pipeline)
- FR-6.1 to FR-6.6 (analysis visualization)
- FR-7.1 to FR-7.5 (basic dashboard and weak area tracking)

### 2.2 Deferred to Phase 2+

- OAuth login (FR-1.2)
- Non-Python language support (FR-3.2 beyond Python)
- Recommendation engine automation across problems (FR-8.x full rollout)
- ML-powered analysis enhancements

## 3. Delivery Constraints and Assumptions

- Solo developer, full-time, 8-12 weeks target.
- Zero-cost tooling and hosting.
- Start date assumed: Monday, February 23, 2026.
- Planned MVP beta completion: Sunday, May 17, 2026.
- Chosen infrastructure (updated decision):
  - Frontend: Azure Static Web Apps (Vercel is fallback)
  - Backend API: Azure Container Apps
  - Analysis Service: Azure Container Apps
  - Auth: Firebase Auth
  - Database: Neon PostgreSQL
  - Judge0: Azure VM (self-hosted) or hosted Judge0 fallback

## 4. Architecture Implementation Blueprint

### 4.1 Services

- Frontend SPA (`React 18 + Tailwind + Zustand + React Query`)
- Backend API (`Node.js 20 + Express + Prisma`)
- Analysis microservice (`Python 3.11 + FastAPI`)
- Code execution service (`Judge0 CE`, self-hosted)
- Authentication provider (`Firebase Auth`, server-side token verification)
- PostgreSQL database (`Neon`)

### 4.2 Runtime Data Flow

1. User opens problem page and edits code.
2. Autosave stores draft at 30s interval.
3. User clicks `Run`:
  - Backend executes against visible tests via Judge0.
  - Result returned without final attempt closure.
4. User clicks `Submit`:
  - Backend creates attempt + session metadata.
  - Backend submits hidden + visible tests to Judge0.
  - Backend polls result and persists status/runtime/errors.
5. User clicks `Analyze`:
  - Backend fetches all attempts by `session_id`.
  - Sends payload to FastAPI analysis service.
  - FastAPI returns concept detection, diff timeline, summary, recommendations.
  - Backend stores analysis and returns response to frontend.
6. Dashboard aggregates concept mastery and error patterns.

### 4.3 Repository Structure

```text
code analyser/                     # frontend repo
  apps/web

code_analyser_backend/             # backend repo
  apps/api
  apps/analysis-service
  packages/shared-types
  infra/docker
  infra/scripts
  docs/architecture
```

## 5. Work Breakdown Structure (WBS)

### 5.1 Foundation and Platform

- Project scaffolding and monorepo setup
- CI pipeline (lint, unit tests, build)
- Environment management (`.env.example`, secret mapping)
- Logging and tracing baseline

### 5.2 Backend/API

- Firebase token verification, user sync, and auth middleware
- Problem catalog endpoints and filtering
- Submission orchestration with Judge0
- Attempt/session persistence
- Analysis trigger and result retrieval
- Dashboard aggregate endpoints

### 5.3 Frontend

- Auth screens + session handling
- Problem list/detail pages
- Monaco editor integration
- Run/Submit UX + status/error handling
- Analysis page components
- Dashboard and concept views

### 5.4 Analysis Service

- AST parsing module
- Error classification adapter
- Attempt diff generator
- Concept extraction rules
- Complexity heuristic engine
- Summary/recommendation templating

### 5.5 Data and Content

- Schema creation and migrations
- Seed script for 20 curated problems
- Test case authoring framework
- Concept taxonomy and problem mapping

### 5.6 Quality, Security, and Reliability

- Rate limiting and abuse controls
- Input validation and sanitization
- Integration tests and e2e tests
- Performance budgets and profiling
- Backup and restore verification

## 6. Sprint Plan (12 Weeks, 6 Sprints)

## Sprint 1 (Feb 23 - Mar 8, 2026): Infrastructure + Core Data Model

### Goals

- Stand up all core environments and data schema.
- Verify Judge0 connectivity from backend sandbox.

### Deliverables

- Split repo structure validated (`code analyser` frontend + `code_analyser_backend` backend).
- Neon project provisioned and connected via Prisma.
- Initial schema deployed: `users`, `problems`, `test_cases`, `problem_concepts`, `attempts`, `attempt_results`, `analyses`, `user_progress`.
- Azure VM with Judge0 CE + API key auth (hosted Judge0 fallback documented).
- Local docker-compose for development parity.

### Acceptance Criteria

- `api` can connect to DB in dev and staging.
- Sample submission to Judge0 succeeds in < 7s median.
- Migrations run from clean checkout.
- CI validates lint/build/test on pull request.

## Sprint 2 (Mar 9 - Mar 22, 2026): Authentication + Problem Catalog

### Goals

- Complete user auth lifecycle and problem browsing.

### Deliverables

- API:
  - `POST /auth/session` (create/sync app user from verified Firebase ID token)
  - `GET /me` (current user profile from app DB)
  - `PATCH /me` (profile updates)
  - `GET /problems` with difficulty/tag/search filters
  - `GET /problems/:slug`
- Web:
  - Firebase client auth integration (email/password + optional Google)
  - Protected routes using Firebase session state
  - Problem list/detail UI with filter/search state
- Data:
  - Seed pipeline for 20 curated Python problems with tagged concepts

### Acceptance Criteria

- User can register/login/logout and reach protected pages.
- Problem filtering returns correct subsets by difficulty/tag.
- Response times for list endpoints stay < 400ms on seeded dataset.

## Sprint 3 (Mar 23 - Apr 5, 2026): Editor + Run/Submit + Attempt Tracking

### Goals

- Deliver full problem-solving flow with tracked attempts.

### Deliverables

- Monaco editor with Python starter code and syntax highlighting.
- Autosave every 30s with optimistic status indicators.
- Run flow against visible tests.
- Submit flow against full tests, storing attempt and per-test results.
- Enforcement:
  - CPU timeout 5s
  - Memory 256 MB
  - Rate limit 10 submissions/min/user
- Attempt timeline API foundation.

### Acceptance Criteria

- User can solve a problem end-to-end without manual refresh.
- Every submit creates immutable code snapshot in `attempts`.
- Run/Submit error states mapped clearly (syntax/runtime/wrong answer/TLE).

## Sprint 4 (Apr 6 - Apr 19, 2026): Analysis Service MVP

### Goals

- Build and integrate analysis pipeline triggered by `Analyze`.

### Deliverables

- FastAPI endpoints:
  - `POST /analyze/session`
  - `GET /health`
- Analysis modules:
  - AST concept detection (loops, conditionals, recursion, lists, strings, edge checks)
  - Consecutive attempt diff generation
  - Error classification mapping from Judge0 status
  - Time complexity heuristic rules
  - Summary and recommendation template engine
- API integration:
  - `POST /analysis/:sessionId`
  - `GET /analysis/:sessionId`

### Acceptance Criteria

- Analysis generated within 10s for up to 10 attempts.
- Persisted `analyses` payload is stable and renderable by frontend.
- At least 20 golden test fixtures pass for analysis output consistency.

## Sprint 5 (Apr 20 - May 3, 2026): Analysis UI + Dashboard

### Goals

- Surface analysis and progress insights in production UI.

### Deliverables

- Analysis page:
  - Summary card
  - Concept breakdown table
  - Attempt timeline visualization
  - Side-by-side diff viewer
  - Complexity panel with suggested optimization
  - Recommendations panel
- Dashboard:
  - Solved/attempted/bookmarked counters
  - Last 7 days activity feed
  - Weak areas and misconception indicators
  - Concept mastery status (Beginner/Intermediate/Advanced)

### Acceptance Criteria

- Core analysis sections render from persisted backend payload.
- Dashboard computes user aggregates correctly on seeded history.
- Mobile/tablet layout remains usable for core flows.

## Sprint 6 (May 4 - May 17, 2026): Hardening + Beta Launch

### Goals

- Validate reliability/security/performance and launch beta.

### Deliverables

- Testing:
  - Backend integration suite
  - Analysis service unit and fixture tests
  - Frontend e2e for auth -> solve -> analyze -> dashboard flow
- Security:
  - Helmet/CORS hardening
  - Input validation on all public endpoints
  - Token and secret rotation process
- Performance:
  - Page load and API latency optimization
  - Query indexing and slow query audit
- Deployment:
  - Frontend on Azure Static Web Apps (Vercel fallback)
  - API + analysis service on Azure Container Apps
  - Database on Neon
- Beta operations:
  - Onboard 10-20 users
  - Feedback form and triage workflow

### Exit Criteria

- NFR targets met or documented with mitigation plan:
  - Execution <= 7s
  - Analysis <= 10s
  - Page load <= 2s on 3G (core pages)
- Zero blocker defects in critical path.
- Backup/restore verified for production DB.

## 7. API and Contract Plan

### 7.1 Core API Endpoints (MVP)

- `POST /auth/session`
- `GET /me`
- `PATCH /me`
- `GET /problems`
- `GET /problems/:slug`
- `POST /problems/:id/run`
- `POST /problems/:id/submit`
- `GET /sessions/:sessionId/attempts`
- `POST /sessions/:sessionId/analyze`
- `GET /sessions/:sessionId/analysis`
- `GET /dashboard/overview`
- `GET /dashboard/concepts`

### 7.2 Shared DTO Strategy

- Store shared request/response schemas in `packages/shared-types`.
- Enforce backend response validation with Zod (or equivalent).
- Generate typed frontend API clients from schema source.

## 8. Data Model and Migration Plan

### 8.1 Migration Sequence

1. Baseline identity tables (`users`, verification and reset tokens).
2. Problem domain (`problems`, `test_cases`, `problem_concepts`).
3. Attempt domain (`attempts`, `attempt_results`, draft/autosave table if needed).
4. Analysis domain (`analyses`).
5. Aggregate progress domain (`user_progress` + optional materialized view).

### 8.2 Required Indexes (Initial)

- `attempts(user_id, problem_id, submitted_at desc)`
- `attempts(session_id)`
- `attempt_results(attempt_id)`
- `analyses(user_id, session_id, created_at desc)`
- `problems(difficulty)`
- `problems using gin(to_tsvector('english', title || ' ' || description))` for search

## 9. Testing Strategy

### 9.1 Unit Tests

- Backend services: auth, problem filter logic, submission orchestrator.
- Analysis service: AST parser, complexity estimator, recommendations.
- Frontend state stores and utility formatters.

### 9.2 Integration Tests

- API + DB with test containers.
- Judge0 adapter with mocked and real sandbox smoke test.
- Analysis pipeline with fixture-driven expected outputs.

### 9.3 End-to-End Tests

- Scenario A: Register -> solve easy problem -> accepted -> analyze.
- Scenario B: Multiple failed attempts -> final accepted -> compare diff timeline.
- Scenario C: Dashboard reflects recent session stats.

### 9.4 Performance and Load

- Synthetic load to 100 concurrent active users.
- Submission burst tests with rate limiting.
- Profiling analysis generation with 10-attempt sessions.

## 10. Security and Compliance Checklist

- Firebase ID token verification on backend for every authenticated request.
- Firebase Auth manages password hashing, reset, and email verification.
- HTTPS enforced in production.
- Helmet + strict CORS allowlist.
- Per-route validation and sanitization.
- Submission and analysis rate limiting.
- Audit logging for auth, submit, and analyze actions.

## 11. Observability and Product Metrics

### 11.1 Technical Telemetry

- API request latency by endpoint (p50, p95, p99).
- Judge0 call latency and failure rate.
- Analysis processing duration.
- DB slow queries and connection utilization.

### 11.2 Product Analytics (from PRD success metrics)

- WAU, sessions/week, solved per user/week.
- Analyze click-through rate per solved/attempted session.
- Time spent on analysis page.
- Concept mastery progression trend.
- First-attempt success rate by cohort.

## 12. Risk Register and Mitigations

- Judge0 downtime or instability:
  - Mitigation: queue submission retries + graceful user messaging.
- Free-tier cold starts:
  - Mitigation: lightweight health pings and startup warm path.
- Analysis false positives:
  - Mitigation: fixture-based evaluation and rule tuning backlog.
- Scope overrun for solo development:
  - Mitigation: strict MVP gate, freeze non-critical enhancements until beta.
- Data loss risk:
  - Mitigation: automated daily backups and restore drill in Sprint 6.

## 13. Definition of Done (MVP Release)

- All MVP FRs implemented and validated in staging.
- NFR performance/security baselines measured and documented.
- Production deployment completed with runbooks.
- Monitoring and alerting active.
- Beta feedback loop operational with issue triage SLA.

## 14. Day-1 Execution Checklist

1. Create monorepo and service scaffolds.
2. Provision Azure resources (Container Apps + VM), Firebase project, and Neon project.
3. Provision Judge0 target (Azure VM self-hosted or hosted Judge0 fallback).
4. Commit initial Prisma schema + migration pipeline.
5. Add CI workflow for lint/test/build.
6. Create `docs/architecture/ADR-001-system-design.md`.
7. Seed 3 sample problems and validate end-to-end local flow.

## 15. Post-MVP Phase 2 Backlog (Prioritized)

1. Add JavaScript language support end-to-end.
2. Expand problem bank from 20 to 70+.
3. Cross-problem misconception detection and recommendation ranking.
4. Additional Firebase Auth providers (GitHub, Microsoft).
5. ML-assisted summary quality upgrades.
