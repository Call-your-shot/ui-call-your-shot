<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Solar Tenant Pricing API (`solar-pricing-api/`)

> **Added:** 2026-08-22 on branch `analytical-service`

## Overview

A **FastAPI REST API** microservice that dynamically prices rooftop solar electricity supplied by a landlord/solar provider to a tenant in **Wollongong, NSW, Australia**.

The core invariant is:

```
P_export(t)  <  P_tenant(t, q)  <  P_grid(t)
```

The tenant pays less than grid retail; the landlord earns more than the solar feed-in tariff.

## Project Structure

```
solar-pricing-api/
├── app/
│   ├── __init__.py
│   ├── config.py         # Location settings, default pricing parameters
│   ├── tariffs.py        # TOU grid & export rate schedules, resolver functions
│   ├── models.py         # Pydantic v2 request/response models
│   ├── pricing.py        # Pure pricing engine (decoupled from FastAPI)
│   └── main.py           # FastAPI application & route handlers
├── tests/
│   ├── __init__.py
│   ├── test_pricing.py   # 32 unit tests for pricing engine
│   └── test_api.py       # 11 async integration tests for endpoints
├── requirements.txt
├── README.md
└── .gitignore
```

## Architecture (layered, decoupled)

```
Client request
  → FastAPI endpoint (app/main.py)
    → Pydantic validation (app/models.py)
      → Tariff resolver (app/tariffs.py)
        → Pricing engine (app/pricing.py)
          → PricingResult response
```

**Key design decisions:**
- Pricing logic is **pure functions** — no FastAPI dependency, independently testable.
- Tariff schedules are **data-driven** (list of tuples), not hardcoded `if` chains.
- Rates can be **overridden per-request**, enabling future retailer API integration.
- Models use `Optional[T]` (not `T | None`) for **Python 3.9 compatibility**.

## Pricing Formula

### Dynamic mode

Landlord share factor (decays with usage):
```
α(q) = α_min + (α_max − α_min) × e^(−k × q)
```

Tenant solar rate:
```
P_solar(t, q) = P_export(t) + α(q) × (P_grid(t) − P_export(t))
```

Higher solar usage → lower α → lower tenant price → incentive to consume solar.

### Fixed mode

Flat rate (e.g. 22 c/kWh) applied to solar usage. Grid usage priced at TOU grid rate.

## API Endpoints

| Method | Path                              | Purpose                        |
|--------|-----------------------------------|--------------------------------|
| `POST` | `/api/v1/price/calculate`         | Single-interval pricing        |
| `POST` | `/api/v1/price/calculate-batch`   | Multi-interval + summary       |
| `GET`  | `/api/v1/price/preview`           | Quick lookup via query params  |
| `GET`  | `/api/v1/tariffs`                 | Current TOU schedule           |
| `GET`  | `/health`                         | Health check                   |

## Default TOU Rates (Wollongong / Endeavour Energy)

### Grid (cents/kWh)
| Period      | Rate  |
|-------------|-------|
| 00:00–10:00 | 35.69 |
| 10:00–14:00 | 12.35 |
| 14:00–16:00 | 35.69 |
| 16:00–20:00 | 46.85 |
| 20:00–24:00 | 35.69 |

### Export (cents/kWh)
| Period      | Rate  |
|-------------|-------|
| 00:00–10:00 | 4.00  |
| 10:00–14:00 | 3.20  |
| 14:00–16:00 | 6.00  |
| 16:00–20:00 | 18.00 |
| 20:00–24:00 | 4.00  |

## Running

```bash
cd solar-pricing-api
source .venv/bin/activate    # venv already created
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

## Tests

```bash
cd solar-pricing-api
source .venv/bin/activate
pytest -v                    # 43 tests, all passing
```

## Dependencies

`fastapi`, `uvicorn`, `pydantic` v2, `httpx`, `pytest`, `pytest-anyio`

## Future Extension Points

The architecture explicitly supports later addition of:
- `property_id`, `tenant_id`, `meter_id` fields
- Live retailer tariff APIs (AGL, Origin, etc.)
- Smart-meter / inverter data integration
- Database-backed contracts
- Wholesale electricity prices
- Battery state-of-charge
