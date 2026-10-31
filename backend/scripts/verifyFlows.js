#!/usr/bin/env node

//
// End-to-end flow verification.
//
// Drives the real HTTP API the way each role's UI does, start to finish, and
// reports what worked. The unit suite proves handlers behave; this proves the
// journeys still join up — that a customer can get from signup to a rated
// order, a launderer from unapproved to paid, and an admin through the
// console — against a real server and a real database.
//
//   node scripts/verifyFlows.js                       # http://localhost:4000
//   node scripts/verifyFlows.js --url https://...     # any deployment
//   node scripts/verifyFlows.js --keep                # skip cleanup
//
// Exits non-zero if any step fails, so it can gate a deploy.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = argOf(
  '--url',
  process.env.VERIFY_URL || 'http://localhost:4000'
).replace(/\/$/, '');
const KEEP = args.includes('--keep');
const RUN_ID = Date.now().toString(36);
const LOG_PATH = argOf(
  '--log',
  path.join(__dirname, '..', 'flow-verification.log')
);

const stream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
const C = {
  ok: '\x1b[32m',
  bad: '\x1b[31m',
  dim: '\x1b[90m',
  warn: '\x1b[33m',
  off: '\x1b[0m',
};

const write = (line) => {
  stream.write(`${new Date().toISOString()} ${line}\n`);
};
const log = (line, colour = '') => {
  console.log(`${colour}${line}${C.off}`);

  write(
    line.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '')
  );
};

const results = [];
let currentFlow = 'startup';

const flow = (name) => {
  currentFlow = name;
  log(`\n── ${name} ${'─'.repeat(Math.max(0, 58 - name.length))}`, C.dim);
};

// Every step records its outcome instead of throwing, so one failure does not
// hide the state of everything after it.
const step = async (name, fn) => {
  const started = Date.now();
  try {
    const value = await fn();
    const ms = Date.now() - started;
    results.push({ flow: currentFlow, name, ok: true, ms });
    log(`  ✓ ${name.padEnd(52)} ${ms}ms`, C.ok);
    return value;
  } catch (err) {
    const ms = Date.now() - started;
    results.push({
      flow: currentFlow,
      name,
      ok: false,
      ms,
      error: err.message,
    });
    log(`  ✗ ${name.padEnd(52)} ${ms}ms`, C.bad);
    log(`      ${err.message}`, C.bad);
    return null;
  }
};

// --- HTTP ------------------------------------------------------------------

const jar = new Map(); // role -> cookie string

const call = async (role, method, route, body) => {
  const headers = { 'content-type': 'application/json' };
  if (jar.has(role)) headers.cookie = jar.get(role);

  const res = await fetch(`${BASE}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) jar.set(role, setCookie.split(';')[0]);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return {
    status: res.status,
    data,
    requestId: res.headers.get('x-request-id'),
  };
};

const expect = (res, allowed, what) => {
  const ok = (Array.isArray(allowed) ? allowed : [allowed]).includes(
    res.status
  );
  if (!ok) {
    const detail =
      typeof res.data === 'object'
        ? JSON.stringify(res.data).slice(0, 180)
        : String(res.data).slice(0, 180);
    throw new Error(
      `${what}: expected ${allowed}, got ${res.status}${res.requestId ? ` [req ${res.requestId}]` : ''} ${detail}`
    );
  }
  return res.data;
};

// --- fixtures --------------------------------------------------------------

const PASSWORD = 'Verify@1234';
const names = {
  customer: `vf_cust_${RUN_ID}`,
  launderer: `vf_laund_${RUN_ID}`,
};
const phone = (n) =>
  `+91${String(7000000000 + (Date.now() % 1000000) * 10 + n).slice(0, 10)}`;
const created = { users: [], orders: [] };

const ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'Admin@1234',
};

// --- the flows -------------------------------------------------------------

const cleanup = async () => {
  if (KEEP) {
    log(
      `\nleaving ${created.users.length} user(s) and ${created.orders.length} order(s) behind (--keep)`,
      C.warn
    );
    return;
  }
  flow('Cleanup');
  await step('removes everything this run created', async () => {
    await created.orders.reduce(
      (chain, id) =>
        chain.then(() =>
          call('customer', 'DELETE', `/student/deleteorder/${id}`)
        ),
      Promise.resolve()
    );
    await created.users.reduce(
      (chain, id) =>
        chain.then(() => call('admin', 'DELETE', `/admin/users/${id}`)),
      Promise.resolve()
    );
    const users = expect(
      await call('admin', 'GET', '/admin/users'),
      200,
      'admin users'
    );
    const leftover = users.users.filter((u) => u.username.startsWith('vf_'));
    if (leftover.length)
      throw new Error(`${leftover.length} test user(s) left behind`);
  });
};

const finish = () => {
  const failed = results.filter((r) => !r.ok);
  const total = results.length;
  log(`\n${'─'.repeat(62)}`, C.dim);
  if (failed.length === 0) {
    log(`All ${total} steps passed.`, C.ok);
  } else {
    log(`${failed.length} of ${total} steps FAILED:`, C.bad);
    failed.forEach((f) => log(`  ${f.flow} → ${f.name}: ${f.error}`, C.bad));
  }
  write(
    `SUMMARY run=${RUN_ID} target=${BASE} total=${total} failed=${failed.length}`
  );
  stream.end();
  process.exitCode = failed.length ? 1 : 0;
};

const run = async () => {
  log(`\nLaundriX flow verification`, C.dim);
  log(`target ${BASE}   run ${RUN_ID}   log ${LOG_PATH}`, C.dim);

  flow('Service health');
  await step('GET /health answers', async () => {
    expect(await call('anon', 'GET', '/health'), 200, '/health');
  });
  const ready = await step('GET /ready reports a live database', async () => {
    const d = expect(await call('anon', 'GET', '/ready'), 200, '/ready');
    if (d.database !== 'connected')
      throw new Error(`database is ${d.database}`);
    return d;
  });
  if (!ready) {
    log('\nDatabase unreachable — the remaining flows cannot run.', C.bad);
    return finish();
  }

  flow('Admin');
  await step('admin signs in', async () => {
    const d = expect(
      await call('admin', 'POST', '/login', ADMIN),
      200,
      'admin login'
    );
    if (d.role !== 'admin') throw new Error(`role is ${d.role}`);
  });
  await step('sees the marketplace analytics', async () => {
    const d = expect(
      await call('admin', 'GET', '/admin/analytics'),
      200,
      'analytics'
    );
    if (typeof d.analytics?.totalOrders !== 'number')
      throw new Error('no totals');
  });
  await step('settings carry locations and time slots', async () => {
    const d = expect(await call('admin', 'GET', '/settings'), 200, 'settings');
    if (!d.settings?.locations?.length)
      throw new Error('no locations configured');
    if (!d.settings?.timeSlots?.length)
      throw new Error('no time slots configured');
    return d.settings;
  });

  flow('Launderer onboarding');
  const laundererId = await step('registers', async () => {
    const d = expect(
      await call('launderer', 'POST', '/signup', {
        username: names.launderer,
        email: `${names.launderer}@verify.test`,
        password: PASSWORD,
        role: 'launderer',
        phone_number: phone(1),
      }),
      201,
      'launderer signup'
    );
    if (d.password) throw new Error('signup echoed the password hash');
    const users = expect(
      await call('admin', 'GET', '/admin/users'),
      200,
      'admin users'
    );
    const row = users.users.find((u) => u.username === names.launderer);
    if (!row) throw new Error('new launderer not listed');
    created.users.push(row._id);
    return row._id;
  });
  await step('is hidden from customers until approved', async () => {
    const d = expect(
      await call('launderer', 'GET', '/launderers/directory'),
      200,
      'directory'
    );
    if (d.launderers.some((l) => l.username === names.launderer)) {
      throw new Error('unapproved launderer is visible');
    }
  });
  await step('cannot approve itself', async () => {
    await call('launderer', 'PATCH', '/user', { approved: true });
    const users = expect(
      await call('admin', 'GET', '/admin/users'),
      200,
      'admin users'
    );
    const row = users.users.find((u) => u.username === names.launderer);
    if (row.approved) throw new Error('launderer self-approved');
  });
  await step('admin approves it', async () => {
    expect(
      await call('admin', 'PATCH', `/admin/users/${laundererId}/approval`, {
        approved: true,
      }),
      200,
      'approval'
    );
  });
  const item = { clothingType: `Shirt-${RUN_ID}`, washType: 'Wash', price: 60 };
  await step('publishes a catalog item', async () => {
    expect(
      await call('launderer', 'POST', '/catalog', item),
      201,
      'catalog add'
    );
  });
  await step('publishes time slots and express pricing', async () => {
    const slots = expect(
      await call('admin', 'GET', '/settings/timeSlots'),
      200,
      'slots'
    ).values;
    expect(
      await call('launderer', 'PUT', '/launderer/availability', {
        timeSlots: slots,
      }),
      200,
      'availability'
    );
    expect(
      await call('launderer', 'PUT', '/launderer/express', {
        expressSurcharge: 25,
      }),
      200,
      'express'
    );
  });
  await step('now appears to customers', async () => {
    const d = expect(
      await call('launderer', 'GET', '/launderers/directory'),
      200,
      'directory'
    );
    if (!d.launderers.some((l) => l.username === names.launderer)) {
      throw new Error('approved launderer is still hidden');
    }
  });

  flow('Customer ordering');
  await step('registers', async () => {
    expect(
      await call('customer', 'POST', '/signup', {
        username: names.customer,
        email: `${names.customer}@verify.test`,
        password: PASSWORD,
        role: 'customer',
        phone_number: phone(2),
      }),
      201,
      'customer signup'
    );
    const users = expect(
      await call('admin', 'GET', '/admin/users'),
      200,
      'admin users'
    );
    created.users.push(
      users.users.find((u) => u.username === names.customer)._id
    );
  });
  const settings = await step(
    'reads the ordering options',
    async () =>
      expect(await call('customer', 'GET', '/settings'), 200, 'settings')
        .settings
  );
  await step('completes their profile, then signs in again', async () => {
    expect(
      await call('customer', 'PATCH', '/user', {
        hostel: settings.locations[0],
        room_number: '101',
        roll_number: `VF${RUN_ID}`,
      }),
      200,
      'profile'
    );
    // The hostel rides in the token, so it only takes effect on re-login.
    expect(
      await call('customer', 'POST', '/login', {
        username: names.customer,
        password: PASSWORD,
      }),
      200,
      'relogin'
    );
  });
  await step("reads the launderer's catalog", async () => {
    const d = expect(
      await call('customer', 'GET', `/catalog/launderer/${names.launderer}`),
      200,
      'catalog'
    );
    if (!d.items.length) throw new Error('catalog is empty');
  });
  const orderId = await step(
    'places an order priced by the server',
    async () => {
      const d = expect(
        await call('customer', 'POST', '/student/createorder', {
          launderer: names.launderer,
          items: [
            {
              name: item.clothingType,
              washType: item.washType,
              quantity: 2,
              pricePerItem: 1,
            },
          ],
          pickupDate: 'Mon, 1 Jan 2035',
          pickupTime: settings.timeSlots[0],
          deliveryDate: 'Wed, 3 Jan 2035',
          deliveryTime: settings.timeSlots[0],
          pickupAddress: settings.locations[0],
          deliveryAddress: settings.locations[0],
        }),
        201,
        'create order'
      );
      // 2 x 60 = 120, regardless of the pricePerItem the client sent.
      if (d.order.subtotal !== 120)
        throw new Error(`client price honoured: subtotal ${d.order.subtotal}`);
      created.orders.push(d.order._id);
      return d.order._id;
    }
  );
  await step('sees it in their own order list', async () => {
    const d = expect(
      await call('customer', 'GET', '/student/orders'),
      200,
      'orders'
    );
    if (!d.orders.some((o) => o._id === orderId))
      throw new Error('order missing');
  });
  await step('reschedules before pickup', async () => {
    expect(
      await call('customer', 'PUT', `/student/reschedule/${orderId}`, {
        pickupTime: settings.timeSlots[0],
      }),
      200,
      'reschedule'
    );
  });

  flow('Fulfilment');
  await step('launderer sees the order', async () => {
    const d = expect(
      await call('launderer', 'GET', '/allorders'),
      200,
      'allorders'
    );
    if (!d.orders.some((o) => o._id === orderId))
      throw new Error('order not in queue');
  });
  await step('launderer accepts it', async () => {
    expect(
      await call('launderer', 'PUT', `/acceptorder/${orderId}`),
      200,
      'accept'
    );
  });
  await step('customer confirms pickup', async () => {
    expect(
      await call('customer', 'PUT', `/student/updatepickupstatus/${orderId}`),
      200,
      'pickup'
    );
  });
  await step('launderer marks it delivered', async () => {
    expect(
      await call('launderer', 'PUT', `/updatedeliveredstatus/${orderId}`),
      200,
      'delivered'
    );
  });
  await step('customer rates the launderer', async () => {
    expect(
      await call('customer', 'POST', '/reviews', {
        orderId,
        rating: 5,
        comment: 'Flow verification',
      }),
      201,
      'review'
    );
  });
  await step('the rating reaches the public directory', async () => {
    const d = expect(
      await call('customer', 'GET', '/launderers/directory'),
      200,
      'directory'
    );
    const row = d.launderers.find((l) => l.username === names.launderer);
    if (!row || row.reviewCount < 1) throw new Error('review not reflected');
  });

  flow('Notifications');
  await step('customer messages the launderer they ordered from', async () => {
    expect(
      await call('customer', 'POST', '/notifications', {
        launderer: names.launderer,
        message: 'Flow verification note',
      }),
      201,
      'notify'
    );
  });
  await step('launderer receives it', async () => {
    const d = expect(
      await call('launderer', 'GET', '/notifications'),
      200,
      'notifications'
    );
    if (!d.notifications.some((n) => n.message === 'Flow verification note')) {
      throw new Error('notification not delivered');
    }
  });

  flow('Guards still hold');
  await step('payment endpoints refuse anonymous callers', async () => {
    expect(
      await call('anon2', 'POST', '/payment', { orderId }),
      401,
      'anon payment'
    );
    expect(
      await call('anon2', 'PUT', '/payment/validate', {}),
      401,
      'anon validate'
    );
  });
  await step('a customer cannot name their own price', async () => {
    expect(
      await call('customer', 'POST', '/payment', {
        amount: 1,
        currency: 'INR',
      }),
      400,
      'price tamper'
    );
  });
  await step('a customer cannot reach admin routes', async () => {
    expect(await call('customer', 'GET', '/admin/users'), 403, 'admin reach');
  });
  await step('the removed user listing stays removed', async () => {
    expect(await call('customer', 'GET', '/users'), 404, 'GET /users');
  });
  await step("a launderer cannot drive another launderer's order", async () => {
    const other = `vf_rival_${RUN_ID}`;
    expect(
      await call('rival', 'POST', '/signup', {
        username: other,
        email: `${other}@verify.test`,
        password: PASSWORD,
        role: 'launderer',
        phone_number: phone(3),
      }),
      201,
      'rival signup'
    );
    const users = expect(
      await call('admin', 'GET', '/admin/users'),
      200,
      'admin users'
    );
    created.users.push(users.users.find((u) => u.username === other)._id);
    expect(
      await call('rival', 'PUT', `/acceptorder/${orderId}`),
      403,
      'cross-tenant accept'
    );
  });

  flow('Signing out');
  await step('ends the session server-side', async () => {
    expect(await call('customer', 'GET', '/logout'), 200, 'logout');
    // The cookie should no longer authenticate anything.
    expect(await call('customer', 'GET', '/me'), 401, 'post-logout /me');
  });
  await step('customer signs back in for cleanup', async () => {
    expect(
      await call('customer', 'POST', '/login', {
        username: names.customer,
        password: PASSWORD,
      }),
      200,
      'relogin'
    );
  });

  await cleanup();
  return finish();
};

run().catch((err) => {
  log(`\nverification aborted: ${err.message}`, C.bad);
  write(`ABORTED ${err.stack}`);
  stream.end();
  process.exitCode = 1;
});
