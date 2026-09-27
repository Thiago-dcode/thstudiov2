"use client";

import type { Media } from "@repo/common-lib/types/media";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Circle, MapPin, MapPinOff, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const SEO_FIELDS = ["seo_title", "seo_description", "seo_alt"] as const;
type SeoField = (typeof SEO_FIELDS)[number];

/** The SEO fields a media still lacks; empty means its SEO is complete. */
export function missingSeoFields(
  media: Pick<Media, SeoField>,
): readonly SeoField[] {
  return SEO_FIELDS.filter((field) => !media[field]?.trim());
}

const triggerClass = "size-6 m-0";

/**
 * At-a-glance status for one media — SEO, place, visibility — each explaining itself on hover
 * (pointer devices) or tap (touch), through the same popover as the atelier's info tooltips.
 */
export function MediaStatusIcons({
  media,
  className,
}: {
  media: Pick<Media, SeoField | "location" | "is_active">;
  className?: string;
}) {
  const t = useTranslations("atelier.media.status");
  const tCard = useTranslations("atelier.media.card");
  const locale = useLocale();

  const missing = missingSeoFields(media);
  const seoComplete = missing.length === 0;
  const fieldLabel: Record<SeoField, string> = {
    seo_title: tCard("seoTitleLabel"),
    seo_description: tCard("seoDescriptionLabel"),
    seo_alt: tCard("altTextLabel"),
  };
  const missingList = new Intl.ListFormat(locale, {
    type: "conjunction",
  }).format(missing.map((field) => fieldLabel[field]));

  const place = media.location?.formatted;

  const seoLabel = seoComplete ? t("seoComplete") : t("seoIncomplete");
  const locationLabel = place ? t("locationSet") : t("locationMissing");
  const activeLabel = media.is_active ? t("active") : t("inactive");

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <InfoTooltip
        label={seoLabel}
        triggerClassName={triggerClass}
        icon={
          <Sparkles
            className={cn(
              "size-3.5",
              seoComplete ? "text-warning" : "text-text-muted opacity-35",
            )}
            aria-hidden
          />
        }
        content={
          <>
            <p className="font-medium text-text">{seoLabel}</p>
            <p>
              {seoComplete
                ? t("seoCompleteBody")
                : t("seoIncompleteBody", { fields: missingList })}
            </p>
          </>
        }
      />
      <InfoTooltip
        label={locationLabel}
        triggerClassName={triggerClass}
        icon={
          place ? (
            <MapPin className="size-3.5 text-text" aria-hidden />
          ) : (
            <MapPinOff
              className="size-3.5 text-text-muted opacity-35"
              aria-hidden
            />
          )
        }
        content={
          <>
            <p className="font-medium text-text">{locationLabel}</p>
            <p>{place ?? t("locationMissingBody")}</p>
          </>
        }
      />
      <InfoTooltip
        label={activeLabel}
        triggerClassName={triggerClass}
        icon={
          <Circle
            className={cn(
              "size-2.5",
              media.is_active
                ? "fill-success text-success"
                : "fill-text-muted/40 text-text-muted/40",
            )}
            aria-hidden
          />
        }
        content={
          <>
            <p className="font-medium text-text">{activeLabel}</p>
            <p>{media.is_active ? t("activeBody") : t("inactiveBody")}</p>
          </>
        }
      />
    </div>
  );
}
