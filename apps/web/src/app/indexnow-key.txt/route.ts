import { deriveIndexNowKey } from "@repo/common-lib/utils/indexnow";
import { serverEnv } from "@/env/server";
import { isIndexableEnv } from "@/lib/seo/indexability";

/**
 * `/indexnow-key.txt` — proves to IndexNow (Bing, Yandex, Seznam…) that the API's URL submissions
 * come from the owner of a11studio.com. The API submits with `keyLocation` pointing here; the body
 * must be exactly the key. Only the canonical production origin serves it, so a dev deployment can
 * never validate a submission.
 */
export const dynamic = "force-dynamic";

export function GET() {
  if (!isIndexableEnv()) return new Response("Not Found", { status: 404 });
  return new Response(deriveIndexNowKey(serverEnv.APP_TOKEN), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
