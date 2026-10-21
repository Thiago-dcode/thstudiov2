import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  DISCIPLINE_LANDING_KEYS,
  disciplineLandingPath,
} from "@/modules/landings/discipline-landings";
import { WebSection } from "./web-section";

/**
 * Links from the homepage body into every discipline landing (`/for/photographers`, …). The footer
 * link alone passes little weight; a contextual link with descriptive anchor text from the most
 * linked page on the site is what tells search engines the landing matters.
 */
export async function DisciplineLandingsSection() {
  const t = await getTranslations("landing.disciplines");

  return (
    <WebSection id="disciplines" className="border-t border-fg-2">
      <WebSection.Container className="px-6 py-20 tablet:px-10 tablet:py-28">
        <WebSection.Header
          badge={t("header.badge")}
          title={t("header.title")}
          description={t("header.description")}
        />
        <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-8">
          {DISCIPLINE_LANDING_KEYS.map((key) => (
            <li key={key} className="w-full min-w-0 tablet:w-[calc(50%-1rem)]">
              <Link
                href={disciplineLandingPath(key)}
                className="group flex h-full flex-col gap-3 border border-fg-2 p-8 transition-colors hover:border-border-em focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <h3 className="font-serif text-xl font-semibold tracking-tight text-text">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {t(`items.${key}.description`)}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-medium tracking-wider text-text">
                  {t(`items.${key}.cta`)}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </WebSection.Container>
    </WebSection>
  );
}
