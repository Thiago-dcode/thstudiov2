'use client'

import { FullService, Service } from "@repo/common-lib/types/service"
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants"
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { createOrUpdateServiceAction } from "@/modules/services/server-actions/create-update-service.action"
import { serviceSlugExistsAction } from "@/modules/services/server-actions/slug-exists.action"
import FormComponent from "@/lib/components/form-component"
import { DynamicListInput } from "@/lib/components/dynamic-list-input"
import { FileInputProvider, useInputFile } from "@repo/ui/contexts/file.provider"
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls"
import { FileInput } from "@repo/ui/components/custom/file-input"
import { Checkbox } from "@repo/ui/components/shadcn/checkbox"
import { Label } from "@repo/ui/components/shadcn/label"
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip"
import { Spinner } from "@repo/ui/components/shadcn/spinner"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@repo/ui/components/shadcn/combobox"
import { cn } from "@repo/ui/lib/utils"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@repo/ui/sonner"
import { generateValidSlug, isAValidSlugFormat } from "@repo/common-lib/utils/generate-valid-slug"
import { ActionReturn } from "@repo/common-lib/types/response"

import { UserAuth } from "@/modules/auth/auth.types"
import { Portfolio } from "@repo/common-lib/types/portfolio"

type ServiceActionInput = Parameters<typeof createOrUpdateServiceAction>[0];

export const CreateOrUpdateService = ({
    defaultService,
    userAuth,
    portfolios,
}: {
    defaultService?: FullService;
    userAuth: UserAuth;
    portfolios: Portfolio[];
}) => {
    const router = useRouter();
    const isUpdate = !!defaultService;
    const readOnly = Boolean(defaultService?.blocked_at);

    const titleRef = useRef(defaultService?.title ?? '');
    const slugRef = useRef(defaultService?.slug ?? '');
    const slugInputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef(defaultService?.description ?? '');
    const priceRef = useRef(defaultService?.price != null ? String(defaultService.price) : '');
    const isActiveRef = useRef(defaultService?.is_active ?? true);
    const showPriceRef = useRef(defaultService?.show_price ?? false);
    const isHighlightRef = useRef(defaultService?.is_highlight ?? false);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | undefined>(defaultService?.portfolio_id ?? undefined);
    const manuallyChangedSlug = useRef(false);
    const previousSlugRef = useRef<string | undefined>(defaultService?.slug);
    const slugCheckTimeout = useRef<NodeJS.Timeout>(null);
    const slugChecksMemo = useRef<Record<string, ActionReturn<boolean, undefined>>>({});
    const [features, setFeatures] = useState<string[]>(
        defaultService?.features?.map(f => f.title) ?? ['']
    );
    const [terms, setTerms] = useState<string[]>(
        defaultService?.terms?.map(t => t.title) ?? ['']
    );
    const [isValidSlug, setIsValidSlug] = useState<boolean | undefined>(undefined);

    const { handleAction, isPending, success, inputErrors, deleteInputErrorProperty, reset } = useHandleAction<ServiceActionInput, Service>({
        action: async () => {
            const payload: ServiceActionInput = {
                title: titleRef.current,
                slug: slugRef.current,
                description: descriptionRef.current || undefined,
                price: priceRef.current ? Number(priceRef.current) : undefined,
                is_active: isActiveRef.current,
                show_price: showPriceRef.current,
                is_highlight: isHighlightRef.current,
                portfolio_id: selectedPortfolioId,
                user_id: userAuth.id,
                thumbnail: thumbnailFileRef.current,
                features: features.filter(f => f.trim()).map(f => ({ title: f.trim() })),
                terms: terms.filter(t => t.trim()).map(t => ({ title: t.trim() })),
            };

            return await createOrUpdateServiceAction(payload, defaultService);
        },
        afterAction: async (result) => {
            if (result.errors) {
                result.errors.forEach((error) => toast.error(error));
            } else if (result.data) {
                toast.success(isUpdate ? "Service updated" : "Service created");
                router.push('/atelier/services');
                router.refresh();
            }
        },
        beforeAction: async () => {
            reset();
        }
    });

    const {
        handleAction: handleSlugCheck,
        result: slugExistResult,
        isPending: isCheckingSlug,
        cleanResult: cleanSlugResult,
        cleanErrors: cleanSlugErrors,
    } = useHandleAction({
        action: async () => {
            const slugToCheck = slugRef.current;
            if (slugChecksMemo.current[slugToCheck]) {
                return slugChecksMemo.current[slugToCheck];
            }
            return await serviceSlugExistsAction(userAuth.username, slugToCheck);
        },
        afterAction: async (data) => {
            slugChecksMemo.current[slugRef.current] = data;
        }
    });

    const isSlugAvailable = typeof slugExistResult?.data === 'boolean' ? !slugExistResult.data : undefined;

    const checkSlugAvailability = useCallback(() => {
        if (!slugRef.current || isCheckingSlug || slugRef.current === defaultService?.slug) return;
        if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
        slugCheckTimeout.current = setTimeout(() => {
            cleanSlugResult();
            cleanSlugErrors();
            handleSlugCheck();
            if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
        }, 1000);
    }, [isCheckingSlug, cleanSlugResult, cleanSlugErrors, handleSlugCheck, defaultService?.slug]);

    const updateSlug = useCallback((newSlug: string) => {
        slugRef.current = newSlug;
        if (slugInputRef.current) slugInputRef.current.value = newSlug;

        const currentSlug = newSlug.trim();
        const previousSlug = previousSlugRef.current?.trim();
        const slugChanged = currentSlug !== previousSlug;

        if (currentSlug) {
            const valid = isAValidSlugFormat(currentSlug);
            setIsValidSlug(valid);
            if (slugChanged && valid && !currentSlug.endsWith('-')) {
                checkSlugAvailability();
            }
        } else {
            setIsValidSlug(undefined);
        }

        previousSlugRef.current = newSlug;
    }, [checkSlugAvailability]);

    const thumbnailFileRef = { current: undefined as File | undefined };

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (readOnly) return;
        await handleAction();
    }, [handleAction, readOnly]);

    useEffect(() => {
        if (defaultService) {
            titleRef.current = defaultService.title;
            slugRef.current = defaultService.slug;
            descriptionRef.current = defaultService.description ?? '';
            priceRef.current = defaultService.price != null ? String(defaultService.price) : '';
            isActiveRef.current = defaultService.is_active;
            showPriceRef.current = defaultService.show_price;
            isHighlightRef.current = defaultService.is_highlight;
            setSelectedPortfolioId(defaultService.portfolio_id ?? undefined);
            setFeatures(defaultService.features?.length ? defaultService.features.map(f => f.title) : ['']);
            setTerms(defaultService.terms?.length ? defaultService.terms.map(t => t.title) : ['']);
        }
    }, [defaultService]);

    const getSlugStatusMessage = () => {
        if (isCheckingSlug) {
            return <p className="text-sm text-muted-foreground">Checking availability...</p>;
        }
        if (typeof isSlugAvailable === 'boolean' && defaultService?.slug !== slugRef.current) {
            if (isSlugAvailable) {
                return <p className="text-sm text-green-600">&#10003; This slug is available</p>;
            }
            return <p className="text-sm text-destructive">&#10007; This slug is already taken</p>;
        }
        return null;
    };

    return (
        <FormComponent.Container>
            {readOnly ? (
                <div
                    role="status"
                    className="mb-6 rounded-md border border-border/60 bg-fg-2/40 px-4 py-3 text-sm text-text-muted"
                >
                    This service has been blocked. You can review it here, but it cannot be edited until the block is lifted.
                </div>
            ) : null}
            <FormComponent.Form onSubmit={handleSubmit} className="relative">
                {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-bg/70 backdrop-blur-[2px]">
                        <Spinner className="size-10 text-accent" />
                    </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${readOnly ? "pointer-events-none select-none opacity-90" : ""}`}>
                    <div className="space-y-4">
                        <FormComponent.LabelInput
                            onChange={(e) => {
                                const newTitle = e.target.value;
                                titleRef.current = newTitle;
                                deleteInputErrorProperty('title');

                                if (!manuallyChangedSlug.current) {
                                    const generatedSlug = generateValidSlug(newTitle);
                                    if (generatedSlug && isAValidSlugFormat(generatedSlug)) {
                                        updateSlug(generatedSlug);
                                    } else if (!generatedSlug) {
                                        updateSlug('');
                                    }
                                }
                            }}
                            defaultValue={titleRef.current}
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
                                    const newSlug = generateValidSlug(e.target.value, { preserveTrailingHyphen: true });
                                    deleteInputErrorProperty('slug');
                                    manuallyChangedSlug.current = !!newSlug;
                                    updateSlug(newSlug);
                                }}
                                defaultValue={slugRef.current}
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
                                <p className="text-sm text-destructive">&#10007; Invalid slug format. Example: portrait-photography</p>
                            )}
                            {getSlugStatusMessage()}
                        </div>

                        <FormComponent.LabelTextarea
                            onChange={(e) => {
                                descriptionRef.current = e.target.value;
                                deleteInputErrorProperty('description');
                            }}
                            defaultValue={descriptionRef.current}
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
                                onChange={setSelectedPortfolioId}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormComponent.LabelInput
                                onChange={(e) => {
                                    priceRef.current = e.target.value;
                                    deleteInputErrorProperty('price');
                                }}
                                defaultValue={priceRef.current}
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
                                        defaultChecked={showPriceRef.current}
                                        onCheckedChange={(checked) => { showPriceRef.current = !!checked; }}
                                    />
                                    <Label htmlFor="show_price" className="text-xs text-text-muted cursor-pointer">
                                        Show price
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_active"
                                        defaultChecked={isActiveRef.current}
                                        onCheckedChange={(checked) => { isActiveRef.current = !!checked; }}
                                    />
                                    <Label htmlFor="is_active" className="text-xs text-text-muted cursor-pointer">
                                        Active
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="service-is-highlight"
                                defaultChecked={isHighlightRef.current}
                                onCheckedChange={(checked) => {
                                    deleteInputErrorProperty('is_highlight');
                                    isHighlightRef.current = checked === true;
                                }}
                                disabled={isPending}
                            />
                            <Label htmlFor="service-is-highlight" className="text-sm font-normal cursor-pointer">
                                Show on profile page
                            </Label>
                            <InfoTooltip
                                content={
                                    <p className="text-sm">
                                        When enabled, this service is highlighted on your public artist profile so visitors can find it more easily.
                                    </p>
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                            <ThumbnailInput
                                defaultUrl={defaultService?.thumbnail || undefined}
                                onFileChange={(file) => { thumbnailFileRef.current = file; }}
                                error={inputErrors?.thumbnail}
                            />
                        </FileInputProvider>

                        <DynamicListInput
                            value={features}
                            onChange={setFeatures}
                            label="Features"
                            placeholder="e.g. 2-hour session"
                        />

                        <DynamicListInput
                            value={terms}
                            onChange={setTerms}
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
                                className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-2.5 py-1 text-xs text-error"
                                title={message}
                            >
                                <span className="size-1.5 rounded-full bg-error" />
                                {field}
                            </span>
                        ))}
                    </div>
                )}

                {!readOnly ? (
                    <div className="sticky bottom-0 bg-bg p-2 mt-6">
                        <FormComponent.SubmitButton isPending={isPending} success={success}>
                            {isUpdate ? "Update Service" : "Create Service"}
                        </FormComponent.SubmitButton>
                    </div>
                ) : null}
            </FormComponent.Form>
        </FormComponent.Container>
    );
};

const ThumbnailInput = ({ defaultUrl, onFileChange, error }: {
    defaultUrl?: string
    onFileChange: (file: File | undefined) => void
    error?: string
}) => {
    const { files } = useInputFile();
    const { previewUrls } = usePreviewUrls({ defaultUrl, files });

    useEffect(() => {
        onFileChange(files?.[0]);
    }, [files]);

    return (
        <div className="space-y-1">
            <Label className="block text-xs tracking-wide text-text-muted">Thumbnail</Label>
            <div className={cn("w-full flex flex-col gap-3")}>
                {previewUrls?.length ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative aspect-video w-full max-w-[400px] overflow-hidden rounded-md border-4 border-fg-2">
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

const PortfolioSelect = ({ portfolios, value, onChange }: {
    portfolios: Portfolio[],
    value?: number,
    onChange: (value: number | undefined) => void
}) => {
    const selectedPortfolio = useMemo(() =>
        portfolios.find(p => p.id === value),
        [portfolios, value]
    );

    const [inputValue, setInputValue] = useState(selectedPortfolio?.title || '');

    // Reset input value when value prop changes externally (e.g. initial load)
    useEffect(() => {
        if (selectedPortfolio) {
            setInputValue(selectedPortfolio.title);
        } else if (!value) {
            setInputValue('');
        }
    }, [selectedPortfolio, value]);

    return (
        <div className="space-y-1">
            <Label className="block text-xs tracking-wide text-text-muted">Link to Portfolio (Optional)</Label>
            <Combobox
                value={value ? String(value) : null}
                onValueChange={(val) => {
                    onChange(val ? Number(val) : undefined);
                }}
            >
                <ComboboxInput
                    placeholder="Select a portfolio..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    showClear
                />
                <ComboboxContent>
                    <ComboboxList>
                        {portfolios.filter(p =>
                            p.title.toLowerCase().includes(inputValue.toLowerCase())
                        ).map((portfolio) => (
                            <ComboboxItem
                                key={portfolio.id}
                                value={String(portfolio.id)}
                                className="gap-2"
                            >
                                <div className="size-6 shrink-0 overflow-hidden rounded-sm bg-muted">
                                    {portfolio.thumbnail ? (
                                        <img src={portfolio.thumbnail} alt="" className="size-full object-cover" />
                                    ) : (
                                        <div className="size-full bg-muted-foreground/20" />
                                    )}
                                </div>
                                <span className="line-clamp-1">{portfolio.title}</span>
                            </ComboboxItem>
                        ))}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            <p className="text-[0.8rem] text-muted-foreground">
                Link a portfolio so clients can see related photos of this service.
            </p>
        </div>
    );
};

export default CreateOrUpdateService;