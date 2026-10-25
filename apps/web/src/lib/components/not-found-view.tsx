import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { localePrefix, type SupportedLocale } from "@/i18n/routing";

const nextSteps = [
  { path: "/for/photographers", key: "forPhotographers" },
  { path: "/support", key: "support" },
] as const;

/**
 * The site's one "page not found" content, shared by `app/[locale]/not-found.tsx` (inside the
 * localized chrome) and `app/not-found.tsx` (invalid-locale and unmatched non-locale URLs, which
 * have no locale context). Hence the explicit `locale` and plain `next/link` hrefs built with
 * {@link localePrefix} rather than the i18n `Link`. Resource-neutral copy on purpose: a missing
 * artist, portfolio or page all land here. Never fetches, so scanner 404s stay cheap.
 */
export async function NotFoundView({ locale }: { locale: SupportedLocale }) {
  const t = await getTranslations({ locale, namespace: "notFoundPage" });
  const prefix = localePrefix(locale);

  return (
    <section className="mx-auto w-full max-w-xl px-6 py-20 tablet:py-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
        {t("eyebrow")}
      </p>
      <h1 className="mt-6 font-serif text-3xl tracking-tight text-text tablet:text-4xl">
        {t("heading")}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-text-muted">
        {t("body")}
      </p>

      <Link
        href={prefix || "/"}
        className="mt-10 inline-flex min-h-11 items-center border border-text bg-text px-7 py-3 text-xs uppercase tracking-[0.15em] text-bg transition-colors duration-300 hover:bg-text/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        {t("home")}
      </Link>

      <div className="mt-14 h-px w-8 bg-border" aria-hidden />

      <nav aria-labelledby="not-found-next-steps" className="mt-8">
        <p
          id="not-found-next-steps"
          className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted"
        >
          {t("nextSteps")}
        </p>
        <ul className="mt-4 flex flex-col border-t border-border">
          {nextSteps.map((step) => (
            <li key={step.path} className="border-b border-border">
              <Link
                href={`${prefix}${step.path}`}
                className="group flex min-h-11 items-center justify-between gap-6 px-2 py-4 transition-colors hover:bg-fg-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium tracking-wider text-text">
                    {t(step.key)}
                  </span>
                  <span className="text-sm leading-relaxed text-text-muted">
                    {t(`${step.key}Body`)}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-text-muted transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
