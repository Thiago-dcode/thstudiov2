import type { UserAuth } from "@/modules/auth/auth.types";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

/**
 * The bearer token for browser-direct API calls.
 *
 * It lives in an httpOnly, AES-encrypted cookie, so the only way to reach it from the browser
 * is the `userSession` server action — the same one `useSession`/`useWebsocket` already use to
 * authenticate the socket connection, so nothing new is exposed here.
 *
 * The result is memoized because that action is a network round trip and would otherwise run
 * once per API call. The memo is a *promise*, so concurrent callers share a single in-flight
 * request rather than racing several.
 *
 * The memo outlives the session it describes, which is what makes the clearing below load
 * bearing. Sign-in and sign-out both navigate with `router.push`, so the module instance — and
 * this variable — survives the transition; only a hard reload would drop it. Left uncleared,
 * the *previous* account's bearer token keeps being sent while `useSession` (which re-reads
 * the cookie on every mount) already reports the *new* account's id. Every caller of
 * `clearClientAuthToken` exists to close that window; do not remove them.
 */
let pending: Promise<UserAuth | null> | null = null;

/**
 * When the memo was populated. Same-tab transitions clear it explicitly, but a sign-in in
 * *another* tab swaps the cookie with no signal this one can observe (it is httpOnly, so there
 * is nothing to read and no `storage` event to listen for). Without an upper bound that tab
 * would keep authenticating as the previous account indefinitely; with one it self-corrects on
 * the next call past the window, at a cost of one server action per tab per minute.
 */
let resolvedAt = 0;
const MEMO_TTL_MS = 60_000;

const resolveSession = (): Promise<UserAuth | null> => {
  if (pending && Date.now() - resolvedAt < MEMO_TTL_MS) return pending;

  const attempt = userSession().catch(() => null);
  pending = attempt;
  resolvedAt = Date.now();

  // A `null` result is never kept: it means either "signed out" or a transient failure of the
  // server action, and caching the latter would pin every later request to an empty
  // Authorization header for the rest of the page's life.
  void attempt.then((session) => {
    if (!session && pending === attempt) pending = null;
  });

  return attempt;
};

export const getClientAuthToken = async (): Promise<string | null> =>
  (await resolveSession())?.token ?? null;

/**
 * Re-reads the session cookie after a 401, and returns whatever token replaced `staleToken`.
 *
 * `proxy.ts` silently rotates the token ~10 minutes before it expires, so a long-lived tab's
 * memo can be a generation behind what the API will accept. The `=== staleToken` check is what
 * makes this safe under concurrency: N parallel uploads that all 401 on the same token trigger
 * exactly one re-read, and callers that arrive after the refresh see the new token instead of
 * discarding it.
 *
 * Returning the same token means nothing rotated — the 401 was genuine, not staleness.
 */
export const refreshClientAuthToken = async (
  staleToken: string | null,
): Promise<string | null> => {
  const current = await resolveSession();
  if ((current?.token ?? null) === staleToken) {
    pending = null;
  }
  return await getClientAuthToken();
};

/** Drops the memo outright — for sign-out, where the next call must not reuse a dead token. */
export const clearClientAuthToken = () => {
  pending = null;
};
