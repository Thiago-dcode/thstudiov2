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
  const t = await getTranslations("legal.notice.metadata");
  return buildStaticPageMetadata({
    path: "/legal/notice",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
  });
}

/**
 * Legal notice / Aviso legal (Spanish LSSI-CE art. 10): the identity and contact details of whoever
 * runs the service. The details come from env (`LEGAL_*`), never from code, so the same build serves
 * every environment. A missing required value is left out rather than shown as a placeholder, and
 * logged so it gets noticed.
 */
export default async function LegalNoticePage() {
  const t = await getTranslations("legal.notice");
  const tLegal = await getTranslations("legal");
  const format = await getFormatter();
  const supportEmail = serverEnv.SUPPORT_EMAIL;
  const owner = {
    name: serverEnv.LEGAL_OWNER_NAME,
    taxId: serverEnv.LEGAL_TAX_ID,
    address: serverEnv.LEGAL_ADDRESS,
    registry: serverEnv.LEGAL_REGISTRY,
  };
  if (!owner.name || !owner.taxId || !owner.address) {
    console.error(
      "[legal/notice] LEGAL_OWNER_NAME, LEGAL_TAX_ID and LEGAL_ADDRESS must be set (LSSI art. 10).",
    );
  }

  const ownerRows = [
    owner.name && t.rich("owner.name", { ...strongTag, value: owner.name }),
    owner.taxId && t.rich("owner.taxId", { ...strongTag, value: owner.taxId }),
    owner.address &&
      t.rich("owner.address", { ...strongTag, value: owner.address }),
    t.rich("owner.email", { ...strongTag, ...emailTag(supportEmail) }),
    owner.registry &&
      t.rich("owner.registry", { ...strongTag, value: owner.registry }),
  ].filter(Boolean);

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

      <Section title={t("owner.title")}>
        <P>{t("owner.body")}</P>
        <Bullets items={ownerRows} />
      </Section>

      <Section title={t("purpose.title")}>
        <P>{t("purpose.body")}</P>
      </Section>

      <Section title={t("conditions.title")}>
        <P>{t.rich("conditions.body", docTag("/legal/terms"))}</P>
      </Section>

      <Section title={t("ip.title")}>
        <P>{t("ip.body")}</P>
      </Section>

      <Section title={t("privacy.title")}>
        <P>{t.rich("privacy.body", docTag("/legal/privacy"))}</P>
      </Section>

      <Section title={t("law.title")}>
        <P>{t("law.body")}</P>
      </Section>

      <Section title={t("contact.title")}>
        <P>
          {t.rich("contact.body", {
            ...emailTag(supportEmail),
            ...docTag("/report"),
          })}
        </P>
      </Section>
    </>
  );
}
