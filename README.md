# Zavarovalnica Horica – web UI

React + TypeScript web app for the Zavarovalnica Horica project (RSO 2026/27, group 3).
Customers report damage and follow their claims; employees review the claims the agents
could not decide on their own.

> ⚠️ Prototype with fictional data only. It is not intended for real claims.

## Users and screens

| Who | Route | What it does | Use case |
|---|---|---|---|
| Customer | `/my/policies` | Policies, validity, what they cover, limit and deductible | UC-1 |
| Customer | `/my/claims/new` | Report a claim with amount, description and documents | UC-2, UC-3 |
| Customer | `/my/claims`, `/my/claims/:id` | Claim status, history, messages from the reviewer, add documents | UC-3, UC-4 |
| Employee | `/reviews` | Claims assigned to me: approve, reject or request more documents | UC-6 |
| Employee | `/claims`, `/claims/:id` | All claims with agent results, risk score, documents and full history | UC-5, UC-8 |
| Manager | `/dashboard` | Counts, reviews waiting for an assignee, team workload | |
| Manager | `/team`, `/team/:id` | Staff and their open and decided reviews | |
| Manager | `/history` | Every event on every claim, searchable | UC-8 |
| Everyone | `/documents/:claimId?file=…` | View a claim document (mock mode) | |

## How a claim is processed

The mock backend follows the project plan, so the UI behaves like the real system will:

1. **ClaimsService** saves the claim (`claim.submitted.v1`) and **DocumentService** the documents (`document.added.v1`).
2. **AgentService, agent 1** collects the claim, policy and documents and checks the policy is valid and covers the claim.
3. **RiskService** applies fixed rules and returns a risk score from 0 to 1 with reasons.
4. **AgentService, agent 2** writes a summary and a proposal (`claim.recommendation.created.v1`).
5. A claim is approved automatically only with a valid policy, at least one document, an amount up to **300 €**
   and a risk score up to **0.20**. Everything else goes to an employee (`review.requested.v1`).
   The agents never reject a claim on their own; a proposed rejection also goes to an employee.
6. **ReviewService**: a manager assigns the review, the employee approves, rejects or asks for more documents
   (`review.completed.v1`).
7. When the customer adds documents to a claim that waits for them, the agents check it again (UC-7).

Every step is stored in the claim's history, with the event name, who did it and when.

## Run locally

Needs Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Other scripts: `npm run build` (type check and production build), `npm run typecheck`, `npm run preview`.

## Mock data vs. real services

By default the UI uses fake in-browser data, so it works without any backend. Changes are kept
until the browser tab is closed. The login page lists the demo accounts (customers and staff) and
their shared password; clicking a name fills in the form.

| File | Contents |
|---|---|
| [`src/core/mock/mock-data.ts`](src/core/mock/mock-data.ts) | Demo accounts and policies |
| [`src/core/mock/seed.ts`](src/core/mock/seed.ts) | Starting claims and what happened to them |
| [`src/core/mock/engine.ts`](src/core/mock/engine.ts) | The processing rules: agents, risk score, reviews |
| [`src/core/mock/mock-documents.ts`](src/core/mock/mock-documents.ts) | Fictional documents: accident statement, invoices, photos, lost-baggage report |
| [`src/core/mock/mock-api.ts`](src/core/mock/mock-api.ts) | Fake backend with the same access rules as the real one |

Useful demo paths:

- Sign in as **luka** and open CLM-2002: the reviewer asked for documents. Upload any file and the claim is checked again.
- Sign in as **ana** and report a claim up to 300 € with a document: it is approved straight away.
- Sign in as **marko** to decide CLM-2001 (the 1.200 € example from the project plan).
- Sign in as **petra** (manager) to assign reviews and see the history.

To use the real services, build with `VITE_USE_MOCK_API=false` (in a `.env` file or as a Docker build
argument). The UI then sends the token as `Authorization: Bearer <token>` to the API Gateway:

| Method | Path | Service |
|---|---|---|
| POST | `/api/auth/login` | Keycloak (will be replaced by the OpenID Connect redirect) |
| GET | `/api/policies` | PolicyService |
| GET | `/api/claims`, `/api/claims/:id` | ClaimsService |
| POST | `/api/claims` | ClaimsService |
| GET | `/api/claims/history` | ClaimsService |
| POST | `/api/documents/:claimId` | DocumentService |
| GET | `/api/documents/:claimId/:name` | DocumentService |
| GET | `/api/users?role=staff` | Keycloak / user directory |
| PUT | `/api/reviews/:claimId/assignment` | ReviewService |
| POST | `/api/reviews/:claimId/decision` | ReviewService |

Request and response shapes are in [`src/core/models.ts`](src/core/models.ts).

## Docker

```bash
docker build -t web-ui:latest .
docker run -p 8080:80 web-ui:latest
```

## Kubernetes

```bash
kubectl apply -f k8s/web-ui.yaml
```

## Project structure

```
src/
├── core/          models, API client, session, formatting, helpers
│   └── mock/      fake backend and fictional data
├── components/    layout, route guard, badges, documents, review controls
└── pages/
    ├── customer/  customer view
    └── staff/     employee and manager view
```
