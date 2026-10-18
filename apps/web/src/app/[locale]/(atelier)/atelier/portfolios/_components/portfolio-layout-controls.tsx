"use client";

import { COLUMN_BASE_RESPONSIVE_CAPS } from "@repo/common-lib/constants/limits";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Slider } from "@repo/ui/components/shadcn/slider";
import { cn } from "@repo/ui/lib/utils";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import {
  buildPortfolioLayout,
  COLUMN_BASE_COLUMN_LIMITS,
  getColumnBaseColumns,
  getDefaultLayoutConfig,
  getLayoutShowTitle,
  type LayoutConfigGroup,
  type LayoutName,
  layoutSupportsConfig,
  layoutSupportsShapeConfig,
  normalizeLayoutConfig,
  patchLayoutConfig,
} from "@/modules/layouts/layout.helpers";
import { getAllLayoutsAction } from "@/modules/layouts/server-actions/layouts.action";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export function PortfolioLayoutControls() {
  const t = useTranslations("atelier.portfolios.layout");
  const { portfolioInput, handleSetFormData } = usePortfolio();
  const portfolioItems = portfolioInput.portfolioItems;

  const [previewOpen, setPreviewOpen] = useState(false);

  const { result: layoutsResult, handleAction } = useHandleAction({
    action: async () => getAllLayoutsAction({ is_active: true }),
    afterAction: async (result) => {
      if (result.data && !portfolioInput.layout) {
        const defaultLayout = result.data.find((lay) => lay.name === "MASONRY");
        if (!defaultLayout) return;
        handleSetFormData("layout", {
          layout_id: defaultLayout.id,
          config: getDefaultLayoutConfig(defaultLayout.name),
        });
      }
    },
  });

  useEffect(() => {
    handleAction();
  }, [handleAction]);

  const layouts = useMemo(() => layoutsResult?.data ?? [], [layoutsResult]);

  const selectedLayout = useMemo(
    () => layouts.find((l) => l.id === portfolioInput.layout?.layout_id),
    [layouts, portfolioInput.layout],
  );

  const supportsConfig = selectedLayout
    ? layoutSupportsConfig(selectedLayout.name)
    : false;
  const supportsShapeConfig = selectedLayout
    ? layoutSupportsShapeConfig(selectedLayout.name)
    : false;

  const previewLayout = useMemo(
    () => buildPortfolioLayout(layouts, portfolioInput.layout),
    [layouts, portfolioInput.layout],
  );

  const columns = getColumnBaseColumns(portfolioInput.layout);
  const showTitle = getLayoutShowTitle(portfolioInput.layout);

  if (!layouts.length) return null;

  const handleSelectLayout = (layoutId: number, name: LayoutName) => {
    if (layoutId === portfolioInput.layout?.layout_id) return;
    // Carry shared options (e.g. show titles) over to the new layout; anything
    // it does not support is dropped and missing options get their defaults.
    handleSetFormData("layout", {
      layout_id: layoutId,
      config: normalizeLayoutConfig(name, portfolioInput.layout?.config),
    });
  };

  const updateLayoutConfig = (
    group: LayoutConfigGroup,
    patch: Record<string, unknown>,
  ) => {
    if (!selectedLayout) return;
    handleSetFormData("layout", {
      layout_id: selectedLayout.id,
      config: patchLayoutConfig(
        selectedLayout.name,
        portfolioInput.layout?.config,
        group,
        patch,
      ),
    });
  };

  const hasItems = portfolioItems.length > 0;

  const formatLayoutLabel = (name: LayoutName) =>
    name.replace(/_/g, " ").toLowerCase();

  // Rendered from the live `portfolioInput.layout`, so every settings change made
  // in the dialog shows up in the preview straight away.
  const layoutPreview =
    hasItems && previewLayout ? (
      // Tiles are much smaller in the dialog than on the page, so captions shrink to match.
      <div className="[&_.media-gallery-card\_\_title]:text-xs">
        <GalleryProvider>
          <PortfolioGrid
            portfolioItems={portfolioItems}
            layout={previewLayout}
          />
        </GalleryProvider>
      </div>
    ) : (
      <div className="flex min-h-[30vh] items-center justify-center border border-dashed border-border/60 text-sm text-text-muted">
        {t("previewEmpty")}
      </div>
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs! font-medium text-text">{t("label")}</span>
        <InfoTooltip
          iconClassName="size-3.5"
          content={
            <div className="space-y-1.5">
              <p>{t("info")}</p>
              <p>
                {t("columnsInfo", {
                  mobile: COLUMN_BASE_RESPONSIVE_CAPS.mobile,
                  tablet: COLUMN_BASE_RESPONSIVE_CAPS.tablet,
                  max: COLUMN_BASE_COLUMN_LIMITS.max,
                })}
              </p>
            </div>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap"
          role="group"
          aria-label={t("ariaGroup")}
        >
          {layouts.map((layout) => {
            const selected = layout.id === portfolioInput.layout?.layout_id;
            return (
              <Button
                key={layout.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectLayout(layout.id, layout.name)}
                aria-pressed={selected}
                className={cn(
                  " p-2 px-1 text-xs! text-[0.7rem]! capitalize active:scale-100",
                  selected
                    ? "border-text/25 bg-text text-bg font-medium hover:bg-text hover:text-bg"
                    : "border-border/50 bg-transparent text-text-muted hover:border-border hover:bg-fg/50 hover:text-text",
                )}
              >
                {formatLayoutLabel(layout.name)}
              </Button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("previewAria")}
          disabled={!previewLayout || (!hasItems && !supportsConfig)}
          onClick={() => setPreviewOpen(true)}
          className="size-8 border-border/50 text-text-muted hover:border-border hover:bg-fg/50 hover:text-text active:scale-100 [&_svg]:size-4"
        >
          <Eye />
        </Button>
      </div>

      {/* Layout preview, with the layout's settings beside it when it has any */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className={supportsConfig ? "sm:max-w-5xl" : "sm:max-w-4xl"}
        >
          <DialogHeader>
            <DialogTitle>{t("previewTitle")}</DialogTitle>
            <DialogDescription>
              {t("previewDescription", {
                layoutName: selectedLayout
                  ? formatLayoutLabel(selectedLayout.name)
                  : t("selectedFallback"),
              })}
            </DialogDescription>
            {selectedLayout ? (
              <p className="max-w-2xl text-xs leading-relaxed text-text-muted">
                <span className="font-medium text-text">
                  {t("recommendationLabel")}:
                </span>{" "}
                {t(`recommendations.${selectedLayout.name}`)}
              </p>
            ) : null}
          </DialogHeader>

          {supportsConfig ? (
            <div className="grid gap-8 py-2 tablet:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="space-y-8">
                {supportsShapeConfig ? (
                  <section
                    aria-labelledby="layout-settings-shape"
                    className="space-y-4"
                  >
                    <p
                      id="layout-settings-shape"
                      className="text-xs font-medium uppercase tracking-wide text-text-muted"
                    >
                      {t("layoutGroup")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">
                        {t("columns")}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-text">
                        {columns}
                      </span>
                    </div>
                    <Slider
                      min={COLUMN_BASE_COLUMN_LIMITS.min}
                      max={COLUMN_BASE_COLUMN_LIMITS.max}
                      step={1}
                      value={[columns]}
                      aria-label={t("columns")}
                      onValueChange={(value) => {
                        const next = value[0];
                        if (typeof next === "number") {
                          updateLayoutConfig("layout", { columns: next });
                        }
                      }}
                    />
                    <div className="flex justify-between text-xs text-text-muted/70">
                      <span>{COLUMN_BASE_COLUMN_LIMITS.min}</span>
                      <span>{COLUMN_BASE_COLUMN_LIMITS.max}</span>
                    </div>
                  </section>
                ) : null}

                <section
                  aria-labelledby="layout-settings-items"
                  className="space-y-4"
                >
                  <p
                    id="layout-settings-items"
                    className="text-xs font-medium uppercase tracking-wide text-text-muted"
                  >
                    {t("itemsGroup")}
                  </p>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="layout-show-title"
                      checked={showTitle}
                      onCheckedChange={(checked) =>
                        updateLayoutConfig("items", {
                          show_title: checked === true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="layout-show-title"
                      className="cursor-pointer space-y-1"
                    >
                      <span className="block text-sm text-text">
                        {t("showTitles")}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {t("showTitlesHint")}
                      </span>
                    </label>
                  </div>
                </section>
              </div>

              <section
                aria-label={t("previewTitle")}
                className="max-h-[40vh] overflow-y-auto tablet:max-h-[65vh]"
              >
                {layoutPreview}
              </section>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">{layoutPreview}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
