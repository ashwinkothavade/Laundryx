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

## Production notes / caveats

- **`trust proxy`** is enabled in `app.js` so `express-rate-limit` reads the
  real client IP from `X-Forwarded-For` behind Vercel's proxy.
- **Rate limiting is in-memory** — per serverless instance, so best-effort only.
  Use a shared store (Redis) for strict limits.
- **The stale-order cron** (`node-cron` in `server.js`) does not fire reliably on
  serverless. Move it to a Vercel Cron / external scheduler if needed.
- **Razorpay** currently uses **test** keys. Real payments need a KYC-activated
  Razorpay account and live keys, with `VITE_RAZORPAY_KEY_ID` and the backend
  `RAZORPAY_KEY_ID` on the **same** account/mode.
- **Payment confirmation** is client-side (signature verified server-side) with
  no webhook fallback; a Razorpay webhook is the standard hardening step.
