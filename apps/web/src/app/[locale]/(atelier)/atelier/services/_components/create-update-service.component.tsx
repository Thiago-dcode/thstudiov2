"use client";

import {
  ALLOWED_IMAGE_FILE_TYPES,
  MAX_SERVICE_PRICE,
} from "@repo/common-lib/constants/limits";
import type { Portfolio } from "@repo/common-lib/types/portfolio";
import type { FullService } from "@repo/common-lib/types/service";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/shadcn/combobox";
import { Label } from "@repo/ui/components/shadcn/label";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import {
  FileInputProvider,
  useInputFile,
} from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { cn } from "@repo/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { StickyFormFooter } from "@/app/[locale]/(atelier)/__components/sticky-form-footer";
import { SubmitServiceButton } from "@/app/[locale]/(atelier)/__components/submit-service-button";
import { DynamicListInput } from "@/lib/components/dynamic-list-input";
import FormComponent from "@/lib/components/form-component";
import { useMainNav } from "@/lib/providers/main-nav.provider";
import { useCreateUpdateService } from "@/modules/services/providers/create-update-service.provider";

export const CreateOrUpdateService = ({
  defaultService,
  portfolios,
}: {
  defaultService?: FullService;
  portfolios: Portfolio[];
}) => {
  const t = useTranslations("atelier.services.form");
  const router = useRouter();
  const {
    currentService,
    setService,
    clear,
    handleSubmit,
    isPending,
    success,
    inputErrors,
    deleteInputErrorProperty,
    readOnly,
    isUpdate,
    serviceInput,
    user,
    notifyFormChange,
    handleThumbnailChange,
    features,
    setFeatures,
    terms,
    setTerms,
    selectedPortfolioId,
    setSelectedPortfolioId,
    isHighlighted,
    setIsHighlighted,
    highlightLimit,
    highlightToggleDisabled,
    isLoadingHighlightCount,
  } = useCreateUpdateService();

  const { setShrinked } = useMainNav();

  useEffect(() => {
    if (defaultService && currentService?.id !== defaultService.id) {
      setService(defaultService);
    }
    if (!defaultService && currentService) {
      clear();
    }
  }, [clear, currentService, defaultService, setService]);

  useEffect(() => {
    setShrinked(true);
  }, [setShrinked]);

  useEffect(() => {
    if (success) {
      clear();
      router.push("/atelier/services");
      router.refresh();
    }
  }, [clear, router, success]);

  return (
    <FormComponent.Container>
      {readOnly ? (
        <div
          role="status"
          className="mb-6 border border-border/60 bg-fg-2/40 px-4 py-3 text-sm text-text-muted"
        >
          {t("blockedNotice")}
        </div>
      ) : null}
      <FormComponent.Form onSubmit={handleSubmit} className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
            <Spinner className="size-10 text-text" />
          </div>
        )}

        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${readOnly ? "pointer-events-none select-none opacity-90" : ""}`}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <FormComponent.LabelInput
                onChange={(e) => {
                  serviceInput.current.title = e.target.value;
                  notifyFormChange();
                  deleteInputErrorProperty("title");
                }}
                defaultValue={serviceInput.current.title}
                error={inputErrors?.title}
                label={t("titleLabel")}
                required={!isUpdate}
                name="title"
                id="title"
                type="text"
                placeholder={t("titlePlaceholder")}
                extraInfo={t("titleInfo")}
              />
              {/* The title decides the permanent public address, so say so before they commit. */}
              {!isUpdate && (
                <p className="text-xs text-text-muted">
                  {t("titleAddressHint")}
                </p>
              )}
              {currentService?.slug && (
                <p className="text-xs text-text-muted">
                  {t("permalinkLabel")}{" "}
                  <span className="font-mono">
                    /artists/{user.username}/services/{currentService.slug}
                  </span>{" "}
                  — {t("permalinkFrozenNote")}
                </p>
              )}
            </div>

            <FormComponent.LabelTextarea
              onChange={(e) => {
                serviceInput.current.description = e.target.value;
                notifyFormChange();
                deleteInputErrorProperty("description");
              }}
              defaultValue={serviceInput.current.description}
              error={inputErrors?.description}
              rows={4}
              label={t("descriptionLabel")}
              name="description"
              id="description"
              placeholder={t("descriptionPlaceholder")}
            />
            {portfolios.length > 0 && (
              <PortfolioSelect
                portfolios={portfolios}
                value={selectedPortfolioId}
                onChange={(value) => {
                  notifyFormChange();
                  setSelectedPortfolioId(value);
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormComponent.LabelInput
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "Minus") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  if (e.target.value !== "") {
                    const parsed = Number(e.target.value);
                    if (!Number.isNaN(parsed)) {
                      if (parsed < 0) {
                        e.target.value = "0";
                      } else if (parsed > MAX_SERVICE_PRICE) {
                        e.target.value = String(MAX_SERVICE_PRICE);
                      }
                    }
                  }
                  serviceInput.current.price = e.target.value;
                  notifyFormChange();
                  deleteInputErrorProperty("price");
                }}
                onBlur={(e) => {
                  if (e.target.value === "") return;
                  const parsed = Number(e.target.value);
                  if (Number.isNaN(parsed)) return;
                  const rounded = Math.round(Math.max(0, parsed) * 100) / 100;
                  e.target.value = String(rounded);
                  serviceInput.current.price = e.target.value;
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted.includes("-")) {
                    e.preventDefault();
                  }
                }}
                defaultValue={serviceInput.current.price}
                error={inputErrors?.price}
                label={t("priceLabel")}
                name="price"
                id="price"
                type="number"
                min="0"
                max={MAX_SERVICE_PRICE}
                step="0.01"
                placeholder="0.00"
                extraInfo={t("priceInfo")}
              />

              <div className="flex flex-col gap-3 pt-5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show_price"
                    defaultChecked={serviceInput.current.show_price}
                    onCheckedChange={(checked) => {
                      serviceInput.current.show_price = !!checked;
                      notifyFormChange();
                    }}
                  />
                  <Label
                    htmlFor="show_price"
                    className="text-xs text-text-muted cursor-pointer"
                  >
                    {t("showPrice")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    defaultChecked={serviceInput.current.is_active}
                    onCheckedChange={(checked) => {
                      serviceInput.current.is_active = !!checked;
                      notifyFormChange();
                    }}
                  />
                  <Label
                    htmlFor="is_active"
                    className="text-xs text-text-muted cursor-pointer"
                  >
                    {t("active")}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="service-is-highlight"
                  checked={isHighlighted}
                  onCheckedChange={(checked) => {
                    deleteInputErrorProperty("is_highlight");
                    const value = checked === true;
                    serviceInput.current.is_highlight = value;
                    setIsHighlighted(value);
                    notifyFormChange();
                  }}
                  disabled={
                    isPending ||
                    isLoadingHighlightCount ||
                    highlightToggleDisabled
                  }
                />
                <Label
                  htmlFor="service-is-highlight"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("showOnProfile")}
                </Label>
                <InfoTooltip
                  content={
                    <p className="text-sm">
                      {t("showOnProfileInfo", { limit: highlightLimit })}
                    </p>
                  }
                />
              </div>
              {!isLoadingHighlightCount && highlightToggleDisabled && (
                <p className="text-xs text-text-muted">
                  {t("highlightLimitReached", { limit: highlightLimit })}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
              <ThumbnailInput
                defaultUrl={defaultService?.thumbnail || undefined}
                onFileChange={handleThumbnailChange}
                error={inputErrors?.thumbnail}
              />
            </FileInputProvider>

            <DynamicListInput
              value={features}
              onChange={(value) => {
                notifyFormChange();
                setFeatures(value);
              }}
              label={t("featuresLabel")}
              placeholder={t("featuresPlaceholder")}
            />

            <DynamicListInput
              value={terms}
              onChange={(value) => {
                notifyFormChange();
                setTerms(value);
              }}
              label={t("termsLabel")}
              placeholder={t("termsPlaceholder")}
            />
          </div>
        </div>

        {inputErrors && Object.keys(inputErrors).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(inputErrors).map(([field, message]) => (
              <span
                key={field}
                className="inline-flex items-center gap-1.5 bg-error/10 px-2.5 py-1 text-xs text-error"
                title={message}
              >
                <span className="size-1.5 bg-error" />
                {field}
              </span>
            ))}
          </div>
        )}

        {!readOnly ? (
          <StickyFormFooter>
            <div className="flex items-center justify-end">
              <SubmitServiceButton />
            </div>
          </StickyFormFooter>
        ) : null}
      </FormComponent.Form>
    </FormComponent.Container>
  );
};

const ThumbnailInput = ({
  defaultUrl,
  onFileChange,
  error,
}: {
  defaultUrl?: string;
  onFileChange: (file: File | undefined) => void;
  error?: string;
}) => {
  const t = useTranslations("atelier.services.form");
  const { files } = useInputFile();
  const { previewUrls } = usePreviewUrls({ defaultUrl, files });
  const onFileChangeRef = useRef(onFileChange);
  onFileChangeRef.current = onFileChange;

  useEffect(() => {
    onFileChangeRef.current(files?.[0]);
  }, [files]);

  return (
    <div className="space-y-1">
      <Label className="block text-xs tracking-wide text-text-muted">
        {t("thumbnailLabel")}
      </Label>
      <div className={cn("w-full flex flex-col gap-3")}>
        {previewUrls?.length ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative aspect-video w-full max-w-[400px] overflow-hidden border-4 border-fg-2">
              <img
                src={previewUrls[0]}
                alt={t("thumbnailAlt")}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : null}
        <FileInput name="thumbnail" id="thumbnail-input" error={error} />
      </div>
    </div>
  );
};

const PortfolioSelect = ({
  portfolios,
  value,
  onChange,
}: {
  portfolios: Portfolio[];
  value?: number;
  onChange: (value: number | undefined) => void;
}) => {
  const t = useTranslations("atelier.services.form");
  const selectedPortfolio = useMemo(
    () => portfolios.find((p) => p.id === value),
    [portfolios, value],
  );

  return (
    <div className="space-y-1">
      <Label className="block text-xs tracking-wide text-text-muted">
        {t("portfolioLinkLabel")}
      </Label>
      <Combobox
        value={value ? String(value) : null}
        onValueChange={(val) => {
          onChange(val ? Number(val) : undefined);
        }}
      >
        <ComboboxInput
          placeholder={t("portfolioSelectPlaceholder")}
          value={selectedPortfolio?.title ?? ""}
          readOnly
          showClear
        />
        <ComboboxContent>
          <ComboboxList>
            {portfolios.map((portfolio) => (
              <ComboboxItem
                key={portfolio.id}
                value={String(portfolio.id)}
                className="gap-2"
              >
                <div className="size-6 shrink-0 overflow-hidden bg-fg-2">
                  {portfolio.thumbnail ? (
                    <img
                      src={portfolio.thumbnail}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full bg-fg-2-foreground/20" />
                  )}
                </div>
                <span className="line-clamp-1">{portfolio.title}</span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p className="text-[0.8rem] text-text-muted">{t("portfolioLinkInfo")}</p>
    </div>
  );
};

export default CreateOrUpdateService;
