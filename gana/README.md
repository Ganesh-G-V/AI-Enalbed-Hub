# AI Enablement Hub — AI Intelligence Platform

Next.js AI intelligence platform that continuously discovers, validates, and presents changes in the AI ecosystem. Built with Next.js 16, React 19, Tailwind v4, shadcn/ui, PostgreSQL, and Prisma 6.

## Stack

- **Framework:** Next.js 16.4.2 (App Router, Turbopack)
- **UI:** React 19, Tailwind v4, shadcn/ui
- **Database:** PostgreSQL via Prisma 6
- **Tests:** Vitest (unit/integration), Playwright (E2E)
- **AI providers:** Mock / Anthropic / OpenAI (`AI_PROVIDER=mock` in dev)

## Intelligence Platform Features

### Source Connector Framework (`server/ingestion/`)
- Pluggable `SourceConnector` interface for provider APIs, pricing pages, release notes, RSS/Atom feeds
- OpenAI Models API connector (`server/ingestion/connectors/openai.ts`)
- Durable ingestion jobs with ETag/Last-Modified incremental sync, exponential backoff, retries
- Idempotent upserts — re-running ingestion never creates duplicates
- Change detection: new models, pricing changes, deprecations, capability changes produce `ChangeEvent` records
- Admin review queue: approve, reject, correct, defer change events

### Dynamic Data Model (Prisma schema)
- `SourceRegistry`, `SourceDocument`, `IngestionJob`, `IngestionRun`, `ChangeEvent`
- `ModelDeprecation`, `BenchmarkResult`, `RecommendationRule`, `RecommendationResult`, `RecommendationFeedback`, `Notification`
- Extended `ModelProfile` with lifecycle status, verification, confidence, last-verified
- Extended `ModelPricing` with versioning, `isVerified`, `isCurrent`, `confidence`
- Extended `Tool` with source URL, verification status, last verified

### Live Data APIs
| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/sources` | GET/POST | Source registry — list and register ingestion sources |
| `/api/v1/sources/[id]` | GET/PATCH/DELETE | Source detail — update config, enable/disable, delete |
| `/api/v1/sources/[id]/sync` | POST | Manual sync trigger for a source |
| `/api/v1/sources/[id]/runs` | GET | Ingestion run history for a source |
| `/api/v1/changes` | GET | Change feed — pending and approved change events |
| `/api/v1/changes/[id]/review` | POST | Review a change event (approve/reject/correct/defer) |
| `/api/v1/models` | GET | Model catalogue — list models with pricing, lifecycle, deprecations |
| `/api/v1/models/[id]` | GET | Model detail — full pricing history, benchmarks, deprecations |
| `/api/v1/recommendations/dynamic` | POST | Dynamic, evidence-based model recommendations |

### Dynamic Recommendation Engine
- Filters models by lifecycle status, company approval, data classification
- Ranks by weighted criteria (cost, capabilities, context window, verification)
- Returns fit score, fit reason, trade-offs, alternatives, evidence citations
- Separate from the existing `/api/v1/recommendations` tool-based recommendation

## Prerequisites

- Node.js 20+
- PostgreSQL running (dev uses port **5433**; database `ai_hub`, trust auth)

## Environment

`.env` (already configured):

```
DATABASE_URL=postgresql://ganeshgv@localhost:5433/ai_hub
APP_BASE_URL=http://localhost:3000
AI_PROVIDER=mock
AI_API_KEY=
AI_DEFAULT_MODEL=mock-model
AUTH_MODE=none
USAGE_LIMIT_PER_USER=1000
MAX_OUTPUT_TOKENS=4096
ENABLE_DEMO_MODE=true
```

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client + run migrations (includes intelligence platform tables)
npx prisma generate
npx prisma migrate dev

# Seed the database (idempotent)
npx tsx prisma/seed.ts

# Start dev server (http://localhost:3000)
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit/integration tests |
| `npm run e2e` | Run Playwright E2E tests |

## Routes

### Application pages (existing)

| Route | Description |
|-------|-------------|
| `/` | Home page with feature cards |
| `/dashboard` | Executive overview: stat cards, charts, quick actions |
| `/tools` | AI Tool Finder — search + filter tools |
| `/tools/recommend` | Recommendation Wizard — tool recommendations |
| `/prompts` | Prompt Library — templates with copy actions |
| `/knowledge` | Knowledge Center — guidance documents |
| `/token-lab` | Token & Cost Lab — cost estimation |
| `/analytics` | Usage and cost analytics |
| `/evaluations` | Evaluation Lab — scenarios and runs |
| `/admin` | Admin Settings — settings, audit, pricing |
| `/assistant` | Knowledge Assistant — RAG chat |

### API routes (existing + new)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/ready` | GET | Readiness check |
| `/api/v1/tools` | GET/POST | List and create tools |
| `/api/v1/tools/[id]` | GET/PATCH/DELETE | Tool CRUD |
| `/api/v1/recommendations` | POST | Tool recommendation (existing) |
| `/api/v1/recommendations/dynamic` | POST | Dynamic model recommendation (new) |
| `/api/v1/prompts` | GET | List prompts |
| `/api/v1/prompts/[id]` | GET/PATCH/DELETE | Prompt CRUD |
| `/api/v1/cost/estimate` | POST | Cost estimate |
| `/api/v1/cost/compare` | POST | Model cost comparison |
| `/api/v1/knowledge` | GET | Knowledge documents |
| `/api/v1/knowledge/[id]` | GET | Knowledge document detail |
| `/api/v1/knowledge/search` | GET | Knowledge search |
| `/api/v1/assistant/chat` | POST | AI assistant chat |
| `/api/v1/feedback` | POST | Submit feedback |
| `/api/v1/analytics/summary` | GET | Analytics summary |
| `/api/v1/analytics/usage` | GET | Usage analytics |
| `/api/v1/evaluations/scenarios` | GET | Evaluation scenarios |
| `/api/v1/evaluations/runs` | GET/POST | Evaluation runs |
| `/api/v1/evaluations/runs/[id]` | GET | Evaluation run detail |
| `/api/v1/admin/pricing` | POST | Create pricing records |
| `/api/v1/admin/tools` | POST | Create tools (admin) |
| `/api/v1/admin/tools/[id]` | PATCH/DELETE | Admin tool CRUD |
| `/api/v1/admin/knowledge` | POST | Create knowledge docs (admin) |
| `/api/v1/admin/audit` | GET | Audit events |
| `/api/v1/admin/settings` | GET/POST | App settings |
| `/api/v1/sources` | GET/POST | Source registry |
| `/api/v1/sources/[id]` | GET/PATCH/DELETE | Source detail |
| `/api/v1/sources/[id]/sync` | POST | Manual sync |
| `/api/v1/sources/[id]/runs` | GET | Ingestion runs |
| `/api/v1/changes` | GET | Change feed |
| `/api/v1/changes/[id]/review` | POST | Review change event |
| `/api/v1/models` | GET | Model catalogue |
| `/api/v1/models/[id]` | GET | Model detail |

## Test coverage

- **Vitest (33 tests, all passing):** number formatting, prompt variable substitution, mock provider determinism, DB seed counts, pricing calculation, ingestion connector normalization, idempotency, change detection, change review, pricing history preservation
- **Playwright (12 tests, all passing):** dashboard, home, tools, recommendation wizard, prompts, knowledge, token lab, analytics, evaluations, admin, assistant, health/ready endpoints

### Ingestion tests (`tests/integration/ingestion.test.ts`)

8 tests covering:
- OpenAI connector normalization of model data
- Rejection of invalid model data
- Source and job creation
- Idempotent ingestion (no duplicates on re-run)
- New model detection → ChangeEvent creation
- Content change detection for existing documents
- Change review queue (approve/reject)
- Pricing version history preservation

## Demo data

The database is seeded with:
- 2 demo users (developer + admin)
- 6 AI tools (GitHub Copilot, Sourcegraph Cody, Cursor, SQL Assistant, etc.)
- 3 model profiles (Claude 3.5 Sonnet, GPT-4o, Mock Demo Model)
- 3 illustrative pricing profiles (marked `isIllustrative: true`)
- 5 prompt templates
- 10 knowledge documents (all marked `isSample: true`)
- 8 evaluation scenarios
- 40 seeded usage events (`dataType: SEEDED`)
- 12 seeded feedback records

All seeded records have `isDemoUser` / `isSample` / `isIllustrative` flags where applicable. The analytics service includes an `isSeeded` flag to distinguish demo data from actual usage.

## Verification commands

```bash
# Health checks
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready

# Run unit + integration tests
npm test

# Run E2E tests (starts dev server automatically)
npm run e2e

# Production build
npm run build

# Run Prisma studio to inspect data
npx prisma studio
```

## Known issues / limitations

1. **Lint:** 39 `no-explicit-any` errors remain across server services, route handlers, and generic API client code. These are type-safety preferences, not functional bugs. Necessary `any` casts are used for Prisma Json compatibility in ingestion code.

2. **Authentication:** `AUTH_MODE=none` — no auth is enforced. The `resolveAuth` helper exists but is a stub. For production, integrate a real OIDC/session auth provider.

3. **AI credentials:** The app works fully without AI provider credentials (`AI_PROVIDER=mock`). To use real providers (Anthropic/OpenAI), set `AI_PROVIDER` accordingly and provide `AI_API_KEY` via environment variables. No credentials are stored in the repo.

4. **Database:** Requires PostgreSQL on port 5433 (5432 may be occupied by Postgres.app). Connection uses trust auth (no password).

5. **Scheduler:** Ingestion runs are triggered manually via `/api/v1/sources/[id]/sync` or programmatically. A production deployment should use a cron scheduler (e.g., Vercel Cron, AWS EventBridge) to call the sync endpoint periodically.

6. **Connectors:** Currently one production connector (OpenAI Models API). Additional connectors (Anthropic, pricing pages, RSS feeds) can be added by implementing the `SourceConnector` interface and registering it in `server/ingestion/service.ts`.