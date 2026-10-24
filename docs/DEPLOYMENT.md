# Deployment

LaundriX runs as **two Vercel projects** (frontend + serverless backend) backed
by **MongoDB Atlas**.

## Live URLs

| Layer | What | Vercel project | Root dir | URL |
|-------|------|----------------|----------|-----|
| Frontend | Vite/React SPA (static) | `laundrix-web` | `frontend/` | https://laundrix-web-five.vercel.app |
| Backend | Express API (`@vercel/node`) | `laundrix-api` | `backend/` | https://laundrix-api-delta.vercel.app |
| Database | MongoDB M0 (free) | — | — | MongoDB Atlas cluster `cluster0` |

```
Browser ──▶ laundrix-web-five.vercel.app        (React SPA, static)
                │  XHR (VITE_API_URL, credentials: include)
                ▼
            laundrix-api-delta.vercel.app        (Express, serverless)
                │  Mongoose
                ▼
            MongoDB Atlas (cluster0)             (0.0.0.0/0 IP allow-list)
```

## How they connect

- **Frontend → backend:** `VITE_API_URL` is inlined into the SPA **at build
  time** (Vite). Changing it requires a **frontend rebuild/redeploy**, not just
  an env change.
- **Backend → frontend (CORS):** the API allow-lists origins from `FRONTEND_URL`
  (comma-separated) plus built-in defaults. Auth uses httpOnly cookies, so in
  production (`NODE_ENV=production`) they are sent `Secure` + `SameSite=None`,
  which requires both sides on HTTPS (Vercel provides this).

## Environment variables

Set per project in **Vercel → Project → Settings → Environment Variables**
(Production). Values live only in Vercel, never in git (`.env*` is git-ignored).

### Backend (`laundrix-api`)

| Key | Purpose |
|-----|---------|
| `NODE_ENV` | `production` (enables Secure/SameSite=None cookies) |
| `MONGO_URI` | Atlas connection string (`…/laundrix`) |
| `ACCESS_TOKEN_SECRET` | JWT signing secret |
| `JWT_SECRET` | secondary JWT secret |
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` | payment gateway (test or live) |
| `FRONTEND_URL` | deployed frontend origin, for CORS |
| `GMAIL_ADDRESS` / `GMAIL_PASSWORD` | password-reset email (optional) |

### Frontend (`laundrix-web`, build-time)

| Key | Purpose |
|-----|---------|
| `VITE_API_URL` | deployed backend origin |
| `VITE_RAZORPAY_KEY_ID` | Razorpay publishable key (must match the backend's key mode) |
| `VITE_EMAILJS_*` | contact-form email (optional) |

See [ENVIRONMENT.md](ENVIRONMENT.md) for the full variable reference.

## MongoDB Atlas requirements

- **Network Access → IP Access List must include `0.0.0.0/0`.** Vercel's
  serverless functions use rotating IPs that can't be individually allow-listed.
  Access is still protected by the database user credentials in `MONGO_URI`.
- Create the schema/data by running the seeds against the Atlas URI (below).

## Seeding the deployed database

The seeds are run **locally against the Atlas `MONGO_URI`** (Vercel's serverless
runtime can't run one-off scripts):

```bash
cd backend
# backend/.env must contain the Atlas MONGO_URI + ADMIN_* vars
npm run seed:admin   # admin account + starter locations/time-slots
npm run seed:data    # demo launderers, customers, coupons, orders, reviews
```

Demo credentials are documented in the [README](../README.md#-demo-accounts--test-data).
**Log in with the `username`, not the email.**

## Redeploying

Deploys are driven with the Vercel CLI from each project's root directory:

```bash
# backend
cd backend  && vercel deploy --prod

# frontend (rebuilds with current VITE_* values)
cd frontend && vercel deploy --prod
```

Env vars are managed with `vercel env add <NAME> production` /
`vercel env ls production`. (The projects can also be connected to the GitHub
repo for auto-deploy on push.)

## Troubleshooting a down deployment

Check the two endpoints that do not depend on the database:

```bash
curl -s https://laundrix-api-delta.vercel.app/health   # {"status":"ok",...}
curl -s https://laundrix-api-delta.vercel.app/ready    # 200 ready | 503 degraded
```

| Symptom | Meaning | Fix |
|---|---|---|
| `/health` → **200**, `/ready` → **503** `database: disconnected` | API is up, MongoDB is not | Check the Atlas cluster exists and is resumed, and that `MONGO_URI` is correct in Vercel |
| `/ready` → `mongoUriConfigured: false` | `MONGO_URI` is not set on the deployment | `vercel env add MONGO_URI production`, then redeploy |
| Every route → **500** `FUNCTION_INVOCATION_FAILED`, including `/health` | The function is crashing at import — a bad env var, a missing dependency, or a syntax error | Check the Vercel build and runtime logs for the project |
| Requests hang, then 504 | Atlas is unreachable from Vercel | Confirm **Network Access → `0.0.0.0/0`** on the Atlas project |

**Is the Atlas cluster still there?** A *paused* cluster keeps its DNS; a
*deleted* one has no records at all:

```bash
dig +short SRV _mongodb._tcp.<cluster-host>.mongodb.net
# no output => the cluster no longer exists; create a new one and update MONGO_URI
```

Free-tier (M0) clusters pause automatically after prolonged inactivity and are
eventually removed, so a demo left idle for months will need a fresh cluster and
a re-seed (`npm run seed:admin && npm run seed:data`).

## Production notes / caveats

- **`trust proxy`** is enabled in `app.js` so `express-rate-limit` reads the
  real client IP from `X-Forwarded-For` behind Vercel's proxy.
- **Rate limiting is in-memory** — per serverless instance, so best-effort only.
  Use a shared store (Redis) for strict limits.
- **A database outage degrades the API, it does not kill it.** `config/db.js`
  never calls `process.exit()`; the connection promise is cached per instance
  and retried on a later invocation, `/health` and `/ready` always answer, and
  data-backed routes return a 503 that names the cause.
- **Razorpay** currently uses **test** keys. Real payments need a KYC-activated
  Razorpay account and live keys, with `VITE_RAZORPAY_KEY_ID` and the backend
  `RAZORPAY_KEY_ID` on the **same** account/mode.
- **Payment confirmation** arrives by webhook at `POST /payment/webhook`,
  which is authoritative; the browser handler is an optimistic UI path. The
  webhook needs `RAZORPAY_WEBHOOK_SECRET` set on the API project and the URL
  registered in the Razorpay dashboard (Settings -> Webhooks), subscribed to
  `payment.captured` and/or `order.paid`. Razorpay disables an endpoint that
  fails for 24 hours, so check it after any API outage.
