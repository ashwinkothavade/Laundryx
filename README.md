# <img src="https://github.com/NightFury742/LaundriX/assets/119070798/5afc3cc0-69c9-45d9-83ff-faafbc888a8d" height="40px"> LaundriX

LaundriX is a **multi-tenant laundry-management platform**. Students discover
launderers, order from each launderer's own live catalog, pay online, and rate
the service; launderers manage their own catalog of clothing/wash types and
prices and fulfil orders; and an admin oversees the whole marketplace.

Nothing about the catalog or ordering options is hardcoded — clothing types,
wash types, prices, pickup/delivery locations and time slots are all data,
managed by launderers and admins at runtime.

> ### 🌐 Live demo
> | | URL |
> |---|---|
> | **App (frontend)** | https://laundrix-web-five.vercel.app |
> | **API (backend)** | https://laundrix-api-delta.vercel.app |
>
> Log in with a **username** (not an email) — see [Demo accounts & test data](#-demo-accounts--test-data).

<br>

## Table of contents

- [Features by role](#-features-by-role)
- [Tech stack](#-tech-stack)
- [Quick start (Docker)](#-quick-start-docker)
- [Manual setup](#-manual-setup)
- [Creating the admin](#-creating-the-admin)
- [Demo accounts & test data](#-demo-accounts--test-data)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [License](#-license)

<br>

## 👥 Features by role

### Student
- **Discover launderers** — searchable, sortable directory (by rating, lowest
  price, or name) showing each launderer's average rating, price range and
  number of catalog items.
- **Order from a live catalog** — pick a launderer, then choose clothing items
  and wash types from *that launderer's* catalog with real prices.
- **Schedule** pickup/delivery using admin-managed locations and time slots.
- **Pay securely** with Razorpay.
- **Track & manage orders** with status filters, and **rate** launderers after
  delivery (1–5 stars + comment).
- **Notifications** for order updates.

### Launderer
- **Manage a catalog** — add/edit/delete clothing types, wash types and prices
  from a dedicated dashboard tab.
- **Fulfil orders** — accept/reject, mark picked-up/delivered, change delivery
  date.
- Requires **admin approval** before becoming visible to students.

### Admin
- **Approve / revoke launderers.**
- **Manage users** — change roles, delete accounts.
- **Oversee** every order and every launderer's catalog.
- **Manage dynamic settings** — locations, time slots, and any new list.
- **Analytics** — users by role, total orders, paid revenue, catalog size,
  orders per launderer.

<br>

## 🧰 Tech stack

**Frontend:** React (Vite), Chakra UI, Zustand, React Router, Framer Motion,
Razorpay, EmailJS.
**Backend:** Express, MongoDB (Mongoose), JWT auth (httpOnly cookies), Razorpay,
Winston + Morgan logging, Helmet, rate limiting.
**Infra:** Docker Compose (Mongo + backend + nginx-served frontend), GitHub
Actions CI, Vercel-ready.

<br>

## 🐳 Quick start (Docker)

The whole stack (MongoDB + backend + frontend) is containerised.

```bash
cp .env.example .env          # fill in secrets (or use the defaults for local)
docker compose up --build
docker compose exec backend npm run seed:admin   # create the admin + starter settings
```

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:4000>
- MongoDB: `localhost:27017` (persisted in the `mongo-data` volume)

Default seeded admin (change in `.env`): **admin@laundrix.com** / **Admin@1234**.

<br>

## 🔧 Manual setup

**Backend**
```bash
cd backend
npm install
npm run server        # nodemon on :4000  (npm start for plain node)
npm run seed:admin    # once, to create the admin
```

**Frontend**
```bash
cd frontend
npm install
npm run dev           # Vite dev server
```

You'll need a running MongoDB and a `.env` (see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)).

<br>

## 🔑 Creating the admin

There is no public admin signup. Run the seed script, which reads the `ADMIN_*`
env vars, creates (or promotes) the admin, and migrates the previously
hardcoded locations/time-slots into the database as editable settings:

```bash
cd backend && npm run seed:admin
```

<br>

## 🧪 Demo accounts & test data

A second seed script populates a full demo marketplace — launderers with
catalogs, customers, coupons, and orders in every status (including reviewed
ones) — so every screen has realistic data:

```bash
cd backend && npm run seed:data
```

It seeds **3 launderers** (all admin-approved), **4 customers**, **3 coupons**,
**6 orders** (2 reviewed), and a 5% `taxPercent` setting. The script is
**re-runnable** — it removes the demo entities it owns before recreating them,
leaving the admin and any real data untouched.

> ⚠️ **Log in with the `username`, not the email.** The login endpoint matches
> on username, so entering an email returns "User not found".

**All accounts use the password `Password@123`** (except the admin — see below).

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Admin | `admin` | `Admin@1234` | from `seed:admin`; full console |
| Launderer | `sparklewash` | `Password@123` | 6 catalog items, express ₹30 |
| Launderer | `freshfold` | `Password@123` | 6 items, express ₹20 |
| Launderer | `cleancrease` | `Password@123` | 5 dry-clean items, no express |
| Customer | `rahul_c` | `Password@123` | a completed+reviewed order and a pending one |
| Customer | `priya_c` | `Password@123` | an in-progress express order + one to rate |
| Customer | `amit_c` | `Password@123` | an order awaiting pickup |
| Customer | `sneha_c` | `Password@123` | a completed+reviewed dry-clean order |

**Coupons to try at checkout:** `WELCOME10` (10% off, min ₹100, cap ₹50),
`FLAT50` (₹50 off, min ₹200), `SAVE20` (20% off, min ₹150, cap ₹100).

<br>

## 📚 Documentation

| Doc | What's inside |
|-----|---------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data models, roles & permissions, order lifecycle, dynamic-settings design, auth flow |
| [docs/API.md](docs/API.md) | Complete REST endpoint reference |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable (backend + frontend build args) |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Project layout, running, linting, testing, CI, deployment |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Live deployment — what is deployed where, env vars per project, how to redeploy |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Market-readiness checklist of remaining work |

<br>

## 🚀 Deployment

The app is **live** as two Vercel projects backed by MongoDB Atlas:

| Layer | What | Where | URL |
|-------|------|-------|-----|
| Frontend | Vite/React SPA | Vercel project `laundrix-web` (root `frontend/`) | https://laundrix-web-five.vercel.app |
| Backend | Express API (serverless) | Vercel project `laundrix-api` (root `backend/`) | https://laundrix-api-delta.vercel.app |
| Database | MongoDB (M0 free tier) | MongoDB Atlas (`cluster0`) | — |

- The frontend's `VITE_API_URL` is baked in at build time to point at the API;
  the API's `FRONTEND_URL` allow-lists the frontend origin for CORS.
- CI (`.github/workflows/ci.yml`) runs lint + build/test on every push/PR.

Full details — env vars per project, the Atlas IP allow-list requirement, and
how to redeploy — are in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

<br>

## 📄 License

MIT License
