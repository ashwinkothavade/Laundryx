import { useCallback, useRef, useState } from 'react';

// Tracks which action is in flight, so a button can show progress and the
// user is not left wondering whether their click registered.
//
// Two problems this solves together. Most buttons fired a request with no
// visible change at all — on a cold serverless start that is a second or more
// of apparent nothing, and people click again. And because nothing was
// disabled, that second click sent a second request: a duplicate order, a
// double payment attempt, two identical catalog items.
//
//   const { run, isPending, busy } = useAsyncAction();
//   <Button
//     isLoading={isPending(`accept-${order._id}`)}
//     isDisabled={busy}
//     onClick={() => run(`accept-${order._id}`, () => acceptOrder(order._id))}
//   >
//
// The key identifies one button, so only the clicked row spins; `busy` is
// true while any action runs, which is what blocks the double-submit.
export const useAsyncAction = () => {
  const [pending, setPending] = useState(null);
  // A ref as well as state: state updates are async, so two clicks in the
  // same tick would both see `pending === null` and both proceed.
  const inFlight = useRef(false);

  const run = useCallback(async (key, fn) => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setPending(key);
    try {
      return await fn();
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }, []);

  const isPending = useCallback((key) => pending === key, [pending]);

  return { run, isPending, busy: pending !== null, pending };
};

export default useAsyncAction;
