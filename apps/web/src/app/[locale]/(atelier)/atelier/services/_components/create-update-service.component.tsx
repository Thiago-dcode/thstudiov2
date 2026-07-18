"use client";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { Portfolio } from "@repo/common-lib/types/portfolio";
import type { FullService } from "@repo/common-lib/types/service";
import {
  generateValidSlug,
  isAValidSlugFormat,
} from "@repo/common-lib/utils/generate-valid-slug";
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
import { useEffect, useMemo, useRef } from "react";
import { DynamicListInput } from "@/lib/components/dynamic-list-input";
import FormComponent from "@/lib/components/form-component";
import { useCreateUpdateService } from "@/modules/services/providers/create-update-service.provider";

export const CreateOrUpdateService = ({
  defaultService,
  portfolios,
}: {
  defaultService?: FullService;
  portfolios: Portfolio[];
}) => {
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
    canSubmit,
    readOnly,
    isUpdate,
    serviceInput,
    slugInputRef,
    notifyFormChange,
    updateSlug,
    handleThumbnailChange,
    features,
    setFeatures,
    terms,
    setTerms,
    selectedPortfolioId,
    setSelectedPortfolioId,
    isHighlighted,
    setIsHighlighted,
    isValidSlug,
    isSlugAvailable,
    isCheckingSlug,
    highlightLimit,
    highlightToggleDisabled,
    isLoadingHighlightCount,
  } = useCreateUpdateService();

  useEffect(() => {
    if (defaultService && currentService?.id !== defaultService.id) {
      setService(defaultService);
    }
    if (!defaultService && currentService) {
      clear();
    }
  }, [clear, currentService, defaultService, setService]);

  useEffect(() => {
    if (success) {
      clear();
      router.push("/atelier/services");
      router.refresh();
    }
  }, [clear, router, success]);

  const getSlugStatusMessage = () => {
    if (isCheckingSlug) {
      return (
        <p className="text-sm text-text-muted">Checking availability...</p>
      );
    }
    if (
      typeof isSlugAvailable === "boolean" &&
      currentService?.slug !== serviceInput.current.slug
    ) {
      if (isSlugAvailable) {
        return (
          <p className="text-sm text-green-600">
            &#10003; This slug is available
          </p>
        );
      }
      return (
        <p className="text-sm text-error">
          &#10007; This slug is already taken
        </p>
      );
    }
    return null;
  };

  return (
    <FormComponent.Container>
      {readOnly ? (
        <div
          role="status"
          className="mb-6 border border-border/60 bg-fg-2/40 px-4 py-3 text-sm text-text-muted"
        >
          This service has been blocked. You can review it here, but it cannot
          be edited until the block is lifted.
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
            <FormComponent.LabelInput
              onChange={(e) => {
                const newTitle = e.target.value;
                serviceInput.current.title = newTitle;
                notifyFormChange();
                deleteInputErrorProperty("title");

                if (!serviceInput.current.manuallyChangedSlug) {
                  const generatedSlug = generateValidSlug(newTitle);
                  if (generatedSlug && isAValidSlugFormat(generatedSlug)) {
                    updateSlug(generatedSlug);
                  } else if (!generatedSlug) {
                    updateSlug("");
                  }
                }
              }}
              defaultValue={serviceInput.current.title}
              error={inputErrors?.title}
              label="Title"
              required={!isUpdate}
              name="title"
              id="title"
              type="text"
              placeholder="Portrait Photography"
            />

            <div className="space-y-2">
              <FormComponent.LabelInput
                ref={slugInputRef}
                onChange={(e) => {
                  const newSlug = generateValidSlug(e.target.value, {
                    preserveTrailingHyphen: true,
                  });
                  notifyFormChange();
                  deleteInputErrorProperty("slug");
                  serviceInput.current.manuallyChangedSlug = !!newSlug;
                  updateSlug(newSlug);
                }}
                defaultValue={serviceInput.current.slug}
                error={inputErrors?.slug}
                label="Slug"
                required={!isUpdate}
                name="slug"
                id="slug"
                type="text"
                placeholder="portrait-photography"
                extraInfo="URL-friendly identifier. Only lowercase letters, numbers and hyphens."
                disabled={isCheckingSlug || isPending}
              />
              {isValidSlug === false && (
                <p className="text-sm text-error">
                  &#10007; Invalid slug format. Example: portrait-photography
                </p>
              )}
              {getSlugStatusMessage()}
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
              label="Description"
              name="description"
              id="description"
              placeholder="Describe your service..."
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
                onChange={(e) => {
                  serviceInput.current.price = e.target.value;
                  notifyFormChange();
                  deleteInputErrorProperty("price");
                }}
                defaultValue={serviceInput.current.price}
                error={inputErrors?.price}
                label="Price"
                name="price"
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                extraInfo="Price is optional, leave it to 0."
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
                    Show price
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
                    Active
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
                  Show on profile page
                </Label>
                <InfoTooltip
                  content={
                    <p className="text-sm">
                      When enabled, this service is highlighted on your public
                      artist profile so visitors can find it more easily. You
                      can highlight up to {highlightLimit} services on your
                      profile page.
                    </p>
                  }
                />
              </div>
              {!isLoadingHighlightCount && highlightToggleDisabled && (
                <p className="text-xs text-text-muted">
                  You&apos;ve reached the limit of {highlightLimit} highlighted
                  services on your profile page.
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
              label="Features"
              placeholder="e.g. 2-hour session"
            />

            <DynamicListInput
              value={terms}
              onChange={(value) => {
                notifyFormChange();
                setTerms(value);
              }}
              label="Terms"
              placeholder="e.g. 50% deposit required"
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
          <div className="sticky bottom-0 bg-bg p-2 mt-6">
            <FormComponent.SubmitButton
              disabled={!canSubmit || isPending || success}
              isPending={isPending}
              success={success}
            >
              {isUpdate ? "Update Service" : "Create Service"}
            </FormComponent.SubmitButton>
          </div>
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
        Thumbnail
      </Label>
      <div className={cn("w-full flex flex-col gap-3")}>
        {previewUrls?.length ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative aspect-video w-full max-w-[400px] overflow-hidden border-4 border-fg-2">
              <img
                src={previewUrls[0]}
                alt="Thumbnail Preview"
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
  const selectedPortfolio = useMemo(
    () => portfolios.find((p) => p.id === value),
    [portfolios, value],
  );

  return (
    <div className="space-y-1">
      <Label className="block text-xs tracking-wide text-text-muted">
        Link to Portfolio (Optional)
      </Label>
      <Combobox
        value={value ? String(value) : null}
        onValueChange={(val) => {
          onChange(val ? Number(val) : undefined);
        }}
      >
        <ComboboxInput
          placeholder="Select a portfolio..."
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
      <p className="text-[0.8rem] text-text-muted">
        Link a portfolio so clients can see related photos of this service.
      </p>
    </div>
  );
};

export default CreateOrUpdateService;
