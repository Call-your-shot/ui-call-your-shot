# SunShare UI

Next.js 16 frontend for tenant solar assessments, landlord proposals,
operational dashboards, and sponsor-backed green credits.

## Architecture

The browser calls only Next.js Route Handlers. Server-only handlers read the
HttpOnly demo session and call FastAPI through `BACKEND_URL`.

```text
Browser → Next.js BFF → FastAPI → domain calculations/repositories
                    ↘ Google Solar (server-side only)
```

Account, property, plan, ROI, proposal, support-report, settings, and
green-credit values come from FastAPI. Google Solar remains a Next-hosted
integration because API keys must never reach the browser.

## Frontend structure

```text
app/                 Next.js App Router pages and route handlers
components/          Shared UI, app shells, focused-flow shells, and layouts
lib/                 Client/server helpers, API payloads, calculations, tests
assets/fonts/        Self-hosted Public Sans files used by next/font/local
public/              Static product imagery and green-project assets
```

Routes use normal folder names such as `dashboard`, `plans`, `roof`, and
`signin`. The previous parenthesized route-group folders were removed so the
tree is easier to scan in GitHub.

## Run locally

Start the backend first:

```bash
cd ../backend-call-your-shot
python3.11 -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Configure and run the UI:

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default backend URL
is `http://127.0.0.1:8001`.

The separate telemetry mock service, when used, runs on port `8000`; FastAPI
is the only component that should call it.

## Initial ROI assessment

The assessment flow combines:

1. property address and household answers;
2. annual-load estimation from FastAPI;
3. roof generation from Google Solar or a clearly labelled fallback;
4. FastAPI Monte Carlo ROI through `/api/v1/assessments/initial`.

The results page displays median tenant savings, landlord cash flow, payback
percentiles, probability of payback, pricing assumptions, and data-quality
warnings from the saved backend assessment. It distinguishes tenant solar
share from generation self-consumption and does not call simulation ranges
confidence intervals.

Initial dynamic pricing is an assumption-based approximation. Operational
bills use the backend's timezone-aware interval pricing engine with actual
hourly meter data.

The old bill-upload scanner route has been removed. New assessments now start
from the property/roof flow rather than `/scan`, and there is no `/api/bill`
route in the frontend.

## Proposal PDF

After a tenant creates a shareable landlord proposal, both the tenant and
landlord views expose **Download proposal PDF**. The dynamic route
`GET /api/proposal/{inviteToken}/pdf` loads the immutable proposal snapshot and
its saved ROI assessment from FastAPI, then renders an A4 document containing:

- property, tenant, landlord recipient, system, and energy details;
- tenant savings and landlord payback percentile ranges;
- dynamic-pricing assumptions and the hourly-pricing integration boundary;
- Monte Carlo methodology, warnings, next steps, and acknowledgement lines;
- a QR code back to the live landlord proposal.

The document is deliberately labelled as a feasibility proposal rather than a
quote, guarantee, confidence interval, final contract, or financial advice.
If the process-local assessment has expired, PDF generation falls back to the
financial snapshot stored on the proposal and displays an explicit warning.

## Demo identity and persistence

Email-only sign-in is for hackathon use. The email is stored in an HttpOnly
cookie and injected into backend calls by the Next BFF. Demo account switching
is controlled by `NEXT_PUBLIC_DEMO_MODE`.

FastAPI's standard dashboard/workflow demo repository is process-local and
resets when FastAPI restarts. Production must use Supabase authentication and
the prepared persistent schema; the frontend does not silently replace a
failed first-party backend request with local account or financial fixtures.

## Verification

```bash
npm run lint
npm test -- --run
npm run build
```

`npm run build` uses `next build --webpack`. The project self-hosts Public Sans,
so builds do not need to fetch fonts from Google.
