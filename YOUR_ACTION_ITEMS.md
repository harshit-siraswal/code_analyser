# Your Action Items (Azure + Firebase Auth + Neon)

Last updated: February 22, 2026

## 1. Final Decisions Locked

1. Backend and analysis hosting: `Azure`.
2. Authentication: `Firebase Auth`.
3. Database: `Neon PostgreSQL`.
4. Code execution: `Judge0` (self-hosted on Azure VM, with hosted Judge0 as fallback).

## 2. Accounts to Prepare

1. Azure subscription (Free Account is fine to start).
2. Firebase project (same Google account for Auth + web app config).
3. Neon account and project.
4. GitHub account and repo access.
5. Enable MFA on all accounts.

## 3. Azure Infrastructure Tasks

1. Create one resource group (example: `rg-code-analyser-dev`).
2. Create Azure Container Apps environment for:
   - `api` service
   - `analysis-service`
3. Create Azure Container Registry (or GHCR) for container images.
4. Configure environment variables and secrets in Container Apps.
5. Create an Azure VM for Judge0 (Ubuntu) and install Docker + Compose.
6. Configure NSG/firewall:
   - `22` (SSH) restricted to your IP
   - `2358` (Judge0) restricted to API service access only

## 4. Firebase Auth Tasks

1. Enable `Email/Password` provider in Firebase Auth.
2. Enable `Google` provider if you want social login in MVP.
3. Add authorized domains:
   - local dev URL
   - deployed frontend domain
4. Create Firebase service account for backend token verification.
5. Store service-account secrets securely (do not commit JSON key files).

## 5. Neon Tasks

1. Create Neon project and database.
2. Create least-privilege DB user for the app.
3. Save primary `DATABASE_URL` and pooled/backup connection string.
4. Keep one branch for `dev` and one for `prod`.

## 6. Required Secrets and Env Values

Backend (`code_analyser_backend`):

1. `DATABASE_URL`
2. `JUDGE0_BASE_URL`
3. `JUDGE0_API_KEY`
4. `ANALYSIS_SERVICE_URL`
5. `FIREBASE_PROJECT_ID`
6. `FIREBASE_CLIENT_EMAIL`
7. `FIREBASE_PRIVATE_KEY`

Frontend (`code analyser`):

1. `VITE_API_BASE_URL`
2. `VITE_FIREBASE_API_KEY`
3. `VITE_FIREBASE_AUTH_DOMAIN`
4. `VITE_FIREBASE_PROJECT_ID`
5. `VITE_FIREBASE_APP_ID`

## 7. Product Inputs You Still Need to Finalize

1. First 20 MVP problems:
   - difficulty
   - concept tags
   - visible test cases
   - hidden test cases
2. Concept taxonomy v1:
   - arrays/lists
   - strings
   - recursion
   - conditionals
   - edge-case handling

## 8. Beta Preparation

1. Prepare 10-20 beta users.
2. Create feedback intake form.
3. Define issue triage labels (bug, analysis quality, UX, performance).

## 9. Inputs Needed From You Right Now

1. Azure region to use (example: `Central India`).
2. Firebase project ID.
3. Choice for Judge0 mode:
   - self-host on Azure VM
   - hosted Judge0 API for MVP
4. Frontend hosting preference:
   - Azure Static Web Apps
   - Vercel
