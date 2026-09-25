import { useEffect, useRef, useState } from "react";

export function useRetryCountdown(retryAt?: number) {
  const [remaining, setRemaining] = useState(0);
  const deadline = useRef(0);
  useEffect(() => {
    // A failed verification must not cancel an existing resend cooldown.
    if (retryAt) deadline.current = Math.max(deadline.current, retryAt);
    const update = () =>
      setRemaining(
        Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
      );
    update();
    if (!deadline.current) return;
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  return remaining;
}
