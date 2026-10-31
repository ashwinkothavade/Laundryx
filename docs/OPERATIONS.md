# Operations

How to tell whether LaundriX is healthy, find the record of a request someone
is complaining about, and verify that every user journey still works.

- [Is it up?](#is-it-up)
- [Finding one request](#finding-one-request)
- [Reading the logs](#reading-the-logs)
- [Verifying the flows](#verifying-the-flows)
- [When something is wrong](#when-something-is-wrong)

<br>

## Is it up?

Two endpoints, neither of which requires a session. They are deliberately
registered ahead of the database guard, so they still answer when MongoDB does
not.

```bash
curl https://laundrix-api-delta.vercel.app/health   # process liveness
curl https://laundrix-api-delta.vercel.app/ready    # can it serve traffic?
```

| Endpoint | Meaning |
|---|---|
| `GET /health` | `{"status":"ok","uptime":N}` — the process is running. Touches nothing. |
| `GET /ready` | **200** `{"status":"ready","database":"connected"}` when it can serve, **503** `{"status":"degraded","database":"disconnected"}` when it cannot. Also reports `mongoUriConfigured`. |

While degraded, every data-backed route returns a 503 naming the cause rather
than a slow, generic 500. The API does **not** exit when the database is
unreachable — it stays up, keeps answering `/health`, and reconnects when the
database returns.

<br>

## Finding one request

Every request is given an id — or adopts an inbound `x-request-id` if a proxy
set one — and that id appears in three places:

1. the **`x-request-id` response header** on every response,
2. the **access log line** for that request,
3. the **error body** (`{"message":"Internal Server Error","requestId":"…"}`)
   and the error log entry, if it failed.

So a user who reports "it broke" can be asked for the id, and it is findable:

```bash
# Vercel
vercel logs laundrix-api --since 1h | grep <request-id>
```

Without this, a failure report gave you a method and a path shared by every
other user that hour.

<br>

## Reading the logs

Winston, through one logger. Colourised and human-readable in development,
**JSON in production** so a log drain can query it. Morgan's HTTP lines flow
through the same logger at the `http` level. Everything is silent under test.

| Level | What goes there |
|---|---|
| `error` | anything reaching the central error handler, failed database connections, payment validation failures |
| `warn` | rejected webhook signatures, blocked cross-tenant access, requests served while the database is down |
| `info` | database connected, order marked paid by webhook, seeding |
| `http` | one line per request: method, path, status, duration, request id |
| `debug` | development default |

Set the floor with `LOG_LEVEL` (defaults to `info` in production, `debug`
otherwise).

A blocked authorization attempt logs who was refused and for what, which is
the line to look for when investigating abuse:

```
[warn] Blocked launderer sparklewash from PUT /acceptorder/<id> on an order they are not party to
```

<br>

## Verifying the flows

`npm run verify` drives the real HTTP API the way each role's UI does, from
end to end. The unit suite proves handlers behave; this proves the journeys
still join up.

```bash
cd backend
npm run verify                                        # http://localhost:4000
node scripts/verifyFlows.js --url https://laundrix-api-delta.vercel.app
node scripts/verifyFlows.js --keep                    # skip cleanup
node scripts/verifyFlows.js --log /tmp/flows.log      # choose the log file
```

It needs admin credentials, taken from `ADMIN_USERNAME` / `ADMIN_PASSWORD`
(defaults `admin` / `Admin@1234`).

**What it covers**

| Flow | Steps |
|---|---|
| Service health | `/health`, `/ready` reports a live database |
| Admin | sign in, analytics, locations and time slots configured |
| Launderer onboarding | register, hidden until approved, **cannot self-approve**, admin approves, publish catalog, publish availability and express pricing, becomes visible |
| Customer ordering | register, read options, complete profile and re-sign-in, read catalog, **order priced by the server not the client**, appears in their list, reschedule |
| Fulfilment | launderer sees and accepts, customer confirms pickup, launderer delivers, customer rates, rating reaches the directory |
| Notifications | customer messages their launderer, launderer receives it |
| Guards | anonymous payment refused, client-set price refused, admin routes refused, removed user listing stays removed, **cross-tenant order control refused** |
| Cleanup | removes everything the run created, and fails if anything is left |

Each step is timed, printed, and appended to `backend/flow-verification.log`
with timestamps and a `SUMMARY` line. The process **exits non-zero** if any
step fails, so it can gate a deploy.

Everything it creates is prefixed `vf_` and uniquely suffixed per run, so
concurrent runs do not collide and leftovers are obvious.

<br>

## When something is wrong

| Symptom | Likely cause | What to do |
|---|---|---|
| `/health` 200, `/ready` 503 `disconnected` | database unreachable | check the Atlas cluster is alive and `MONGO_URI` is right |
| `/ready` says `mongoUriConfigured: false` | env var missing on the deployment | set `MONGO_URI`, redeploy |
| every route 500 `FUNCTION_INVOCATION_FAILED`, `/health` included | the function is crashing at import | read the Vercel build and runtime logs |
| orders paid in Razorpay but showing unpaid | the webhook is not configured or was disabled | check `RAZORPAY_WEBHOOK_SECRET` is set and the endpoint is enabled in the Razorpay dashboard — Razorpay disables an endpoint that fails for 24 hours |
| a specific user's action failed | — | ask for the request id and grep the logs |

See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting-a-down-deployment) for the
deployment-level runbook.
