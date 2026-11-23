import { EditorialHeader } from "@repo/ui/components/custom/editorial";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import emailPreferencesService from "@/modules/email-preferences/email-preferences.service";
import { EmailPreferencesForm } from "./_components/email-preferences-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("emailPreferences.metadata");

  return {
    title: { absolute: t("title") },
    description: t("description"),
    // One-time token URL: never indexable. robots.txt disallows /email-preferences too, but
    // Disallow only stops the crawl — this is what actually keeps a shared link out of the index.
    robots: { index: false, follow: false },
  };
}

export default async function EmailPreferencesPage({
  params,
}: {
  params: Promise<{ token?: string }>;
}) {
  const t = await getTranslations("emailPreferences.page");
  const { token } = await params;

  if (!token) {
    await redirect("/");
    return;
  }

  const result = await emailPreferencesService.getByToken(token);

  if (result.error || !result.data) {
    await redirect("/");
    return;
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-20 tablet:px-10 tablet:py-28">
      <EditorialHeader
        as="h1"
        align="stack"
        rule={false}
        size="section"
        label={t("eyebrow")}
        title={t("title")}
        standfirst={t("subtitle")}
      />

      <div className="mt-14 border-t border-border pt-10">
        <EmailPreferencesForm emailPreference={result.data} />
      </div>
    </section>
  );
}
