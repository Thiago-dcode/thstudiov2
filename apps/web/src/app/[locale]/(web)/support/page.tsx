import { MailWarning } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
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

export default async function SupportPage() {
  const session = await userSession();
  const supportUser = await usersService.getCompact(serverEnv.SUPPORT_USERNAME);
  const t = await getTranslations("support");
  const defaultName = session?.username;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16 tablet:px-10 tablet:py-24">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {t("contactLabel")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          {t("description")}
        </p>
      </div>

      <div className="mt-10 border border-border bg-fg-2/20 p-5 tablet:p-7">
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
