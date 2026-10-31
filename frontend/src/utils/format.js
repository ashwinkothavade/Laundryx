// Shared display formatters.
//
// Each of these existed inline, differently, in several components, which is
// why the same order list could show "2026-10-11" next to "Tue, 27 Oct 2026",
// totals as ₹157.5 next to ₹273, and one screen used a dollar sign.

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? INR.format(n) : '—';
};

// Order dates are stored as strings, and not all in the same shape: the
// seeded data is ISO ("2026-10-11") while the UI writes a display string
// ("Tue, 27 Oct 2026"). Parse either and render one way, rather than printing
// whatever happens to be in the field.
export const formatDate = (value) => {
  if (!value) return '—';
  const raw = String(value).trim();
  if (raw === '-- -- --') return '—';

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw; // unknown shape: show it as-is
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// A 24-character ObjectId is not a reference a person can read back over the
// phone. Show a short tail; the full id stays available via `title`.
export const shortOrderRef = (id) =>
  id ? `#${String(id).slice(-6).toUpperCase()}` : '—';

// One lifecycle position instead of two independent booleans. The admin
// console already presents orders this way.
export const orderStatus = (order) => {
  if (!order) return { label: '—', scheme: 'gray' };
  if (order.deliveredStatus) return { label: 'Delivered', scheme: 'green' };
  if (order.pickUpStatus) return { label: 'Picked up', scheme: 'blue' };
  if (order.acceptedStatus) return { label: 'Accepted', scheme: 'orange' };
  return { label: 'Pending', scheme: 'gray' };
};

export const paidStatus = (order) =>
  order?.paid
    ? { label: 'Paid', scheme: 'green' }
    : { label: 'Unpaid', scheme: 'red' };
