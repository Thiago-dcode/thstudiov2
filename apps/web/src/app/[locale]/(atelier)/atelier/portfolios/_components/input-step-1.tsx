"use client";
import {
  ALLOWED_IMAGE_FILE_TYPES,
  MAX_DISCIPLINES_PORTFOLIO,
} from "@repo/common-lib/constants/limits";
import { isHighlightToggleDisabled } from "@repo/common-lib/utils/highlights";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  FileInputProvider,
  useInputFile,
} from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import FormComponent from "@/lib/components/form-component";
import CategoryCombobox from "@/modules/categories/components/category-combobox";

import { GetCategoriesProvider } from "@/modules/categories/providers/getCategories.provider";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

/** Disciplines and art styles share one budget in the picker, so one counter covers both. */
const MAX_CATEGORIES = MAX_DISCIPLINES_PORTFOLIO;

const ThumbnailInput = () => {
  const t = useTranslations("atelier.portfolios.form");
  const { files } = useInputFile();

  const {
    portfolioInput,
    handleSetFormData,
    deleteInputErrorProperty,
    inputErrors,
    isPending,
    currentPortfolio,
  } = usePortfolio();
  const filesToPreview =
    files ??
    (portfolioInput.thumbnail instanceof File
      ? portfolioInput.thumbnail
      : undefined);
  const { previewUrls } = usePreviewUrls({ files: filesToPreview });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      deleteInputErrorProperty("thumbnail");
      handleSetFormData("thumbnail", file);
    }
  };

  const thumbnailSrc = previewUrls[0] || currentPortfolio?.thumbnail;
  const previewTitle = portfolioInput.title?.trim() || t("titlePlaceholder");
  const previewDescription = portfolioInput.description?.trim();

  return (
    <div className="flex items-start gap-3 tablet:gap-4">
      <div className="flex min-w-0 max-w-48 flex-1 flex-col gap-2">
        {/* Same footprint as the card beside it, so the dropzone reads as the thumbnail slot. */}
        <FileInput
          name="thumbnail"
          id="thumbnail-input"
          className="aspect-[1240/1667]"
          required={!currentPortfolio?.thumbnail}
          onChange={(e) => {
            handleFileChange(e);
          }}
          disabled={isPending}
        />
        {!thumbnailSrc && (
          <p className="text-xs text-text-muted">{t("thumbnailHint")}</p>
        )}
        {inputErrors?.thumbnail && (
          <p className="text-sm text-error">{inputErrors.thumbnail}</p>
        )}
      </div>
      {/* Mirrors PortfolioCard.Item so the artist sees exactly what the public grid will show. */}
      <PortfolioCard className="min-w-0 max-w-48 flex-1">
        <PortfolioCard.Image
          src={thumbnailSrc}
          alt={previewTitle}
          sizes="192px"
        />
        <PortfolioCard.Details>
          <PortfolioCard.Title
            className={cn(
              "line-clamp-1",
              !portfolioInput.title?.trim() && "text-text-muted",
            )}
          >
            {previewTitle}
          </PortfolioCard.Title>
          {previewDescription ? (
            <PortfolioCard.Description>
              {previewDescription}
            </PortfolioCard.Description>
          ) : null}
        </PortfolioCard.Details>
      </PortfolioCard>
    </div>
  );
};

const FirstStepInputs = () => {
  const t = useTranslations("atelier.portfolios.form");
  const {
    user,
    portfolioInput,
    handleSetFormData,
    inputErrors,
    deleteInputErrorProperty,
    currentPortfolio,
    isPending,
    setCategorySelected,
    removeCategorySelected,
    highlightCount,
    highlightLimit,
    isLoadingHighlightCount,
  } = usePortfolio();

  const categoriesSelected = portfolioInput.categories;

  const isCurrentlyHighlighted = portfolioInput.is_highlight ?? false;
  const originallyHighlighted = currentPortfolio?.is_highlight ?? false;
  const highlightToggleDisabled = isHighlightToggleDisabled(
    highlightCount,
    highlightLimit,
    isCurrentlyHighlighted,
    originallyHighlighted,
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    deleteInputErrorProperty("title");
    handleSetFormData("title", e.target.value);
  };

  return (
    // Capped at the thumbnail slots (25rem) + gap + a 3xl text column, so wide screens don't stretch it.
    <div className="flex w-full max-w-[74.5rem] flex-col gap-6">
      <div className="flex flex-col gap-6 tablet:flex-row">
        {/* Fits the two 12rem thumbnail slots plus their gap. */}
        <div className="flex shrink-0 flex-col tablet:w-[25rem]">
          <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
            <ThumbnailInput />
          </FileInputProvider>
        </div>

        <div className="min-w-0 flex-1 space-y-4 flex flex-col">
          <div className="space-y-1">
            <FormComponent.LabelInput
              value={portfolioInput.title || ""}
              onChange={(e) => {
                handleTitleChange(e);
              }}
              error={inputErrors?.title}
              label={t("titleLabel")}
              required
              name="title"
              id="title"
              type="text"
              placeholder={t("titlePlaceholder")}
              extraInfo={t("titleInfo")}
              disabled={isPending}
            />
            {/* The title decides the permanent public address, so say so before they commit. */}
            {!currentPortfolio && (
              <p className="text-xs text-text-muted">{t("titleAddressHint")}</p>
            )}
            {currentPortfolio?.slug && (
              <p className="text-xs text-text-muted">
                {t("permalinkLabel")}{" "}
                <span className="font-mono">
                  /artists/{user.username}/portfolios/{currentPortfolio.slug}
                </span>{" "}
                — {t("permalinkFrozenNote")}
              </p>
            )}
          </div>

          <FormComponent.LabelTextarea
            value={portfolioInput.description || ""}
            onChange={(e) => {
              deleteInputErrorProperty("description");
              handleSetFormData("description", e.target.value);
            }}
            error={inputErrors?.description}
            rows={6}
            label={t("descriptionLabel")}
            name="description"
            id="description"
            placeholder={t("descriptionPlaceholder")}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              {t("categoriesLabel")}
            </Label>
            <InfoTooltip
              content={
                <p className="text-sm">{t("categoriesVisibilityHint")}</p>
              }
            />
            <span
              className={cn(
                "text-xs text-text-muted tabular-nums",
                categoriesSelected.length >= MAX_CATEGORIES && "text-text",
              )}
            >
              {categoriesSelected.length}/{MAX_CATEGORIES}
            </span>
          </div>
          <GetCategoriesProvider
            initialCategories={currentPortfolio?.categories || []}
            maxSelections={MAX_CATEGORIES}
          >
            <CategoryCombobox
              selectCategory={setCategorySelected}
              removeCategory={removeCategorySelected}
            />
          </GetCategoriesProvider>
        </div>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="portfolio-is-highlight"
                checked={portfolioInput.is_highlight ?? false}
                onCheckedChange={(checked) => {
                  deleteInputErrorProperty("is_highlight");
                  handleSetFormData("is_highlight", checked === true);
                }}
                disabled={
                  isPending ||
                  isLoadingHighlightCount ||
                  highlightToggleDisabled
                }
              />
              <Label
                htmlFor="portfolio-is-highlight"
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="portfolio-is-active"
              checked={portfolioInput.is_active ?? true}
              onCheckedChange={(checked) => {
                deleteInputErrorProperty("is_active");
                handleSetFormData("is_active", checked === true);
              }}
              disabled={isPending}
            />
            <Label
              htmlFor="portfolio-is-active"
              className="text-sm font-normal cursor-pointer"
            >
              {t("active")}
            </Label>
            <InfoTooltip
              content={<p className="text-sm">{t("activeInfo")}</p>}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstStepInputs;
