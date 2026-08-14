"use client";
import {
  ALLOWED_IMAGE_FILE_TYPES,
  MAX_DISCIPLINES_PORTFOLIO,
} from "@repo/common-lib/constants/constants";
import {
  generateValidSlug,
  isAValidSlugFormat,
} from "@repo/common-lib/utils/generate-valid-slug";
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
import { useRef } from "react";
import FormComponent from "@/lib/components/form-component";
import CategoryCombobox from "@/modules/categories/components/category-combobox";

import { GetCategoriesProvider } from "@/modules/categories/providers/getCategories.provider";
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

  return (
    <div className="space-y-4">
      {previewUrls?.length || currentPortfolio?.thumbnail ? (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video w-full overflow-hidden border-2 border-border">
            <img
              src={previewUrls[0] || currentPortfolio?.thumbnail}
              alt={t("thumbnailAlt")}
              className="w-full h-full object-cover opacity-80"
            />
            {portfolioInput.title && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <h3 className="text-3xl bg-black/50 p-2 px-4 font-bold text-white text-center drop-shadow-lg">
                  {portfolioInput.title}
                </h3>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-muted ">{t("thumbnailHint")}</p>
      )}
      <FileInput
        name="thumbnail"
        id="thumbnail-input"
        required={!currentPortfolio?.thumbnail}
        onChange={(e) => {
          handleFileChange(e);
        }}
        disabled={isPending}
      />
      {inputErrors?.thumbnail && (
        <p className="text-sm text-error">{inputErrors.thumbnail}</p>
      )}
    </div>
  );
};

const FirstStepInputs = () => {
  const t = useTranslations("atelier.portfolios.form");
  const {
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
    isSlugFormatValid,
    isCheckingSlugAvailability,
    isSlugAvailable,
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

  const manuallyChangedSlug = useRef(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    deleteInputErrorProperty("title");
    const newTitle = e.target.value;
    handleSetFormData("title", newTitle);

    // Only auto-generate slug if it's empty and wasn't manually changed
    if (!manuallyChangedSlug.current) {
      const generatedSlug = generateValidSlug(newTitle);
      if (generatedSlug && isAValidSlugFormat(generatedSlug)) {
        handleSetFormData("slug", generatedSlug);
      } else if (!generatedSlug) {
        handleSetFormData("slug", "");
      }
    }
  };

  const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Preserve trailing hyphen while typing to allow users to type hyphens
    const newSlug = generateValidSlug(e.target.value, {
      preserveTrailingHyphen: true,
    });

    deleteInputErrorProperty("slug");
    handleSetFormData("slug", newSlug);
    manuallyChangedSlug.current = !!newSlug;
  };

  // Get slug status message
  const getSlugStatusMessage = () => {
    if (isCheckingSlugAvailability) {
      return <p className="text-sm text-text-muted">{t("slugChecking")}</p>;
    }
    if (
      typeof isSlugAvailable === "boolean" &&
      currentPortfolio?.slug !== portfolioInput.slug
    ) {
      if (isSlugAvailable) {
        return <p className="text-sm text-green-600">{t("slugAvailable")}</p>;
      } else {
        return <p className="text-sm text-error">{t("slugTaken")}</p>;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch">
      <div className="shrink-0 md:w-1/3 flex flex-col">
        <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
          <ThumbnailInput />
        </FileInputProvider>
      </div>

      <div className="flex-1 space-y-4 flex flex-col">
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
          disabled={isPending}
        />

        <div className="space-y-2">
          <FormComponent.LabelInput
            value={portfolioInput.slug || ""}
            onChange={(e) => {
              handleSlugChange(e);
            }}
            error={inputErrors?.slug}
            label={t("slugLabel")}
            required
            name="slug"
            id="slug"
            type="text"
            placeholder={t("slugPlaceholder")}
            extraInfo={t("slugInfo")}
            disabled={isCheckingSlugAvailability || isPending}
          />
          {isSlugFormatValid === false && (
            <p className="text-sm text-error">{t("slugInvalidFormat")}</p>
          )}
          {getSlugStatusMessage()}
          {currentPortfolio?.id && (
            <p className="text-sm text-amber-600">{t("slugChangeWarning")}</p>
          )}
        </div>

        <FormComponent.LabelTextarea
          value={portfolioInput.description || ""}
          onChange={(e) => {
            deleteInputErrorProperty("description");
            handleSetFormData("description", e.target.value);
          }}
          error={inputErrors?.description}
          rows={4}
          label={t("descriptionLabel")}
          name="description"
          id="description"
          placeholder={t("descriptionPlaceholder")}
          disabled={isPending}
        />
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
                isPending || isLoadingHighlightCount || highlightToggleDisabled
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
          <InfoTooltip content={<p className="text-sm">{t("activeInfo")}</p>} />
        </div>
      </div>
    </div>
  );
};

export default FirstStepInputs;
