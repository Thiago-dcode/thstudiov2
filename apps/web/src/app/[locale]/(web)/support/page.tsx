import { EditorialHeader } from "@repo/ui/components/custom/editorial";
import { MailWarning } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { buildSupportPageJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { SupportForm } from "./_components/support-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Namespace is "support", not "support.metadata": `support.subjects` is an array, which stops
  // next-intl's NestedKeyOf from recursing, so the deeper path is not a valid namespace key.
  const t = await getTranslations("support");
  return buildStaticPageMetadata({
    path: "/support",
    title: t("metadata.title"),
    titleAbsolute: true,
    description: t("metadata.description"),
    locale,
  });
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [session, supportUser, t, tSeo] = await Promise.all([
    userSession(),
    usersService.getCompact(serverEnv.SUPPORT_USERNAME),
    getTranslations("support"),
    getTranslations("seo"),
  ]);
  const defaultName = session?.username;

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 tablet:px-10 tablet:py-28">
      <JsonLd
        data={buildSupportPageJsonLd(locale, {
          description: tSeo("organizationDescription"),
          founderRole: tSeo("founderRole"),
          pageName: t("metadata.title"),
        })}
      />
      <EditorialHeader
        as="h1"
        align="stack"
        rule={false}
        label={t("contactLabel")}
        title={t("title")}
        standfirst={t("description")}
      />

      <div className="mt-14 border-t border-border pt-10 tablet:mt-16">
        {supportUser.data ? (
          <SupportForm
            supportUserId={supportUser.data.id}
            defaultName={defaultName || undefined}
            defaultEmail={session?.email || undefined}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <MailWarning
              className="size-6 text-text-muted/60"
              strokeWidth={1.5}
            />
            <h2 className="text-base font-medium text-text">
              {t("unavailable.heading")}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-text-muted">
              {t("unavailable.description")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
