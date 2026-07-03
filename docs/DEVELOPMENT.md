# Development guide

## Project layout

```
Laundryx/
├── backend/
│   ├── server.js              # app wiring: middleware, routes, error handler, export
│   ├── config/db.js           # Mongo connection + stale-order cron
│   ├── models/                # User, Order, CatalogItem, Setting, Review, Notification
│   ├── controllers/           # one per domain (auth, student/launderer orders,
│   │                          #   catalog, setting, admin, review, razorpay, notification)
│   ├── routes/                # express routers, mounted in server.js
│   ├── middlewares/           # verifyUser / verifyStudentDetails / verifyLaunderer / verifyAdmin
│   ├── utils/                 # logger (winston), auth helpers
│   ├── scripts/seedAdmin.js   # `npm run seed:admin`
│   └── views/                 # EJS reset-password page
├── frontend/
│   └── src/
│       ├── pages/             # LandingPage, Login, Signup, OrderList, CheckoutPage,
│       │                      #   DashBoard/{Student,Launderer,Admin}
│       ├── components/        # Navbar, OrderCard, ScheduleCard, LaundererCatalog,
│       │                      #   LaundererPicker, RateOrderModal, *Details, *OrdersDetail…
│       ├── components/Store/  # Zustand stores (AuthStore, OrderStore) — sessionStorage
│       └── utils/apis.jsx     # all axios API calls + single API_URL
├── docs/                      # this documentation
├── docker-compose.yml         # mongo + backend + frontend
└── .github/workflows/ci.yml   # lint + build
```

## Running

See the [README](../README.md) for Docker and manual setup. TL;DR:

```bash
docker compose up --build
docker compose exec backend npm run seed:admin
```

## State management (frontend)

- **`AuthStore`** — auth flag, user profile, notifications (persisted to
  `sessionStorage`).
- **`OrderStore`** — the in-progress order (items, launderer, schedule),
  persisted to `sessionStorage` so it survives navigation. The order form
  inputs are **controlled by the store**, so returning to a screen restores
  the selections.

## Linting & formatting

Both packages use ESLint (airbnb + prettier) with `--max-warnings 0`.

```bash
# backend
cd backend && npm run lint          # check
cd backend && npm run lint:fix      # auto-fix

# frontend
cd frontend && npm run lint
cd frontend && npm run lint:fix
```

CI runs these on every push/PR (`.github/workflows/ci.yml`), so keep them green.
There is a husky pre-commit hook (`lint-staged`) when installed.

## Testing

The backend has an end-to-end/integration suite (Jest + supertest) covering
auth, catalog, dynamic settings, the full order flow (server-side pricing,
validation, accept → pickup → deliver, reschedule, cancel), reviews/ratings,
and admin management.

```bash
cd backend && npm test
```

By default it spins up an in-memory MongoDB (`mongodb-memory-server`). To run
against a real Mongo instead, set `TEST_MONGO_URI`:

```bash
TEST_MONGO_URI=mongodb://localhost:27017/laundrix_test npm test
```

CI runs `npm test` on every push/PR. Frontend component/e2e tests are the next
addition (recommended: Vitest + React Testing Library, and Playwright for
browser E2E).

## Reproducing CI locally without Node installed

If Node isn't on your PATH, run the exact CI steps in a container:

```bash
docker run --rm -v "$PWD/backend":/app -w /app node:20-alpine \
  sh -c "npm install && npm run lint"
docker run --rm -v "$PWD/frontend":/app -w /app node:20-alpine \
  sh -c "npm install && npm run lint && npm run build"
```

## Deployment

The app is Vercel-ready as two projects:

- **Backend** (`backend/vercel.json`) — `@vercel/node` builds `server.js`, which
  exports the Express app and only calls `app.listen` when not on Vercel.
- **Frontend** (`frontend/vercel.json`) — SPA rewrite so client-side routing
  works.

Steps:
1. Create two Vercel projects pointing at `backend/` and `frontend/`.
2. Set env vars per [ENVIRONMENT.md](ENVIRONMENT.md) (backend runtime vars in
   the backend project; `VITE_*` in the frontend project, with `VITE_API_URL`
   pointing at the deployed backend).
3. Point the backend's `FRONTEND_URL` at the deployed frontend origin for CORS.
4. Deploy on push (CI must be green first).

> **Production caveats:** rate limiting is in-memory (per-instance) — use a
> shared store (Redis) for strict limits on serverless; and the stale-order
> cron won't fire reliably on serverless — move it to a Vercel Cron / worker.

## Git conventions

- Commits are authored as `ashwinkothavade <ashwinkothavade@gmail.com>` and
  **without** a Claude co-author trailer.
- Work is committed in logical, buildable phases.
