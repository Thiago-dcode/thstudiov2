'use client'

import { useState, useMemo, useRef } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger, DrawerClose, DrawerHeader, DrawerFooter } from "@repo/ui/components/shadcn/drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/shadcn/tabs";
import { Label } from "@repo/ui/components/shadcn/label";
import { Button } from "@repo/ui/components/shadcn/button";
import FormComponent from "@/lib/components/form-component";
import { X } from "lucide-react";
import { Media } from "@repo/common-lib/types/media";
import { format } from "date-fns";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updateMediaAction } from "@/modules/media/server-actions/update-media.action";

type MediaCardProps = {
  media: Media;
  username: string;
};

export function MediaCard({ media, username }: MediaCardProps) {
  const [currentMedia, setCurrentMedia] = useState(media);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overall');
  const formRef = useRef<HTMLFormElement>(null);

  const {handleSubmit,isPending,inputErrors,cleanErrors,reset} = useHandleAction({
    action:async (formData) =>{
      return updateMediaAction(currentMedia.id,formData);
    },
    afterAction:async (result)=>{

      if(result.data){
        setIsEditing(false);
        setCurrentMedia(result.data);
        reset();
      }

    }

  })
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
    formRef.current?.reset();
    cleanErrors();
    setIsEditing(false);
  };

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <article className="group cursor-pointer flex flex-col p-2">
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
      <DrawerContent className="h-full w-[600px] max-w-[90vw] right-0 left-auto rounded-l-lg rounded-t-none">
        <DrawerHeader className="border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              {isEditing ? 'Edit Media' : (currentMedia.title || currentMedia.seo_filename || 'Media Preview')}
        </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        {isEditing ? (
          <FormComponent.Form 
            key={currentMedia.id} 
            ref={formRef} 
            onSubmit={handleSubmit} 
            className="h-full flex flex-col"
          >
            <div className="flex-1 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="px-6 pt-6 border-b bg-fg-1/60">
                  <TabsList className="w-full grid grid-cols-2 h-10 bg-transparent p-0 gap-1">
                    <TabsTrigger 
                      value="overall" 
                      className="rounded-md font-medium transition-all cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-fg-2"
                    >
                      Overall Info
                    </TabsTrigger>
                    <TabsTrigger 
                      value="seo" 
                      className="rounded-md font-medium transition-all cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-fg-2"
                    >
                      SEO
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <TabsContent value="overall" className="space-y-6 mt-0">
                    <FormComponent.LabelInput
                      id="title"
                      name="title"
                      label="Title"
                      defaultValue={currentMedia.title || ''}
                      placeholder="Enter title"
                      labelClassName="text-sm font-medium text-foreground"
                      error={inputErrors?.title}
                    />
                    <FormComponent.LabelTextarea
                      id="description"
                      name="description"
                      label="Description"
                      defaultValue={currentMedia.description || ''}
                      placeholder="Enter description"
                      rows={6}
                      labelClassName="text-sm font-medium text-foreground"
                      error={inputErrors?.description}
                    />
                  </TabsContent>
                  <TabsContent value="seo" className="space-y-6 mt-0">
                    <FormComponent.LabelInput
                      id="seo_title"
                      name="seo_title"
                      label="SEO Title"
                      defaultValue={currentMedia.seo_title || ''}
                      placeholder="Enter SEO title"
                      labelClassName="text-sm font-medium text-foreground"
                      extraInfo="The title that appears in search engine results and browser tabs. Helps improve search visibility."
                      error={inputErrors?.seo_title}
                    />
                    <FormComponent.LabelTextarea
                      id="seo_description"
                      name="seo_description"
                      label="SEO Description"
                      defaultValue={currentMedia.seo_description || ''}
                      placeholder="Enter SEO description"
                      rows={5}
                      labelClassName="text-sm font-medium text-foreground"
                      extraInfo="A brief summary that appears in search results. Helps users understand what the image is about before clicking."
                      error={inputErrors?.seo_description}
                    />
                    <FormComponent.LabelInput
                      id="seo_alt"
                      name="seo_alt"
                      label="Alt Text"
                      defaultValue={currentMedia.seo_alt || ''}
                      placeholder="Enter alt text for accessibility"
                      labelClassName="text-sm font-medium text-foreground"
                      extraInfo="A text description of the image for screen readers and when images fail to load. Improves accessibility and SEO."
                      error={inputErrors?.seo_alt}
                    />
                    <FormComponent.LabelInput
                      id="seo_filename"
                      name="seo_filename"
                      label="Filename"
                      defaultValue={currentMedia.seo_filename || ''}
                      placeholder="Enter filename"
                      disabled
                      inputClassName="bg-fg-2 cursor-not-allowed opacity-60"
                      labelClassName="text-sm font-medium text-foreground"
                      extraInfo="The original filename of the uploaded file. Cannot be changed after upload."
                      error={inputErrors?.seo_filename}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            <DrawerFooter className="border-t px-6 py-4 bg-fg-1/60">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 hover:bg-fg-2 hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  className="flex-1"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DrawerFooter>
          </FormComponent.Form>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="mb-6 border-b border-border">
                  <TabsList className="w-full grid grid-cols-2 bg-transparent h-auto p-0 gap-1">
                    <TabsTrigger 
                      value="overall" 
                      className="rounded-none border-b-2 border-transparent cursor-pointer data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border-b-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:border-b-muted-foreground/50 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium text-sm transition-all"
                    >
                      Overall Info
                    </TabsTrigger>
                    <TabsTrigger 
                      value="seo" 
                      className="rounded-none border-b-2 border-transparent cursor-pointer data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border-b-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:border-b-muted-foreground/50 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium text-sm transition-all"
                    >
                      SEO
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="overall" className="space-y-6 mt-0">
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
                </TabsContent>
                <TabsContent value="seo" className="space-y-6 mt-0">
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
                </TabsContent>
              </Tabs>
              </div>
            </div>
            <DrawerFooter className="border-t px-6 py-4 bg-fg-1/60">
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
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

