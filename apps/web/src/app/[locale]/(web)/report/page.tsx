import { EditorialHeader } from "@repo/ui/components/custom/editorial";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { ReportForm } from "./_components/report-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("report.metadata");
  return buildStaticPageMetadata({
    path: "/report",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
  });
}

/** Only links to this site are prefilled; anything else is ignored rather than echoed. */
function safeInitialUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const app = new URL(serverEnv.APP_URL);
    const host = (h: string) => h.replace(/^www\./, "");
    return host(url.host) === host(app.host) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** DSA art. 16 notice-and-action page: anyone can report content they believe is illegal. */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const [{ url }, t] = await Promise.all([
    searchParams,
    getTranslations("report"),
  ]);

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 tablet:px-10 tablet:py-28">
      <EditorialHeader
        as="h1"
        align="stack"
        rule={false}
        label={t("label")}
        title={t("title")}
        standfirst={t("description")}
      >
        <p className="max-w-xl text-sm! leading-relaxed text-text-muted">
          {t("emergency")}
        </p>
      </EditorialHeader>

      <div className="mt-14 border-t border-border pt-10 tablet:mt-16">
        <ReportForm initialUrl={safeInitialUrl(url)} />
      </div>
    </section>
  );
}
