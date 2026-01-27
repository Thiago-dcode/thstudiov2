'use client'

import { useState, useMemo, useRef, ReactNode } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger, DrawerClose, DrawerHeader, DrawerFooter } from "@repo/ui/components/shadcn/drawer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/shadcn/tabs";
import { Label } from "@repo/ui/components/shadcn/label";
import { Button } from "@repo/ui/components/shadcn/button";
import FormComponent from "@/lib/components/form-component";
import { bytesToMB } from '@repo/common-lib/utils/bytes';
import { X, Sparkles, Upload } from "lucide-react";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { format } from "date-fns";
import { cn } from "@repo/ui/lib/utils";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { getMediaSeoAction } from "@/modules/ai/actions/get-media-seo.action";
import { useMedia, UploadMedia } from "@/modules/media/providers/media.provider";


type MediaCardProps = {
  media: Media;
  username: string;
};
type Tabs = 'overall' | 'seo';
const TABS: Tabs[] = ['overall', 'seo'];

const TAB_CONFIG: Record<Tabs, { label: string }> = {
  overall: { label: 'Overall Info' },
  seo: { label: 'SEO' },
};

type TabTriggerProps = {
  tab: Tabs;
  selected?: boolean;
  disabled?: boolean;
};

function MediaTabTrigger({ tab, selected = false, disabled = false }: TabTriggerProps) {
  const className = cn(
    // Base styles
    "font-medium transition-colors duration-200 rounded-md px-4 py-2",
    // Disabled state
    disabled && [
      "cursor-not-allowed opacity-50",
    ],
    // Enabled state
    !disabled && [
      "cursor-pointer",
    ],
    // Selected state
    selected && [
      "bg-background",
      "text-foreground",
      "shadow-sm",
      "font-semibold",
      "border",
      "border-border",
      "ring-1",
      "ring-ring/20",
    ],
    // Unselected state
    !selected && !disabled && [
      "text-muted-foreground",
      "hover:text-foreground/80",
      "hover:bg-fg-2/50",
    ]
  );

  return (
    <TabsTrigger
      value={tab}
      className={className}
      data-selected={selected}
      disabled={disabled}
    >
      {TAB_CONFIG[tab].label}
    </TabsTrigger>
  );
}

type MediaTabProps = {
  activeTab: Tabs;
  onTabChange: (value: string) => void;
  renderTabContent: (tab: Tabs) => ReactNode;
  disabled?: boolean;
};

function MediaTab({ activeTab, onTabChange, renderTabContent, disabled = false }: MediaTabProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <Tabs value={activeTab} onValueChange={disabled ? undefined : onTabChange} className="h-full flex flex-col">
        <div className="px-6 pt-6">
          <TabsList className="w-full grid grid-cols-2 h-10 bg-transparent p-0 gap-1 rounded-none">
            {TABS.map((tab) => (
              <MediaTabTrigger key={tab} tab={tab} selected={activeTab === tab} disabled={disabled} />
            ))}
          </TabsList>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-6 mt-0">
              {renderTabContent(tab)}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

type MediaDrawerFooterProps = {
  children: ReactNode;
};

function MediaDrawerFooter({ children }: MediaDrawerFooterProps) {
  return (
    <DrawerFooter className="border-t px-6 py-4 bg-fg-1/60">
      <div className="flex gap-3 w-full">
        {children}
      </div>
    </DrawerFooter>
  );
}

export function EditMediaCard({ media, username }: MediaCardProps) {
  const [currentMedia, setCurrentMedia] = useState(media);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tabs>('overall');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const seoTitleRef = useRef<HTMLInputElement>(null);
  const seoDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const seoAltRef = useRef<HTMLInputElement>(null);
  const seoFilenameRef = useRef<HTMLInputElement>(null);
  const { metrics, refresh } = useUserMetrics();
  const { setMediUploadByMediaId, mediaUploads, getMediaUploadByMediaId, uploadSingleMedia, deleteMediaUploadByMediaId } = useMedia()

  //cached 
  const currentMediaUpload = useMemo(() => getMediaUploadByMediaId(currentMedia.id), [mediaUploads, currentMedia.id]);

  // Helper variables for cleaner access
  const inputErrors = currentMediaUpload?.error?.inputErrors;

const onSuccess =async (updatedMedia:Media)=>{
  console.log('ON SUCCESS CALLED',updatedMedia)
        
  setCurrentMedia(updatedMedia);
  deleteMediaUploadByMediaId(updatedMedia.id);
  setIsEditing(false);
  setActiveTab('seo')

};
  const {
    handleAction: handleGenerateSeo,
    isPending: isGeneratingSeo
  } = useHandleAction({
    action: async () => {
      if (!currentMedia.user_id || !currentMedia.id) {
        return {
          errors: ['User ID and Media ID are required'],
          data: null,
          inputErrors: undefined
        };
      }
      setActiveTab('seo')
      return getMediaSeoAction({
        user_id: currentMedia.user_id,
        media_id: currentMedia.id
      });
    },
    afterAction: async (result) => {
      if (result.data?.seo) {
        const seo = result.data.seo;


        // Get existing media upload or create a new one with all required fields
        const existingUpload = currentMediaUpload || {
          input: {
            user_id: currentMedia.user_id!,
            title: currentMedia.title || undefined,
            description: currentMedia.description || undefined,
            seo_title: currentMedia.seo_title || undefined,
            seo_description: currentMedia.seo_description || undefined,
            seo_alt: currentMedia.seo_alt || undefined,
            seo_filename: currentMedia.seo_filename || '',
          },
          onSuccess,
          id: currentMedia.id,
          pending: false,
        };

        // Update media upload with AI-generated SEO data
        // This will automatically update the controlled inputs via getFieldValue
        setMediUploadByMediaId(currentMedia.id, {
          ...existingUpload,
          data: undefined,
          previewUrl: currentMedia.url,
          error: undefined,
          pending: false,
          onSuccess,
          input: {
            ...existingUpload.input,
            seo_title: seo.seo_title || existingUpload.input.seo_title,
            seo_description: seo.seo_description || existingUpload.input.seo_description,
            seo_alt: seo.seo_alt || existingUpload.input.seo_alt,
            seo_filename: seo.seo_filename || existingUpload.input.seo_filename,
          },
        });

        //Refresh user metrics
        await refresh()
        // Switch to SEO tab to show the generated content
        setActiveTab('seo');
      }
    }
  });
  const isPending = (currentMediaUpload?.pending ) || isGeneratingSeo;
  // Format date - use updated_at if available, otherwise fallback to created_at
  const formattedDate = useMemo(() => {
    const dateValue = currentMedia.updated_at || currentMedia.created_at;
    if (!dateValue) return null;
    try {
      return format(new Date(dateValue), 'MMM d, yyyy');
    } catch {
      return null;
    }
  }, [currentMedia.updated_at, currentMedia.created_at]);

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    // Reset to original media state
    setCurrentMedia(media);
    // Delete media upload if exists
    if (currentMediaUpload?.id) {
      deleteMediaUploadByMediaId(currentMediaUpload.id);
    }
    setIsEditing(false);
    setShowCancelDialog(false);
  };

  // Handle update - upload the media using the provider
  const handleUpdate = async () => {
    if (!currentMediaUpload || !currentMedia.id) {
      return;
    }

    // Find the index of the current media upload
    const index = mediaUploads.findIndex(m => m.id === currentMedia.id || m.data?.id === currentMedia.id);
    if (index === -1) return;

    await uploadSingleMedia(currentMediaUpload, index);

    // Update currentMedia with the result if successful
    const updatedUpload = getMediaUploadByMediaId(currentMedia.id);
    if (updatedUpload?.data) {
      setCurrentMedia(updatedUpload.data);
      setIsEditing(false);
    }
  };

  // Handle form submission - upload the media using the provider
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleUpdate();
  };


  const handleInputChange = (key: keyof UpdateMediaInput, value: string) => {
    if (!currentMedia.id || !currentMedia.user_id || isPending) return;
    if ((currentMediaUpload?.input[key] ?? currentMedia[key as keyof Media]) === value) return;

    // Get existing media upload or create a new one with all required fields
    const existingUpload = currentMediaUpload || {
      input: {
        user_id: currentMedia.user_id,
        title: currentMedia.title || undefined,
        description: currentMedia.description || undefined,
        seo_title: currentMedia.seo_title || undefined,
        seo_description: currentMedia.seo_description || undefined,
        seo_alt: currentMedia.seo_alt || undefined,
        seo_filename: currentMedia.seo_filename || '',
      },
      id: currentMedia.id,
      pending: false,
    };

    // Update the input field with the new value
    // For seo_filename, preserve existing value if new value is empty (since it's required in CreateMediaInputWithFile)
    const updatedValue = value || (key === 'seo_filename' ? existingUpload.input.seo_filename || currentMedia.seo_filename || '' : undefined);

    const updatedUpload: UploadMedia = {
      ...existingUpload,
      data: undefined,
      error: undefined,
      pending: false,
      onSuccess,
      previewUrl: currentMedia.thumbnail || undefined,
      input: {
        ...existingUpload.input,
        [key]: updatedValue,
      },
    };

    // Check if nothing has changed by comparing input fields with currentMedia
    const inputFields: (keyof UpdateMediaInput)[] = ['title', 'description', 'seo_title', 'seo_description', 'seo_alt', 'seo_filename'];
    let hasChanged = false;

    for (const key of inputFields) {
      const updatedValue = updatedUpload.input[key];
      const currentValue = currentMedia[key as keyof Media];
      
      // Normalize undefined/null/empty string for comparison
      const normalizedUpdated = updatedValue ?? '';
      const normalizedCurrent = currentValue ?? '';
      
      if (normalizedUpdated !== normalizedCurrent) {
        hasChanged = true;
        break;
      }
    }

    // If nothing has changed, delete the upload and return
    if (!hasChanged) {
      if (currentMediaUpload?.id) {
        deleteMediaUploadByMediaId(currentMediaUpload.id);
      }
      return;
    }


    setMediUploadByMediaId(currentMedia.id, updatedUpload);
  };
  const handleTabChange = (value: string) => {
    if (isGeneratingSeo) return;
    setActiveTab(value as Tabs);
  };

  // Calculate AI credits
  const aiCreditsInfo = useMemo(() => {
    if (!metrics?.extra_data || !metrics?.active_plan) return null;
    const consumed = metrics.extra_data.ai_credits_consumed || 0;
    const total = (metrics.extra_data.ai_credits || 0) + (metrics.active_plan.ai_credits || 0);
    return { consumed, total };
  }, [metrics]);

  // Get the current value for a field (from upload if exists, otherwise from currentMedia)
  const getFieldValue = (key: keyof UpdateMediaInput): string => {
    if (currentMediaUpload?.input[key]) {
      return String(currentMediaUpload.input[key] || '');
    }
    return String(currentMedia[key as keyof Media] || '');
  };

  const renderEditTabContent = (tab: Tabs) => {
    switch (tab) {
      case 'overall':
        return (
          <>
            <FormComponent.LabelInput
              id="title"
              name="title"
              label="Title"
              value={getFieldValue('title')}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter title"
              labelClassName="text-sm font-medium text-foreground"
              error={inputErrors?.title}
              disabled={isGeneratingSeo || isPending}
            />
            <FormComponent.LabelTextarea
              id="description"
              name="description"
              label="Description"
              value={getFieldValue('description')}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description"
              rows={6}
              labelClassName="text-sm font-medium text-foreground"
              error={inputErrors?.description}
              disabled={isGeneratingSeo || isPending}
            />
          </>
        );
      case 'seo':
        return (
          <>
            <FormComponent.LabelInput
              ref={seoTitleRef}
              id="seo_title"
              name="seo_title"
              label="SEO Title"
              value={getFieldValue('seo_title')}
              onChange={(e) => handleInputChange('seo_title', e.target.value)}
              placeholder="Enter SEO title"
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="The title that appears in search engine results and browser tabs. Helps improve search visibility."
              error={inputErrors?.seo_title}
              disabled={isGeneratingSeo || isPending}
            />
            <FormComponent.LabelTextarea
              ref={seoDescriptionRef}
              id="seo_description"
              name="seo_description"
              label="SEO Description"
              value={getFieldValue('seo_description')}
              onChange={(e) => handleInputChange('seo_description', e.target.value)}
              placeholder="Enter SEO description"
              rows={5}
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="A brief summary that appears in search results. Helps users understand what the image is about before clicking."
              error={inputErrors?.seo_description}
              disabled={isGeneratingSeo || isPending}
            />
            <FormComponent.LabelInput
              ref={seoAltRef}
              id="seo_alt"
              name="seo_alt"
              label="Alt Text"
              value={getFieldValue('seo_alt')}
              onChange={(e) => handleInputChange('seo_alt', e.target.value)}
              placeholder="Enter alt text for accessibility"
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="A text description of the image for screen readers and when images fail to load. Improves accessibility and SEO."
              error={inputErrors?.seo_alt}
              disabled={isGeneratingSeo || isPending}
            />
            <FormComponent.LabelInput
              ref={seoFilenameRef}
              id="seo_filename"
              name="seo_filename"
              label="Filename"
              value={getFieldValue('seo_filename')}
              onChange={(e) => handleInputChange('seo_filename', e.target.value)}
              placeholder="Enter filename"
              labelClassName="text-sm font-medium text-foreground"
              extraInfo="The filename used for SEO purposes. Can be edited to improve search visibility."
              error={inputErrors?.seo_filename}
              disabled={isGeneratingSeo || isPending}
            />
          </>
        );
    }
  };

  const renderPreviewTabContent = (tab: Tabs) => {
    switch (tab) {
      case 'overall':
        return (
          <>
            {currentMedia.title && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Title</Label>
                <p className="text-sm text-foreground leading-relaxed">{currentMedia.title}</p>
              </div>
            )}
            {currentMedia.description && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Description</Label>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentMedia.description}</p>
              </div>
            )}
            {formattedDate && (
              <div className="space-y-2 pt-4">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Last Updated</Label>
                <p className="text-sm text-foreground">{formattedDate}</p>
              </div>
            )}
          </>
        );
      case 'seo':
        return (
          <>
            {currentMedia.seo_title && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">SEO Title</Label>
                <p className="text-sm text-foreground leading-relaxed">{currentMedia.seo_title}</p>
              </div>
            )}
            {currentMedia.seo_description && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">SEO Description</Label>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentMedia.seo_description}</p>
              </div>
            )}
            {currentMedia.seo_alt && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Alt Text</Label>
                <p className="text-sm text-foreground leading-relaxed">{currentMedia.seo_alt}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Filename</Label>
              <p className="text-xs font-mono text-foreground bg-fg-2 px-3 py-2 rounded-md">{currentMedia.seo_filename}</p>
            </div>
          </>
        );
    }
  };



  return (
    <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <div className="relative">
        {currentMediaUpload && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate();
            }}
            variant="secondary"
            size="icon"
            disabled={isPending}
            className="absolute top-2 left-2 z-20 shadow-md rounded-full"
          >
            {isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        )}
        <DrawerTrigger asChild disabled={isPending}>
          <article
            className={cn(
              "group flex flex-col p-2",
              isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
            onClick={(e) => {
              if (isPending) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
          {/* Image Section - Floating */}
          <div className="relative aspect-square flex items-center justify-center overflow-hidden rounded-lg mb-2">
            {currentMedia.thumbnail ? (
              <img
                src={currentMedia.thumbnail}
                alt={currentMedia.seo_alt || currentMedia.title || `${username} media`}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="flex items-center justify-center text-muted-foreground text-xs bg-fg-2 rounded-lg w-full h-full">
                No preview
              </div>
            )}
            {/* Loading Overlay */}
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
                <Spinner className="size-12 text-white" />
              </div>
            )}
          </div>

          {/* Title and Date - Stacked at Bottom */}
          <div className="flex flex-col">
            <h3 className="text-xs font-medium text-foreground line-clamp-1">
              {currentMedia.title || currentMedia.seo_filename || 'Untitled'}
            </h3>
            {formattedDate && (
              <p className="text-[10px] text-muted-foreground">
                {formattedDate}
              </p>
            )}
          </div>
        </article>
      </DrawerTrigger>
      </div>
      <DrawerContent
        className="h-full w-[600px] max-w-[90vw] right-0 left-auto rounded-l-lg rounded-t-none opacity-90"
        onInteractOutside={(e) => {
          if (isGeneratingSeo) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          if (isGeneratingSeo) {
            e.preventDefault();
          }
        }}
      >
        <DrawerHeader className="border-b p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-end justify-start gap-2">
              <DrawerTitle className="font-semibold">
                {isEditing ? 'Edit Media' : (currentMedia.title || currentMedia.seo_filename || 'Media Preview')}
              </DrawerTitle>
              {currentMedia.bytes && !isEditing && (
                <p className="text-xs text-muted-foreground text-center">
                  ({bytesToMB(currentMedia.bytes).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "bg-accent text-accent-fg border-accent hover:bg-accent/90 hover:text-accent-fg",
                      "transition-colors duration-200 h-8 px-2.5"
                    )}
                    onClick={handleGenerateSeo}
                    disabled={isGeneratingSeo}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs font-medium">
                      {isGeneratingSeo ? 'Generating...' : 'AI SEO'}
                    </span>
                  </Button>
                  <div className="flex items-center gap-0.5">
                    <InfoTooltip
                      content="Automatically generate SEO fields with AI. Analyzes your image content and generates optimized titles, descriptions, alt text, and filenames for better search visibility."
                      openDelay={200}
                      iconClassName="w-3 h-3"
                    />
                    {aiCreditsInfo && (
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        {aiCreditsInfo.consumed}/{aiCreditsInfo.total}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!isGeneratingSeo && (
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              )}
              {isGeneratingSeo && (
                <Button variant="ghost" size="icon" disabled>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DrawerHeader>
        {isEditing ? (
          <FormComponent.Form
            key={currentMedia.id}
            onSubmit={handleSubmit}
            className=""
          >
            <MediaTab
              activeTab={activeTab}
              onTabChange={handleTabChange}
              renderTabContent={renderEditTabContent}
              disabled={isGeneratingSeo}
            />
            <MediaDrawerFooter>
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1 hover:bg-fg-2 hover:text-foreground"
                disabled={isGeneratingSeo}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="flex-1"
                disabled={isPending || isGeneratingSeo || !currentMediaUpload || !currentMedia}
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </MediaDrawerFooter>
          </FormComponent.Form>
        ) : (
          <>
            <MediaTab
              activeTab={activeTab}
              onTabChange={handleTabChange}
              renderTabContent={renderPreviewTabContent}
            />
            <MediaDrawerFooter>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="default"
                  className="flex-1"
                >
                  Edit
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1 hover:bg-fg-2 hover:text-foreground">
                    Close
                  </Button>
                </DrawerClose>
              </div>
            </MediaDrawerFooter>
          </>
        )}
      </DrawerContent>
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md max-h-[300px]">
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="base"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}

