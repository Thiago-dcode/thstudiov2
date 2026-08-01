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
    <section className="mx-auto w-full max-w-2xl px-6 py-16 tablet:px-10 tablet:py-24">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-10 border border-border bg-fg-2/20 p-5 tablet:p-7">
        <EmailPreferencesForm emailPreference={result.data} />
      </div>
    </section>
  );
}
