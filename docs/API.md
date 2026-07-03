# API Reference

Base URL: `http://localhost:4000` (local) — configurable via `VITE_API_URL` on
the frontend. All authenticated requests rely on the httpOnly `jwt` cookie set
at login; send credentials with every request.

**Auth column:** 🔓 public · 🔒 any logged-in user · 🎓 student · 🧺 launderer
(approved where noted) · 🛠️ admin.

## Auth & users

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| POST | `/signup` | 🔓 | `{ username, email, password, role, phone_number }` — launderers start unapproved |
| POST | `/login` | 🔓 | `{ username, password }` → sets `jwt` cookie |
| GET | `/logout` | 🔒 | Clears the cookie |
| GET | `/me` | 🔒 | Current user (no password) — validates the session |
| PATCH | `/user` | 🔒 | Update own profile fields |
| GET | `/users` | 🔒 | All users (no password) — legacy/testing |
| GET | `/launderers` | 🔒 | Approved launderers only |
| GET | `/launderers/directory` | 🔒 | Approved launderers with `avgRating`, `reviewCount`, `minPrice`, `maxPrice`, `itemCount` |
| POST | `/forgotpassword` | 🔓 | `{ email }` → emails a reset link |
| GET | `/resetpassword/:id/:token` | 🔓 | Renders the reset page |
| POST | `/resetpassword/:id/:token` | 🔓 | `{ password }` |

## Catalog

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/catalog/my` | 🧺 | The launderer's own items |
| POST | `/catalog` | 🧺 | `{ clothingType, washType, price, image? }` — 409 on duplicate combo |
| PUT | `/catalog/:id` | 🧺 | Owner only; any of `clothingType/washType/price/image` |
| DELETE | `/catalog/:id` | 🧺 | Owner only |
| GET | `/catalog/launderer/:username` | 🔒 | An approved launderer's catalog (for ordering) |

## Student orders

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/student/orders` | 🎓 | The student's orders |
| GET | `/student/launderers` | 🔒 | Launderers (username + phone) |
| POST | `/student/createorder` | 🎓 | `{ items, launderer, pickup/delivery date/time/address }` — **prices computed server-side from the catalog** |
| PUT | `/student/updatepickupstatus/:order_id` | 🎓 | Owner only |
| PUT | `/student/updatedeliverystatus/:order_id` | 🎓 | Owner only |
| DELETE | `/student/deleteorder/:order_id` | 🎓 | Owner only |

## Launderer orders

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/allorders` | 🧺 | Orders addressed to this launderer |
| GET | `/orders/:username` | 🧺 | A given student's orders |
| PUT | `/acceptorder/:order_id` | 🧺 | |
| PUT | `/rejectorder/:order_id` | 🧺 | |
| PUT | `/updatedeliveredstatus/:order_id` | 🧺 | |
| PUT | `/updatedeliverydate/:order_id` | 🧺 | `{ deliveryDate }` |

## Launderer service settings

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/launderer/analytics` | 🧺 | The launderer's own order/revenue/rating stats |
| PUT | `/launderer/availability` | 🧺 | `{ timeSlots: [] }` — the launderer's own time slots |
| PUT | `/launderer/express` | 🧺 | `{ expressSurcharge }` — flat express fee (0 = off) |

## Coupons

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/coupons/:code?subtotal=NN` | 🔒 | Preview: `{ valid, discount, message }` |
| POST | `/admin/coupons` | 🛠️ | `{ code, discountType: 'percent'\|'flat', value, minOrder?, maxDiscount?, expiresAt? }` |
| GET | `/admin/coupons` | 🛠️ | List coupons |
| DELETE | `/admin/coupons/:id` | 🛠️ | Delete a coupon |

> **Order pricing extras:** `POST /student/createorder` also accepts
> `fulfilmentMode` (`home_pickup`\|`self_dropoff`), `express` (bool), and
> `couponCode`. Express surcharge, coupon discount and tax are all resolved
> server-side. Tax comes from the admin `taxPercent` setting (a single value,
> e.g. `PUT /settings/taxPercent { "values": ["5"] }`). The order stores a full
> breakdown: `subtotal`, `expressCharge`, `discount`, `tax`, `orderTotal`.

## Reviews & ratings

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| POST | `/reviews` | 🎓 | `{ orderId, rating (1–5), comment? }` — delivered + owned order; 409 if already reviewed |
| GET | `/reviews/launderer/:username` | 🔒 | Reviews + `avgRating` + `count` |
| GET | `/reviews/summary` | 🔒 | Map of `username → { avgRating, count }` |

## Settings (dynamic lists)

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/settings` | 🔒 | `{ settings: { key: values[] } }` |
| GET | `/settings/:key` | 🔒 | `{ key, values }` |
| PUT | `/settings/:key` | 🛠️ | `{ values: [] }` — replace the whole list |
| POST | `/settings/:key` | 🛠️ | `{ value }` — append one |
| DELETE | `/settings/:key/:value` | 🛠️ | Remove one |

## Admin

All under `/admin` require an admin.

| Method | Path | Body / notes |
|---|---|---|
| GET | `/admin/users` | All users |
| DELETE | `/admin/users/:id` | Delete a user (not self) |
| PATCH | `/admin/users/:id/role` | `{ role }` (not self) |
| PATCH | `/admin/users/:id/approval` | `{ approved: boolean }` — launderers only |
| GET | `/admin/orders` | Every order (student populated) |
| GET | `/admin/catalog` | Every catalog item (launderer populated) |
| GET | `/admin/analytics` | `usersByRole`, `totalOrders`, `paidRevenue`, `totalCatalogItems`, `ordersPerLaunderer` |

## Payments (Razorpay)

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| POST | `/payment` | 🔒 | `{ amount, currency, receipt }` → creates a Razorpay order |
| PUT | `/payment/validate` | 🔒 | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }` — verifies signature, marks order paid |

## Notifications

| Method | Path | Auth | Body / notes |
|---|---|:---:|---|
| GET | `/notifications` | 🔒 | Current user's notifications + unread count |
| POST | `/notifications` | 🔒 | `{ student, launderer, message, orderId }` |
| DELETE | `/notifications/:id` | 🔒 | |

## Common error shapes

- `400` — validation error (`{ message }`)
- `401` — not authenticated / bad credentials
- `403` — authenticated but not authorized (wrong role or not the owner)
- `404` — not found
- `409` — conflict (duplicate catalog combo / duplicate review)
- `500` — server error (also logged with a stack trace)
