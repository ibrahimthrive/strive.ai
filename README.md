# Strive.ai — by Ibrahim

Strive is an AI chat platform with Free / Pro subscription tiers, model routing,
daily usage limits, and Stripe-managed billing.

## Stack

- **Backend**: FastAPI (async), SQLAlchemy 2.0 + asyncpg, OpenAI SDK, Stripe SDK, PyJWT
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS

## Project layout

```
backend/
  app/
    main.py                  FastAPI app, CORS, table creation on startup
    core/
      config.py              Pydantic settings (env-driven)
      db.py                  Async engine/session, declarative Base
      security.py            Password hashing + JWT issuing/decoding
      persona.py             Hardcoded Strive system prompt
    models/
      user.py                User (tier: free|pro, stripe_customer_id)
      usage_log.py           Per-user, per-day message counter
    schemas/                 Pydantic request/response models
    services/
      openai_service.py      Tier -> model routing + streaming completion
      usage_service.py       Free-tier daily quota check/increment
    api/
      deps.py                get_current_user (JWT bearer)
      routes/
        auth.py               POST /api/auth/register, /api/auth/login
        chat.py               POST /api/chat (streaming)
        billing.py            POST /api/billing/checkout-session
        webhooks.py           POST /api/webhooks/stripe
frontend/
  app/
    page.tsx                  Chat UI (redirects to /auth if signed out)
    auth/page.tsx             Login / sign-up page
  components/                 ChatInterface, Sidebar, MessageBubble
  lib/api.ts                  Streaming fetch client for /api/chat
docker-compose.yml            Postgres + backend + frontend, fully containerized
```

## Tiers

| Tier | Daily limit | Model |
|------|-------------|-------|
| Free | 20 messages/day | `gpt-4o-mini` |
| Strive Pro | Unlimited | `gpt-4o` |

Limits and model names are configurable via env vars
(`FREE_TIER_DAILY_MESSAGE_LIMIT`, `FREE_TIER_MODEL`, `PRO_TIER_MODEL`).

## Running the backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, OPENAI_API_KEY, STRIPE_* keys
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Tables are created automatically on startup against the Postgres database
in `DATABASE_URL`.

## Running the frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Visit http://localhost:3000. If you're signed out you'll land on `/auth`,
where you can register or log in; the JWT returned by the backend is stored
in `localStorage["strive_access_token"]`. A 401 from `/api/chat` (expired or
invalid token) clears it and redirects back to `/auth` automatically, and
the sidebar has a "Log out" button.

## Running everything with Docker Compose

This brings up Postgres, the backend, and the frontend together:

```bash
cp backend/.env.example backend/.env   # fill in OPENAI_API_KEY, STRIPE_* keys
docker compose up --build
```

- `DATABASE_URL` is overridden inside Compose to point at the `db` service
  (`postgresql+asyncpg://strive:strive@db:5432/strive`), so the value in
  `backend/.env` only matters when running the backend outside Docker.
- The frontend image bakes `NEXT_PUBLIC_API_BASE_URL` in at build time
  (Next.js inlines `NEXT_PUBLIC_*` vars at build, not runtime) — override it
  via the `args.NEXT_PUBLIC_API_BASE_URL` build arg in `docker-compose.yml`
  if the backend isn't reachable at `http://localhost:8000` from the browser.
- Visit http://localhost:3000 once both containers are up.

## Stripe webhook

Point a Stripe webhook (or the Stripe CLI: `stripe listen --forward-to
localhost:8000/api/webhooks/stripe`) at `/api/webhooks/stripe`, subscribed to
`checkout.session.completed` and `customer.subscription.updated` /
`customer.subscription.deleted`. Checkout sessions created via
`POST /api/billing/checkout-session` set `client_reference_id` to the user's
ID so the webhook can flip their tier to `pro` on successful payment, and
back to `free` if their subscription lapses.
