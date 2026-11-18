"use client";

import { normalizeUsername } from "@repo/common-lib/utils/username";
import { useCallback, useState } from "react";

/**
 * Usernames the server already refused while this form is mounted, with the message it gave.
 * Asking again for the same one would only repeat the same API call and the same answer, so the
 * form shows the remembered message and blocks submitting it instead.
 */
export const useRejectedUsernames = () => {
  const [rejected, setRejected] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  const remember = useCallback((username: unknown, message?: string) => {
    if (typeof username !== "string" || !message) return;
    const key = normalizeUsername(username);
    if (!key) return;
    setRejected((prev) => {
      if (prev.get(key) === message) return prev;
      const next = new Map(prev);
      next.set(key, message);
      return next;
    });
  }, []);

  const rejectionFor = useCallback(
    (username?: string | null) =>
      username ? rejected.get(normalizeUsername(username)) : undefined,
    [rejected],
  );

  return { remember, rejectionFor };
};
