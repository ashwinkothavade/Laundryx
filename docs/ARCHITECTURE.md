# Architecture

## Overview

LaundriX is a two-service application:

- **`backend/`** — an Express + MongoDB (Mongoose) REST API. Auth is a JWT
  stored in an httpOnly cookie. On Vercel it runs as a serverless function
  (the app is exported); locally/in Docker it binds a port.
- **`frontend/`** — a React (Vite) SPA using Chakra UI, with Zustand for client
  state (persisted to `sessionStorage`). Served by nginx in Docker/production.

```
Student / Launderer / Admin  ──►  React SPA (Chakra UI)
                                       │  axios (withCredentials)
                                       ▼
                                 Express API  ──►  MongoDB
                                       │
                                       ├─ Razorpay (payments)
                                       └─ Nodemailer (password reset)
```

## Roles & permissions

There are three roles on the `User` model (`role`: `student | launderer | admin`).

| Capability | Student | Launderer | Admin |
|---|:---:|:---:|:---:|
| Browse approved launderers & catalogs | ✅ | ✅ | ✅ |
| Place / pay / cancel-delete own orders | ✅ | | |
| Rate a launderer after delivery | ✅ | | |
| Manage own catalog (clothing/wash/price) | | ✅ | |
| Accept/reject/deliver orders | | ✅ | |
| Be visible to students | | ✅ *(after approval)* | |
| Approve/revoke launderers | | | ✅ |
| Manage all users / roles | | | ✅ |
| Manage dynamic settings | | | ✅ |
| View global analytics & oversight | | | ✅ |

Middleware (`backend/middlewares/authMiddleware.js`):
- `verifyUser` — validates the JWT cookie and attaches `req.user` (the decoded
  token: `username`, `role`, `user_id`, `hostel`). All protected controllers
  read `req.user` instead of re-verifying.
- `verifyStudentDetails` — blocks students who haven't set their hostel.
- `verifyLaunderer` / `verifyAdmin` — role guards (must run after `verifyUser`).

## Data models

### User (`models/userModel.js`)
`username`, `email`, `phone_number` (Indian format), `password` (bcrypt-hashed
via a pre-save hook), `role`, `approved` (launderers only, default `false`),
plus student profile fields (`hostel`, `room_number`, `roll_number`).

> ⚠️ The pre-save hook re-hashes on every `.save()`. To update a user without
> corrupting the password, use `findByIdAndUpdate` (as approval/role changes do).

### CatalogItem (`models/catalogModel.js`)
A per-launderer offering: `launderer` (ref User), `clothingType`, `washType`,
`price`, `image`. Unique on `(launderer, clothingType, washType)`.

### Order (`models/orderModel.js`)
`user` (ref student), `launderer` (username), `items[]` (`name`, `washType`,
`quantity`, `pricePerItem` — no fixed enums), `orderTotal`, pickup/delivery
date/time/address, and lifecycle booleans: `acceptedStatus`, `pickUpStatus`,
`deliveredStatus`, `paid`.

### Setting (`models/settingModel.js`)
A generic admin-managed list: `key` (unique) → `values[]`. Used for `locations`
and `timeSlots`; new dynamic lists need no schema change — just a new key.

### Review (`models/reviewModel.js`)
`launderer` (ref), `student` (ref), `order` (ref, unique — one review/order),
`rating` (1–5), `comment`.

### Notification (`models/notificationModel.js`)
Messages between students and launderers about order events.

## Order lifecycle

```
Student builds order ─► placed (acceptedStatus=false)
                          │
        Launderer accepts ▼ (or rejects)
                       accepted ─► picked up ─► delivered
                          │            │            │
              Student pays ▼            │   Student can rate ▼
                        paid            │          Review created
```

- **Pricing is server-side.** On order creation the API looks up each item's
  price from the chosen launderer's catalog and computes `orderTotal` itself,
  and validates locations/times against the dynamic settings — the client
  cannot tamper with prices or invent options.
- Stale, fully-completed orders are cleaned up by a daily cron
  (`config/db.js#deleteValidOrders`). *(Note: on Vercel serverless this cron is
  best-effort; move to a scheduled function for production.)*

## Dynamic-by-design

Anything a real marketplace differs on is data, not code:
- **Catalog** (clothing types, wash types, prices) — per launderer.
- **Locations & time slots** — admin-managed `Setting` lists.
- **Wash/clothing types** — free-form strings validated against the catalog,
  not hard enums.

## Auth flow

1. `POST /login` verifies the password (bcrypt) and sets an httpOnly `jwt`
   cookie (`SameSite=None; Secure` in production, `Lax` in dev).
2. The SPA sends `axios.defaults.withCredentials = true`, so the cookie rides
   along automatically.
3. Protected routes run `verifyUser` → `req.user`.
4. `GET /me` lets the client validate/hydrate the current user from the cookie.

## Logging & security

- **Logging:** Winston (structured JSON in prod, pretty in dev) + Morgan HTTP
  logs, plus a global Express error handler. Configure with `LOG_LEVEL`.
- **Security:** Helmet headers, `express-rate-limit` (tighter on auth routes),
  CORS allow-list (`FRONTEND_URL`), password hashing, and ownership/role checks
  on every mutating route.
