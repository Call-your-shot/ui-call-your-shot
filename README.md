# SunShare UI

Next.js 16 frontend for tenant solar assessments, landlord proposals,
operational dashboards, and sponsor-backed green credits.

## Architecture

The browser calls only Next.js Route Handlers. Server-only handlers read the
HttpOnly demo session and call FastAPI through `BACKEND_URL`.

```text
Browser → Next.js BFF → FastAPI → domain calculations/repositories
                    ↘ Google Solar / Gemini (server-side only)
```

Account, property, plan, ROI, proposal, support-report, settings, and
green-credit values come from FastAPI. Google Solar and bill extraction remain
Next-hosted integrations because their API keys must never reach the browser.

## Run locally

Start the backend first:

```bash
cd ../backend-call-your-shot
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8001
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

1. bill usage and household answers;
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
