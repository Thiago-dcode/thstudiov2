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
  const t = await getTranslations("legal.terms.metadata");
  return buildStaticPageMetadata({
    path: "/legal/terms",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
  });
}

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal.terms");
  const tLegal = await getTranslations("legal");
  const format = await getFormatter();
  const supportEmail = serverEnv.SUPPORT_EMAIL;

  const email = emailTag(supportEmail);
  const privacy = docTag("/legal/privacy");

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

      <Section title={t("acceptance.title")}>
        <P>{t("acceptance.body")}</P>
      </Section>

      <Section title={t("account.title")}>
        <P>{t("account.body")}</P>
        <Bullets
          items={[
            t("account.verified"),
            t("account.twoFa"),
            t("account.username"),
            t("account.age"),
          ]}
        />
      </Section>

      <Section title={t("plans.title")}>
        <P>{t("plans.body")}</P>
        <Bullets
          items={[
            t.rich("plans.billing", strongTag),
            t("plans.autoRenew"),
            t("plans.manage"),
            t("plans.promos"),
          ]}
        />
      </Section>

      <Section title={t("ownership.title")}>
        <P>{t("ownership.body1")}</P>
        <P>{t("ownership.body2")}</P>
      </Section>

      <Section title={t("acceptableUse.title")}>
        <P>{t("acceptableUse.body")}</P>
        <Bullets
          items={[
            t("acceptableUse.law"),
            t("acceptableUse.ip"),
            t("acceptableUse.harmful"),
            t("acceptableUse.fraud"),
            t("acceptableUse.malware"),
          ]}
        />
        <P>{t.rich("acceptableUse.body2", strongTag)}</P>
      </Section>

      <Section title={t("moderation.title")}>
        <P>{t("moderation.body")}</P>
        <Bullets
          items={[
            t.rich("moderation.strikes", strongTag),
            t("moderation.temporary"),
            t("moderation.permanent"),
          ]}
        />
      </Section>

      <Section title={t("illegal.title")}>
        <P>{t.rich("illegal.body1", strongTag)}</P>
        <P>{t.rich("illegal.body2", strongTag)}</P>
        <P>{t("illegal.body3")}</P>
      </Section>

      <Section title={t("limits.title")}>
        <P>{t("limits.body")}</P>
        <Bullets
          items={[
            t.rich("limits.storage", strongTag),
            t.rich("limits.content", strongTag),
            t.rich("limits.aiCredits", strongTag),
            t.rich("limits.compression", strongTag),
          ]}
        />
        <P>{t("limits.body2")}</P>
      </Section>

      <Section title={t("ip.title")}>
        <P>{t("ip.body1")}</P>
        <P>{t("ip.body2")}</P>
      </Section>

      <Section title={t("termination.title")}>
        <P>{t.rich("termination.body1", privacy)}</P>
        <P>{t("termination.body2")}</P>
      </Section>

      <Section title={t("warranties.title")}>
        <P>{t("warranties.body")}</P>
      </Section>

      <Section title={t("liability.title")}>
        <P>{t("liability.body")}</P>
      </Section>

      <Section title={t("law.title")}>
        <P>{t("law.body")}</P>
      </Section>

      <Section title={t("contact.title")}>
        <P>{t.rich("contact.body", email)}</P>
      </Section>
    </>
  );
}
