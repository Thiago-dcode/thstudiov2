import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import {
  Bullets,
  docTag,
  emailTag,
  LegalHeader,
  P,
  Section,
  strongTag,
} from "../_components/legal-doc";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("legal.privacy.metadata");
  return buildStaticPageMetadata({
    path: "/legal/privacy",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
  });
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal.privacy");
  const tLegal = await getTranslations("legal");
  const format = await getFormatter();
  const supportEmail = serverEnv.SUPPORT_EMAIL;

  const email = emailTag(supportEmail);
  const cookies = docTag("/legal/cookies");

  return (
    <>
      <LegalHeader
        lastUpdated={tLegal("lastUpdated", {
          date: format.dateTime(new Date(t("updatedAt")), {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        })}
        heading={t("heading")}
        intro={t("intro")}
      />

      <Section title={t("controller.title")}>
        <P>{t.rich("controller.body", email)}</P>
      </Section>

      <Section title={t("collect.title")}>
        <P>{t("collect.body")}</P>
        <Bullets
          items={[
            t.rich("collect.account", strongTag),
            t.rich("collect.location", strongTag),
            t.rich("collect.content", strongTag),
            t.rich("collect.business", strongTag),
            t.rich("collect.messages", strongTag),
            t.rich("collect.security", strongTag),
          ]}
        />
      </Section>

      <Section title={t("payments.title")}>
        <P>{t.rich("payments.body", strongTag)}</P>
      </Section>

      <Section title={t("ai.title")}>
        <P>{t("ai.body")}</P>
      </Section>

      <Section title={t("usage.title")}>
        <Bullets
          items={[
            t("usage.operating"),
            t("usage.auth"),
            t("usage.billing"),
            t("usage.aiFeatures"),
            t("usage.moderation"),
            t("usage.emails"),
            t("usage.publicProfile"),
            t("usage.contactForm"),
          ]}
        />
      </Section>

      <Section title={t("sharing.title")}>
        <P>{t("sharing.body")}</P>
        <Bullets
          items={[
            t.rich("sharing.payments", strongTag),
            t.rich("sharing.ai", strongTag),
            t.rich("sharing.email", strongTag),
          ]}
        />
      </Section>

      <Section title={t("retention.title")}>
        <P>{t("retention.body")}</P>
      </Section>

      <Section title={t("rights.title")}>
        <P>{t("rights.body")}</P>
        <Bullets
          items={[
            t.rich("rights.access", strongTag),
            t.rich("rights.rectification", strongTag),
            t.rich("rights.erasure", strongTag),
            t.rich("rights.portability", strongTag),
            t.rich("rights.restriction", strongTag),
            t.rich("rights.objection", strongTag),
          ]}
        />
        <P>{t.rich("rights.body2", email)}</P>
      </Section>

      <Section title={t("security.title")}>
        <P>{t("security.body")}</P>
      </Section>

      <Section title={t("cookies.title")}>
        <P>{t.rich("cookies.body", cookies)}</P>
      </Section>

      <Section title={t("changes.title")}>
        <P>{t("changes.body")}</P>
      </Section>

      <Section title={t("contact.title")}>
        <P>{t.rich("contact.body", email)}</P>
      </Section>
    </>
  );
}
