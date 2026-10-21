import { getTranslations } from "next-intl/server";
import { WebSection } from "./web-section";

/** The "scroll to next section" arrow every homepage section ends with; nothing for the last one. */
export async function NextSectionArrow({
  nextSectionId,
}: {
  nextSectionId?: string;
}) {
  if (!nextSectionId) return null;
  const t = await getTranslations("landing");
  return (
    <WebSection.NextSectionLink
      href={`#${nextSectionId}`}
      ariaLabel={t("scrollToNextSection")}
    />
  );
}
