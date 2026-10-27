# ClaimDesk

Internal web app for insurance company staff, built with Angular. Part of the
[ZavarovalnicaOrg project](https://github.com/ZavarovalnicaOrg/insureflow-docs).

Each insurance company (organisation) uses the same app. Staff sign in by choosing
their organisation and entering their own username and password, and they only see
their organisation's data.

> ⚠️ Prototype with fictional data only. It is not intended for real claims.

## Roles

| Role | Can do |
|---|---|
| Employee | Enter claims, see all claims of the organisation, decide reviews assigned to them |
| Manager | Everything an employee can, plus the dashboard, the team list, and assigning reviews to employees |

## Screens

| Route | Who | What it does |
|---|---|---|
| `/login` | everyone | Choose organisation, sign in |
| `/dashboard` | manager | Claim counts (total, need review, not assigned, approved, rejected), reviews waiting for an assignee, team workload |
| `/team` | manager | All staff of the organisation with their open and completed reviews |
| `/team/:id` | manager | One employee: assigned reviews and completed reviews |
| `/reviews` | everyone | My reviews: approve or reject claims assigned to me |
| `/claims` | everyone | All claims, filter by status, shows who reviews each one |
| `/claims/new` | everyone | Enter a new claim (policy, amount, description, documents) |
| `/claims/:id` | everyone | Claim details, risk score, each agent's result, assignment and review |

## Run locally

Needs Node.js 22 (LTS) or newer.

```bash
npm install
npm start
```

Open http://localhost:4200.

## Mock data vs. real services

By default the UI uses fake in-browser data, so it works without any backend.
Changes are kept until the browser tab is closed.

There are two fictional organisations, each with one manager and a few employees.
The login page lists the demo accounts and their shared password, and clicking a
username fills the form. The accounts are defined in
[`src/app/core/mock-data.ts`](src/app/core/mock-data.ts).

The mock applies the same rules the agents are meant to use:

- a covered policy, small amount, with a document → approved automatically
- no documents, or an amount above the policy limit → needs review
- an inactive or unknown policy → rejected

To use the real services, set `useMockApi: false` in
[`src/app/core/settings.ts`](src/app/core/settings.ts). The UI then sends the
login token as `Authorization: Bearer <token>` and calls these REST endpoints:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/organisations` | Organisations for the login screen |
| POST | `/api/auth/login` | `{ orgId, username, password }` → `{ token, user, organisation }` |
| GET | `/api/users` | Staff of the signed-in organisation |
| GET | `/api/claims` | Claims of the organisation |
| GET | `/api/claims/:id` | One claim |
| POST | `/api/claims` | New claim |
| GET | `/api/policies` | Policies of the organisation |
| PUT | `/api/reviews/:claimId/assignment` | Manager assigns a review `{ assigneeId, note }` |
| POST | `/api/reviews/:claimId` | Reviewer decides `{ decision, comment }` |

The request and response shapes are in [`src/app/core/models.ts`](src/app/core/models.ts).

## Docker

```bash
docker build -t web-ui:latest .
docker run -p 8080:80 web-ui:latest
```

## Kubernetes (kind)

```bash
kind load docker-image web-ui:latest
kubectl apply -f k8s/web-ui.yaml
```

## Project structure

```
src/app/
├── core/        API client, mock backend, models, login session, guards
├── pages/       one component per screen
└── shared/      reusable parts (status badge, assign control, review form)
```
