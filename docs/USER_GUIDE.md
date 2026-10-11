# User guide

How to actually use LaundriX, screen by screen, for each of the three roles.
For how the system is built, see [ARCHITECTURE.md](ARCHITECTURE.md); for the
endpoints behind these screens, see [API.md](API.md).

- [Before you start](#before-you-start)
- [Signing in](#signing-in)
- [Customer](#customer)
- [Launderer](#launderer)
- [Admin](#admin)
- [Troubleshooting](#troubleshooting)

<br>

## Before you start

You can use either the hosted demo or a local stack. Everything in this guide
works the same on both.

| | Where | Setup |
|---|---|---|
| **Hosted demo** | <https://laundrix-web-five.vercel.app> | none — open it |
| **Local (Docker)** | <http://localhost:8080> | `docker compose up --build`, then `docker compose exec backend npm run seed:admin` |
| **Local (manual)** | <http://localhost:5173> | `cd backend && npm run server`, `cd frontend && npm run dev` |

To get the demo marketplace — launderers with real catalogs, customers,
coupons and orders in every status — run the second seed once:

```bash
cd backend && npm run seed:data
```

> **Two rules that trip everyone up.**
> 1. **Log in with your `username`, not your email.** The login endpoint matches
>    on username; an email returns "User not found".
> 2. **Customers must complete their profile *and then log in again*** before
>    they can place an order. The hostel is read from your session token, so it
>    only takes effect on the next login. See
>    [Troubleshooting](#troubleshooting).

<br>

## Signing in

Click **Login** in the navbar. All seeded accounts use the password
`Password@123`, except the admin.

| Role | Username | Password | What they have |
|---|---|---|---|
| Admin | `admin` | `Admin@1234` | full console |
| Launderer | `sparklewash` | `Password@123` | 6 catalog items, express ₹30 |
| Launderer | `freshfold` | `Password@123` | 6 items, express ₹20 |
| Launderer | `cleancrease` | `Password@123` | 5 dry-clean items, no express |
| Customer | `rahul_c` | `Password@123` | one reviewed order, one pending |
| Customer | `priya_c` | `Password@123` | an express order in progress, one to rate |
| Customer | `amit_c` | `Password@123` | an order awaiting pickup |
| Customer | `sneha_c` | `Password@123` | a completed, reviewed dry-clean order |

Signing up yourself is available for **customer** and **launderer** roles. There
is no public admin signup — the admin is created by `npm run seed:admin`.

Your session lives in an httpOnly cookie and lasts **24 hours**. **Logout** is in
the navbar.

<br>

## Customer

### 1. Complete your profile first

Open the navbar menu → **Profile**, and fill in **hostel**, **room number** and
**roll number**. Ordering is blocked until the hostel and roll number are set.

> After saving, **log out and log back in.** The order API reads your hostel
> from the session token, which is only reissued at login.

### 2. Choose a launderer

The dashboard lists every **admin-approved** launderer with their average
rating, number of catalog items and price range. You can search by name and
sort by **rating**, **lowest price** or **name**. Pick the one you want — the
catalog you order from is that launderer's own.

### 3. Build your order

Choose clothing items and wash types from the selected launderer's catalog and
set quantities. The running total uses that launderer's real prices.

> Only combinations that launderer actually offers can be ordered. Prices are
> recalculated on the server when you place the order, so the total you are
> charged always comes from the live catalog.

### 4. Schedule it

On the checkout screen:

- **Hand-over mode** — *Home pickup* (the launderer collects from and delivers
  to your address) or *Drop off at launderer* (you handle both ends; no address
  needed).
- **Pickup date** — today, tomorrow or the day after. The delivery date is set
  automatically to two days later.
- **Pickup and delivery time** — from the launderer's own slots if they publish
  any, otherwise the global slots the admin manages.
- **Pickup and delivery address** — only for home pickup, chosen from the
  admin-managed locations.
- **Express** — if this launderer offers it, a flat surcharge for faster
  turnaround.
- **Coupon** — type a code and press apply to preview the discount.

Seeded coupons: `WELCOME10` (10% off, min ₹100, capped at ₹50), `FLAT50`
(₹50 off, min ₹200), `SAVE20` (20% off, min ₹150, capped at ₹100).

Press **Confirm schedule**, then **Place order**.

### 5. Track and manage it

**My Orders** lists everything you've placed, filterable by status, with a
timeline per order. An order moves through:

```
placed ──▶ accepted ──▶ picked up ──▶ delivered ──▶ paid ──▶ rated
         (launderer)    (you)      (you or them)   (you)   (you)
```

Before pickup you can also:

- **Reschedule** — change pickup/delivery date or time.
- **Cancel** — withdraw the order entirely.

Both are blocked once the order has been picked up.

### 6. Pay

Open the order and press **Pay**. Razorpay's checkout opens in an overlay; the
app never sees your card details.

> The demo runs on Razorpay **test** keys. Use Razorpay's published test cards
> — see <https://razorpay.com/docs/payments/payments/test-card-details/>. Do not
> enter a real card.

### 7. Rate the launderer

Once an order is **delivered**, a **Rate** action appears: 1–5 stars and an
optional comment, up to 500 characters. One review per order, and it feeds the
launderer's average rating in the discovery list.

### Invoices and notifications

- **Invoice** on any order opens a printable breakdown — subtotal, express
  charge, discount, tax and total.
- The **bell** in the navbar shows order-update notifications, loaded when the
  page opens. Refresh to pick up new ones.

<br>

## Launderer

### 1. Get approved

A new launderer account is **not visible to customers** until an admin approves
it. Until then your dashboard works but no one can order from you. Ask an admin
to approve you (see [Admin → Approve launderers](#1-approve-launderers)).

### 2. Build your catalog

**Catalog** tab → **Add item**. Each entry is a *clothing type* + *wash type* +
*price*, for example `Shirt` / `Steam iron` / `₹25`. You can edit the price or
delete an entry at any time.

> You cannot list the same clothing-and-wash combination twice, and a price
> cannot be negative. Customers can only order combinations that exist here, so
> **an empty catalog means you cannot receive orders.**

Editing a price affects new orders only — orders already placed keep the price
captured at the time they were placed.

### 3. Set availability and express service

- **Availability** — publish your own pickup/delivery time slots. Customers
  ordering from you see these instead of the global slots. Leave it empty to
  use the global ones.
- **Express** — set a flat surcharge for express turnaround. Set it to **0** to
  stop offering express; the option then disappears from your checkout.

### 4. Fulfil orders

The **Orders** tab lists orders placed with you, with the customer's details
and the full item breakdown.

| Action | When it's available |
|---|---|
| **Accept** | while the order is still pending |
| **Reject** | any time before the customer marks it picked up |
| **Mark delivered** | after the customer has marked it picked up |

Note that **the customer marks the order picked up**, not you — that step
confirms the hand-over from their side. Rescheduling a delivery date is
available in the API (`PUT /updatedeliverydate/:order_id`) but is not yet wired
into the dashboard; ask the customer to use **Reschedule** instead.

### 5. Watch your numbers

The **Analytics** tab shows total orders, how many are pending, in progress and
delivered, revenue from paid orders, catalog size, and your average rating with
its review count.

<br>

## Admin

Log in as `admin` and you land on the admin console instead of a customer
dashboard.

### 1. Approve launderers

**Users** tab → find the launderer → **Approve**. Approval is what makes them
visible to customers and able to receive orders. **Revoke** hides them again;
existing orders are unaffected.

### 2. Manage users

From the same tab you can change any user's **role** (customer, launderer,
admin) or **delete** an account. You cannot change your own role or delete your
own account.

### 3. Manage settings

Everything that used to be hardcoded is edited here as a named list:

| Setting | What it controls |
|---|---|
| `locations` | pickup and delivery points customers can choose |
| `timeSlots` | global pickup/delivery times, used when a launderer publishes none |
| `taxPercent` | percentage added to every order total |

You can add a value, remove one, or replace a whole list. New named lists can be
created without a code change.

> `taxPercent` is stored as a list of strings like any other setting, but it is
> read as a number. Put exactly one numeric value in it — `5` means 5%.

### 4. Manage coupons

**Coupons** tab → create a code with a type (**percent** or **flat**), a value,
an optional minimum order, an optional maximum discount (percent coupons only)
and an optional expiry. Codes are uppercased and must be unique. Delete removes
a coupon from future checkouts.

### 5. Oversight and analytics

- **Orders** — every order in the system, newest first, with the customer
  attached.
- **Catalog** — every catalog item across all launderers.
- **Analytics** — users by role, total users, total orders, revenue from paid
  orders, total catalog items, and orders per launderer.

<br>

## Troubleshooting

**"User not found" when the password is definitely right.**
You are entering an email. Log in with the **username**.

**"Please update your hostel details" even though the profile is filled in.**
Log out and log back in. Your hostel is carried in the session token, which is
only reissued at login.

**"Incomplete Details" when placing an order.**
Both **hostel** and **roll number** must be set on your profile.

**No launderers in the list.**
Either none have been approved yet (an admin must approve them), or the demo
data has not been seeded — run `npm run seed:data` in `backend/`.

**A launderer appears but has nothing to order.**
Their catalog is empty. Catalog items are per launderer; a new launderer starts
with none.

**No time slots or locations in the dropdowns.**
The `timeSlots` and `locations` settings are empty. Run `npm run seed:admin`,
or add values from the admin console.

**"is not offered by this launderer" when placing an order.**
The launderer changed or removed that catalog entry after you added it to your
basket. Clear the basket and rebuild it.

**The express toggle is missing.**
That launderer has their express surcharge set to 0, which means they do not
offer it.

**Payment opens but nothing happens afterwards.**
Payment confirmation currently depends on the checkout overlay returning to the
app, so don't close the tab while it is open. If the order still shows unpaid
after a successful payment, an admin can confirm the charge in the Razorpay
dashboard.

**Everything fails with a network or 500 error on the hosted demo.**
Check the API's own health endpoints — they answer even when the database is
down:

```bash
curl https://laundrix-api-delta.vercel.app/health   # process alive?
curl https://laundrix-api-delta.vercel.app/ready    # database reachable?
```

- `/health` returns `{"status":"ok"}` — the API is running.
- `/ready` returns `200` when the database is connected, or `503` with
  `{"status":"degraded","database":"disconnected"}` when it is not. In the
  degraded state every data-backed route returns a clear 503 rather than
  failing obscurely, and sign-in will not work until the database is restored.
- If `/health` itself fails, the deployment is down rather than the database.

Run the stack locally with `docker compose up --build` in the meantime.
