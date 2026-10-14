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
    <section className="mx-auto w-full max-w-3xl px-6 py-16 tablet:px-10 tablet:py-24">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {t("label")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm! leading-relaxed text-text-muted">
          {t("description")}
        </p>
        <p className="max-w-2xl text-xs! leading-relaxed text-text-muted">
          {t("emergency")}
        </p>
      </div>

      <div className="mt-10 border border-border bg-fg-2/20 p-5 tablet:p-7">
        <ReportForm initialUrl={safeInitialUrl(url)} />
      </div>
    </section>
  );
}
