"use client";

import {
  DEFAULT_COMPRESSION_LVL,
  type EnumType,
} from "@repo/common-lib/constants/enums";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { cn } from "@repo/ui/lib/utils";
import { Gauge, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import { useMedia } from "@/modules/media/providers/media.provider";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { CompressionSliderWithUpgradeHint } from "./compression-slider";
import { creditCostOf, creditsSpentBy, MAX_FILES } from "./staged-media.utils";
import { UploadingIndicator } from "./uploading-indicator";

/**
 * Collapsed, the accordion still has to answer "what is about to happen to my files?" — hiding
 * the controls must not hide the settings themselves. These chips carry that answer, which is
 * why the summary lives in the trigger rather than in the panel body.
 */
function SummaryChip({
  icon: Icon,
  label,
  children,
  emphasized,
}: {
  icon: typeof Gauge;
  /** Announced before the value, so "HIGH" on its own is never the whole announcement. */
  label: string;
  children: ReactNode;
  emphasized?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium",
        emphasized
          ? "border-border-em bg-fg-1 text-text"
          : "border-border bg-fg text-text-muted",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">{label}: </span>
      {children}
    </span>
  );
}

/**
 * Bulk controls for everything currently staged, plus the selection status line.
 *
 * Sits above the grid on phones and in the right rail from `tablet-lg` up, and owns no layout
 * of its own beyond that — the same markup serves both.
 */
export function UploadSettingsPanel() {
  const t = useTranslations("atelier.media.upload");
  const {
    mediaStagedToCreate,
    mediaPendingToCreate,
    updateStagedCreateInputs,
  } = useMedia();
  const { metrics, aiCreditsInfo } = useUserMetrics();
  const allowCompression = metrics?.active_plan.allow_media_compression;

  const [globalCompressionLevel, setGlobalCompressionLevel] = useState<
    EnumType<"COMPRESSION_LEVEL">
  >(DEFAULT_COMPRESSION_LVL);
  const [globalCompressionPreview, setGlobalCompressionPreview] =
    useState<EnumType<"COMPRESSION_LEVEL"> | null>(null);

  // AI credit COST of everything currently toggled on, not a plain item count — a video costs
  // more than an image, so the chip and the summary below have to sum weighted cost to stay
  // accurate.
  const spentCredits = useMemo(
    () => creditsSpentBy(mediaStagedToCreate, aiCreditsInfo),
    [mediaStagedToCreate, aiCreditsInfo],
  );

  const currentCount = mediaStagedToCreate.length;
  const isMaxReached = currentCount >= MAX_FILES;
  const uploadingCount = useMemo(
    () => mediaPendingToCreate.filter((m) => m.pending).length,
    [mediaPendingToCreate],
  );

  return (
    <div className="flex flex-col divide-y divide-border border border-border bg-fg">
      <Accordion type="single" collapsible>
        <AccordionItem value="settings" className="border-b-0">
          <AccordionTrigger className="gap-3 px-3 py-3 transition-colors hover:bg-fg-1 hover:no-underline">
            <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <span className="text-sm font-medium text-text">
                {t("settingsTitle")}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                <SummaryChip icon={Gauge} label={t("compressionLabel")}>
                  {globalCompressionLevel}
                </SummaryChip>
                <SummaryChip
                  icon={Sparkles}
                  label={t("aiSeoGeneration")}
                  emphasized={spentCredits > 0}
                >
                  {spentCredits > 0
                    ? t("settingsAiOn", { used: spentCredits })
                    : t("settingsAiOff")}
                </SummaryChip>
              </span>
            </span>
          </AccordionTrigger>

          <AccordionContent className="space-y-6 px-3 pb-4 pt-1">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs! font-medium text-text">
                    {t("globalCompression")}
                  </span>
                  <InfoTooltip
                    content={
                      <div className="space-y-2">
                        {!allowCompression && (
                          <p className="text-xs! text-amber-600">
                            <span className="font-medium!">
                              {t("upgradeRequired")}
                            </span>
                          </p>
                        )}
                        <p className="font-medium! text-sm!">
                          {t("compressionTooltipTitle")}
                        </p>
                        <p className="text-sm!">
                          {t("compressionTooltipBody")}
                        </p>
                      </div>
                    }
                  />
                </div>
                <span className="bg-fg-1 px-2 py-1 text-xs font-semibold text-text">
                  {globalCompressionPreview ?? globalCompressionLevel}
                </span>
              </div>

              <CompressionSliderWithUpgradeHint
                compressionLevel={globalCompressionLevel}
                disabled={!allowCompression}
                upgradeHint={t("upgradeToAdjust")}
                onPreviewChange={setGlobalCompressionPreview}
                onCompressionLevelChange={(compressionLvlSelected) => {
                  setGlobalCompressionPreview(null);
                  setGlobalCompressionLevel(compressionLvlSelected);
                  updateStagedCreateInputs(() => ({
                    compression_level: compressionLvlSelected,
                  }));
                }}
              />
              {/* A <p> here would render at base size: the global `p` rule is unlayered and
                  outranks Tailwind's size utilities. */}
              <span className="block text-xs leading-relaxed text-text-muted">
                {t("compressionTooltipHint")}
              </span>
            </section>

            <section
              className={cn(
                "flex items-start gap-3 border p-3 transition-colors",
                spentCredits > 0
                  ? "border-border-em bg-fg-1"
                  : "border-border bg-fg hover:border-border-em",
                !aiCreditsInfo.hasCredits && "opacity-60",
              )}
            >
              <Checkbox
                id="generate-seo"
                className="mt-0.5 size-5 shrink-0"
                checked={spentCredits > 0}
                disabled={!aiCreditsInfo.hasCredits}
                onCheckedChange={(checked) => {
                  const value = checked === true;
                  // Running-total budget: each staged file only gets enabled while its own
                  // cost still fits in what is left, so a video (cost 3) can leave later
                  // images unaffordable even though the item count alone would not.
                  let spent = 0;
                  updateStagedCreateInputs((upload) => {
                    if (!value) return { generate_metadata: false };
                    const cost = creditCostOf(upload, aiCreditsInfo);
                    const fits = spent + cost <= aiCreditsInfo.remaining;
                    if (fits) spent += cost;
                    return { generate_metadata: fits };
                  });
                }}
              />
              <label
                htmlFor="generate-seo"
                className="flex min-w-0 flex-1 cursor-pointer select-none flex-col gap-1"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                  <Sparkles className="size-4 shrink-0" aria-hidden />
                  {t("aiSeoGeneration")}
                </span>
                <span className="text-xs leading-relaxed text-text-muted">
                  {t("aiSeoHint")}
                </span>
                {/* Its own line: sharing a row with the title is what squeezed the label down
                    to one word per line at rail width. */}
                <span
                  className={cn(
                    "pt-1 text-xs font-medium",
                    aiCreditsInfo.remaining - spentCredits <= 0
                      ? "text-accent"
                      : "text-text",
                  )}
                >
                  {spentCredits > 0
                    ? t("creditsUsageSummary", {
                        used: spentCredits,
                        remaining: aiCreditsInfo.remaining - spentCredits,
                      })
                    : t("creditsLabel", { count: aiCreditsInfo.remaining })}
                </span>
              </label>
              <div className="shrink-0">
                <InfoTooltip
                  content={
                    <div className="space-y-2">
                      {!aiCreditsInfo.hasCredits && (
                        <p className="text-xs! text-amber-600">
                          <span className="font-medium!">
                            {t("noCreditsTitle")}
                          </span>
                        </p>
                      )}
                      <p className="font-medium">{t("aiSeoGeneration")}</p>
                      <p className="text-sm!">{t("aiSeoTooltipBody")}</p>
                      {/* True since the metadata job reads each file's title and description as
                          context — see `mediaArtistNotesBlock` in the backend AI service. */}
                      <p className="border-l-2 border-border-em pl-2 text-xs! text-text">
                        {t("aiNotesTip")}
                      </p>
                      <p className="text-xs! text-text-muted">
                        {t.rich("aiSeoCreditsHint", {
                          count: aiCreditsInfo.remaining,
                          imageCost: aiCreditsInfo.costFor("IMAGE"),
                          videoCost: aiCreditsInfo.costFor("VIDEO"),
                          remaining: (chunks) => (
                            <span className="font-semibold text-text">
                              {chunks}
                            </span>
                          ),
                        })}
                      </p>
                    </div>
                  }
                />
              </div>
            </section>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <span className="text-sm! text-text-muted">
          {t("filesCount", { count: currentCount, max: MAX_FILES })}
        </span>
        <span className="flex items-center gap-3">
          <UploadingIndicator count={uploadingCount} />
          {isMaxReached && (
            <span className="text-xs text-amber-600">{t("maxReached")}</span>
          )}
        </span>
      </div>
    </div>
  );
}
