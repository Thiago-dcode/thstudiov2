import "server-only";
import type { GalleryLabels } from "@repo/ui/providers/gallery.provider";
import { getTranslations } from "next-intl/server";

/**
 * Localized chrome for the shared `packages/ui` gallery. That package cannot read the app's
 * translation files, so without this every locale rendered the English "Open" / "Share" — including
 * the anchor text of the lightbox's link to the media page, which is the only descriptive text a
 * crawler sees on it.
 */
export async function getGalleryLabels(): Promise<GalleryLabels> {
  const t = await getTranslations("artists.gallery");
  return {
    open: t("open"),
    openAria: t("openAria"),
    share: t("share"),
    shared: t("shared"),
    copied: t("copied"),
    shareAria: t("shareAria"),
    altFallback: t("altFallback"),
  };
}
