import "server-only";
import type { ApiResponse } from "@repo/common-lib/types/response";

/**
 * Landing sections hide themselves when they have nothing to render. That is correct for genuinely
 * empty data and wrong for a failed request: because `FetchApi` folds a non-OK response into
 * `{ data: null, error }`, a throttled or unreachable API looked exactly like "no featured artists"
 * and silently deleted whole sections from the page — and from what crawlers saw — with no signal.
 *
 * Call this before the empty check so a failure is attributable to a section. The section still
 * hides rather than rendering broken chrome on the marketing page; what changes is that the failure
 * is now visible in the logs instead of being indistinguishable from an empty result.
 */
export function reportSectionError(
  section: string,
  response: Pick<ApiResponse<unknown>, "error">,
): void {
  if (!response.error) return;
  console.error(
    `[landing:${section}] section hidden — API request failed`,
    response.error,
  );
}
