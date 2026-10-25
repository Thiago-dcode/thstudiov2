import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NotFoundView } from "@/lib/components/not-found-view";
import { WebFooter } from "@/lib/components/web-footer";
import { resolveLocale } from "@/lib/seo/core";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { WebHeader } from "./(web)/_components/web-header";

/**
 * The branded, localized 404 for every `notFound()` under a valid locale (missing artist, portfolio,
 * media, gated directory, the `[...rest]` catch-all). It renders outside the route-group layouts, so
 * it brings the web chrome itself, mirroring `(web)/layout.tsx`. The footer skips the directory
 * lookup so a 404 never calls the API. No `robots`/`alternates`: Next injects `noindex` on a 404 and
 * the site-wide noindex from the locale layout stays in force.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: await getLocale(),
    namespace: "notFoundPage",
  });
  return { title: t("metaTitle") };
}

export default async function LocaleNotFound() {
  const [session, requested] = await Promise.all([userSession(), getLocale()]);

  return (
    <div className="flex min-h-screen flex-col w-full">
      <WebHeader session={session} />
      <main className="flex-1 w-full pt-20">
        <NotFoundView locale={resolveLocale(requested)} />
      </main>
      <WebFooter directoryLinks={false} />
    </div>
  );
}
