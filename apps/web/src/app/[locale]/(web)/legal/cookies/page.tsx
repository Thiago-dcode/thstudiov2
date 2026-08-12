import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import {
  Bullets,
  docTag,
  ExternalLink,
  emailTag,
  LegalHeader,
  P,
  Section,
  strongTag,
} from "../_components/legal-doc";

const STRIPE_PRIVACY_URL = "https://stripe.com/privacy";
const PAYPAL_PRIVACY_URL = "https://www.paypal.com/webapps/mpp/ua/privacy-full";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("legal.cookies.metadata");
  return buildStaticPageMetadata({
    path: "/legal/cookies",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
  });
}

export default async function CookiePolicyPage() {
  const t = await getTranslations("legal.cookies");
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

      <Section title={t("what.title")}>
        <P>{t.rich("what.body", strongTag)}</P>
      </Section>

      <Section title={t("essential.title")}>
        <P>{t("essential.body")}</P>
        <Bullets
          items={[
            t.rich("essential.auth", strongTag),
            t.rich("essential.security", strongTag),
            t.rich("essential.preferences", strongTag),
          ]}
        />
        <P>{t("essential.body2")}</P>
      </Section>

      <Section title={t("functional.title")}>
        <P>{t("functional.body")}</P>
        <Bullets
          items={[
            t.rich("functional.sessions", strongTag),
            t.rich("functional.checkout", strongTag),
            t.rich("functional.recovery", strongTag),
          ]}
        />
        <P>{t("functional.body2")}</P>
      </Section>

      <Section title={t("thirdParty.title")}>
        <P>{t.rich("thirdParty.body", strongTag)}</P>
        <Bullets
          items={[
            <ExternalLink key="stripe" href={STRIPE_PRIVACY_URL}>
              {t("thirdParty.stripe")}
            </ExternalLink>,
            <ExternalLink key="paypal" href={PAYPAL_PRIVACY_URL}>
              {t("thirdParty.paypal")}
            </ExternalLink>,
          ]}
        />
      </Section>

      <Section title={t("notUsed.title")}>
        <P>{t.rich("notUsed.body", strongTag)}</P>
        <Bullets
          items={[
            t("notUsed.analytics"),
            t("notUsed.advertising"),
            t("notUsed.pixels"),
            t("notUsed.crossSite"),
          ]}
        />
      </Section>

      <Section title={t("managing.title")}>
        <P>{t("managing.body")}</P>
      </Section>

      <Section title={t("privacyRelation.title")}>
        <P>{t.rich("privacyRelation.body", privacy)}</P>
      </Section>

      <Section title={t("contact.title")}>
        <P>{t.rich("contact.body", email)}</P>
      </Section>
    </>
  );
}
