"use client";

import { COLUMN_BASE_RESPONSIVE_CAPS } from "@repo/common-lib/constants/constants";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button } from "@repo/ui/components/shadcn/button";
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
import { Eye, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import {
  buildPortfolioLayout,
  COLUMN_BASE_COLUMN_LIMITS,
  getColumnBaseColumns,
  getDefaultLayoutConfig,
  type LayoutName,
  layoutSupportsConfig,
} from "@/modules/layouts/layout.helpers";
import { getAllLayoutsAction } from "@/modules/layouts/server-actions/layouts.action";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export function PortfolioLayoutControls() {
  const t = useTranslations("atelier.portfolios.layout");
  const { portfolioInput, handleSetFormData } = usePortfolio();
  const portfolioItems = portfolioInput.portfolioItems;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

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

  const previewLayout = useMemo(
    () => buildPortfolioLayout(layouts, portfolioInput.layout),
    [layouts, portfolioInput.layout],
  );

  const columns = getColumnBaseColumns(portfolioInput.layout);

  if (!layouts.length) return null;

  const handleSelectLayout = (layoutId: number, name: LayoutName) => {
    if (layoutId === portfolioInput.layout?.layout_id) return;
    handleSetFormData("layout", {
      layout_id: layoutId,
      config: getDefaultLayoutConfig(name),
    });
  };

  const handleColumnsChange = (value: number) => {
    if (!selectedLayout) return;
    handleSetFormData("layout", {
      layout_id: selectedLayout.id,
      config: { columns: value },
    });
  };

  const hasItems = portfolioItems.length > 0;

  const formatLayoutLabel = (name: LayoutName) =>
    name.replace(/_/g, " ").toLowerCase();

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
          disabled={!previewLayout || !hasItems}
          onClick={() => setPreviewOpen(true)}
          className="size-8 border-border/50 text-text-muted hover:border-border hover:bg-fg/50 hover:text-text active:scale-100 [&_svg]:size-4"
        >
          <Eye />
        </Button>

        {supportsConfig ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("editSettingsAria")}
            onClick={() => setConfigOpen(true)}
            className="size-8 border-border/50 text-text-muted hover:border-border hover:bg-fg/50 hover:text-text active:scale-100 [&_svg]:size-4"
          >
            <Wrench />
          </Button>
        ) : null}
      </div>

      {/* Layout preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("previewTitle")}</DialogTitle>
            <DialogDescription>
              {t("previewDescription", {
                layoutName: selectedLayout
                  ? formatLayoutLabel(selectedLayout.name)
                  : t("selectedFallback"),
              })}
            </DialogDescription>
          </DialogHeader>

          {hasItems && previewLayout ? (
            <div className="max-h-[70vh] overflow-y-auto">
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
          )}
        </DialogContent>
      </Dialog>

      {/* Column-base config */}
      {supportsConfig ? (
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("settingsTitle")}</DialogTitle>
              <DialogDescription>{t("settingsDescription")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t("columns")}</span>
                <span className="text-sm font-medium tabular-nums text-text">
                  {columns}
                </span>
              </div>
              <Slider
                min={COLUMN_BASE_COLUMN_LIMITS.min}
                max={COLUMN_BASE_COLUMN_LIMITS.max}
                step={1}
                value={[columns]}
                onValueChange={(value) => {
                  const next = value[0];
                  if (typeof next === "number") handleColumnsChange(next);
                }}
              />
              <div className="flex justify-between text-xs text-text-muted/70">
                <span>{COLUMN_BASE_COLUMN_LIMITS.min}</span>
                <span>{COLUMN_BASE_COLUMN_LIMITS.max}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
