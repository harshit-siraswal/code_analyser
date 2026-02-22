# Your Action Items (Frontend + Platform Sync)

Last updated: February 23, 2026

## 1. Current Status

- [x] Auth shell (login/register/protected routes) is live.
- [x] Problem workspace supports language selection (Python/C/C++/Java).
- [x] Terminal and run-result panels are present in workspace UI.
- [x] Backend now serves DB-backed problems from imported dataset.
- [x] Azure API and analysis services are running custom images (`prod2`).
- [x] Dashboard session cards now deep-link into workspace analysis (`sessionId` + auto-load flow).
- [x] Analysis payload can surface optional LLM mode metadata (Gemini-augmented vs heuristic).
- [x] Session analysis now aggregates all attempts and surfaces:
  - attempt diagnostics (syntax/logic/runtime rates + dominant pattern)
  - topic mastery levels (Beginner/Intermediate/Advanced)
  - weak-topic insights
  - repeated edit hotspots (line-level)
  - weak-topic practice suggestions (Easy/Medium/Hard)
- [x] API now sends `problem_concepts` context to analysis-service for stronger topic-level feedback.
- [x] Problem concept inference is integrated for APPS export/import and API fallback normalization.
- [x] Workspace full-screen now keeps terminal + run/submit/analysis result sections visible.
- [x] Statement example parser now handles APPS inline/newline `Input/Output` formats more reliably.
- [x] Theme + signout controls switched to icon actions in top bars.

## 2. Blocking Issues To Resolve First

- [ ] Production frontend still points to legacy Render API in at least one deployment.
- [ ] Legacy Render API returns `500` due missing `DATABASE_URL`.
- [ ] COOP popup warning appears during Google popup flow (warning-level, not root API failure).

## 3. Immediate Next Steps

### P0 - Frontend env correction

- [ ] Set `VITE_API_BASE_URL` to Azure API:
  - `https://code-analyser-api-dev.nicebush-2884746d.centralindia.azurecontainerapps.io/api/v1`
- [ ] Redeploy frontend.
- [ ] Hard refresh and verify all API calls hit Azure domain.

### P0 - Fallback hygiene (optional)

- [ ] If Render backend remains as fallback, set all required secrets there:
  - `DATABASE_URL`
  - `JUDGE0_BASE_URL`
  - `JUDGE0_API_KEY`
  - `ANALYSIS_SERVICE_URL`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

### P1 - Product validation after deploy

- [ ] Confirm `/api/v1/problems` shows imported problem set in UI.
- [ ] Confirm dashboard is fed from backend data, not static fallback.
- [ ] Confirm run/submit works in each supported language option.
- [ ] Validate visible tests for APPS problems no longer show blanket `Internal Error` once latest backend image is live.
- [ ] Confirm analysis render path shows new diagnostics/mastery/hotspot/practice sections from real sessions.

## 4. Next Engineering Work

- [x] Roll out paginated problem browsing with search and total count.
- [x] Add richer analysis visualizations in dashboard/workspace.
- [x] Add multi-attempt pattern diagnostics + weak-topic recommendations pipeline.
- [ ] Backfill concept tags for older imported problems (one-time re-import/chunked refresh).
- [ ] Add one-command chunked APPS import runner (safe resume for 1k+ growth).
- [ ] Add API failure banners with explicit env-mismatch diagnostics.
- [ ] Add smoke tests to release checklist.

## 5. Security Hygiene

- [ ] Rotate leaked credentials:
  - ACR admin password
  - Neon DB password/URL
  - any exposed Judge0 token
- [ ] Keep secret values in provider secret stores only (avoid command history leakage).
