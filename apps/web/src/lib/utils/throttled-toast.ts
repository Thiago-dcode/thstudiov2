import { toast } from "@repo/ui/sonner";

const DEFAULT_THROTTLE_MS = 5000;
const lastShownAt = new Map<string, number>();

export function toastErrorThrottled(
  message: string,
  intervalMs = DEFAULT_THROTTLE_MS,
) {
  const now = Date.now();
  const last = lastShownAt.get(message) ?? 0;
  if (now - last < intervalMs) return;

  lastShownAt.set(message, now);
  toast.error(message);
}
