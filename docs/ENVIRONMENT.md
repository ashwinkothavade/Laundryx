# Environment variables

Copy `.env.example` to `.env` and fill these in. Docker Compose reads the root
`.env` automatically; for manual runs the backend reads it via `dotenv`.

## Backend (runtime)

| Variable | Required | Purpose |
|---|:---:|---|
| `MONGO_URI` | ✅ (boot) | MongoDB connection string. In Docker, leave unset to use the bundled `mongo` service (`mongodb://mongo:27017/laundrix`). |
| `ACCESS_TOKEN_SECRET` | ✅ | Secret for signing/verifying the JWT auth cookie. |
| `RAZORPAY_KEY_ID` | ✅ (boot) | Razorpay key id. Must be non-empty or the server won't boot; use a dummy for local dev without payments. |
| `RAZORPAY_SECRET` | ✅ (boot) | Razorpay secret (used to verify payment signatures). |
| `JWT_SECRET` | for reset | Secret for password-reset tokens. |
| `GMAIL_ADDRESS` | for reset | Gmail address used to send reset emails. |
| `GMAIL_PASSWORD` | for reset | Gmail **app password** (not the login password). |
| `NODE_ENV` | recommended | `production` behind HTTPS (Secure cookies), else `development`. |
| `LOG_LEVEL` | optional | `error \| warn \| info \| http \| verbose \| debug`. Defaults to `debug` (dev) / `info` (prod). |
| `FRONTEND_URL` | optional | Extra CORS origins (comma-separated). `localhost:5173` + `laundrix-web.vercel.app` are always allowed. |
| `BACKEND_URL` | optional | Base URL used to build the password-reset link. Defaults to `http://localhost:4000`. |
| `PORT` | optional | Local port (default `4000`; ignored on Vercel). |
| `VERCEL` | auto | Set by Vercel to skip `app.listen`. **Don't set manually.** |

### Admin seed (`npm run seed:admin`)

| Variable | Purpose |
|---|---|
| `ADMIN_USERNAME` | Admin username |
| `ADMIN_EMAIL` | Admin email (used to find/promote) |
| `ADMIN_PASSWORD` | Must satisfy: 8+ chars, upper + lower + digit + special |
| `ADMIN_PHONE` | Indian phone (`+91…` or `0…`) |

## Frontend (build-time — inlined by Vite)

These must be present as **build args** (Docker `--build-arg` / compose `args`)
or as env vars in the Vercel frontend project, because Vite bakes them in.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (preferred). If unset, falls back to `VITE_DEV_ENV`. |
| `VITE_DEV_ENV` | `development` → API at `localhost:4000`; otherwise the hosted API. |
| `VITE_RAZORPAY_KEY_ID` | Razorpay **publishable** key id (client checkout). |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service id (contact form). |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS template id. |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key. |

## Minimum to run locally

`MONGO_URI` (or the bundled Mongo), `ACCESS_TOKEN_SECRET`, and non-empty
`RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` (dummy is fine). `NODE_ENV=development`,
`FRONTEND_URL=http://localhost:8080`, and `VITE_DEV_ENV=development` for the
Docker setup — all already defaulted in `.env.example`.
