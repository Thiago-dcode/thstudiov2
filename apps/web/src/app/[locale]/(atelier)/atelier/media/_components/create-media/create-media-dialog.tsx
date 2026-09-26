"use client";

import type { CreateMediaInputWithFile } from "@repo/common-lib/types/media";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { useInputFile } from "@repo/ui/contexts/file.provider";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useMedia } from "@/modules/media/providers/media.provider";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { creditsSpentBy, MAX_FILES } from "./staged-media.utils";
import { StagedMediaGrid } from "./staged-media-grid";
import { UploadSettingsPanel } from "./upload-settings-panel";

export function CreateMediaDialog({
  openFromQuery = false,
}: {
  /** When true, `?open=1` opens this dialog (and clears the query). */
  openFromQuery?: boolean;
}) {
  const t = useTranslations("atelier.media.upload");
  const router = useRouter();
  const searchParams = useSearchParams();
  const openParam = searchParams.get("open");
  const [open, setOpen] = useState(false);
  const {
    handleUploadInserts,
    handleRemoveCompleted,
    addMediaUploads,
    mediaStagedToCreate,
  } = useMedia();
  const { files } = useInputFile();
  const { session } = useSession();
  const { metrics, aiCreditsInfo } = useUserMetrics();

  const storageUsed = metrics?.extra_data.storage_used_mb ?? 0;
  const storageLimit = metrics?.active_plan.storage_limit_mb ?? 0;
  const isStorageFull = storageLimit > 0 && storageUsed >= storageLimit;
  const hasStagedMedia = mediaStagedToCreate.length > 0;

  const addedFilesRef = useRef(new Set<File>());

  useEffect(() => {
    if (!openFromQuery || openParam !== "1") return;
    setOpen(true);
    router.replace("/atelier/media");
  }, [openFromQuery, openParam, router]);

  // Previews are minted here rather than taken from `usePreviewUrls`, because a preview outlives
  // the selection that produced it: once a file is handed to the provider its card stays on screen
  // while it uploads, and picking a second batch replaces `files` — which had `usePreviewUrls`
  // revoke the first batch's URLs out from under the cards still rendering them. The provider is
  // now the sole owner and revokes in `removeMediaUpload` / `handleRemoveCompleted`.
  useEffect(() => {
    if (!files?.length || !session) return;

    const newMediaUploads: (CreateMediaInputWithFile & {
      previewUrl?: string;
    })[] = [];

    // The AI SEO checkbox only patches files that already exist. When "add more" appends a
    // second batch, inherit the same on/off intent (and the same credit budget) so new cards
    // are not silently excluded from metadata generation.
    const metadataEnabled = mediaStagedToCreate.some(
      (m) => m.input.generate_metadata,
    );
    let spent = creditsSpentBy(mediaStagedToCreate, aiCreditsInfo);

    for (const file of Array.from(files)) {
      if (addedFilesRef.current.has(file)) continue;
      addedFilesRef.current.add(file);

      let generate_metadata = false;
      if (metadataEnabled && aiCreditsInfo.hasCredits) {
        const cost = aiCreditsInfo.costFor(
          MediaHelper.getMediaTypeFromMimeType(file.type),
        );
        if (spent + cost <= aiCreditsInfo.remaining) {
          spent += cost;
          generate_metadata = true;
        }
      }

      newMediaUploads.push({
        file,
        previewUrl: URL.createObjectURL(file),
        user_id: session.id,
        generate_metadata,
      });
    }

    if (newMediaUploads.length > 0) {
      addMediaUploads(newMediaUploads);
    }
  }, [files, session, addMediaUploads, mediaStagedToCreate, aiCreditsInfo]);

  if (!session) return null;

  if (isStorageFull) {
    return (
      <Button
        className="p-2 text-sm!"
        variant="default"
        size="default"
        disabled
        title={t("storageFullTitle", {
          used: (storageUsed / 1024).toFixed(1),
          limit: (storageLimit / 1024).toFixed(1),
        })}
      >
        <Plus className="h-4 w-4" />
        {t("createMedia")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs! " variant="default" size="sm">
          <Plus className="h-4 w-4" />
          {t("upload")}
        </Button>
      </DialogTrigger>
      <DialogContent className="z-100 flex h-full max-h-[98vh] w-full max-w-[100vw] flex-col justify-between p-0 phone-lg:max-w-2xl tablet:max-w-3xl tablet-lg:max-w-[calc(100vw-4rem)] desktop-lg:max-w-[112rem] [&>button]:hidden">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle className="text-sm!">{t("createNewMedia")}</DialogTitle>
          <DialogDescription className="text-xs!">
            {t("uploadUpToImages", { max: MAX_FILES })}
          </DialogDescription>
        </DialogHeader>

        {/* Media left, settings right, from `tablet-lg` up. The grid comes first in the DOM so
            desktop tab order follows the columns left to right; `order-first` is what keeps the
            settings above the files on phones, where the stacked layout is unchanged. */}
        <div className="flex min-h-0 flex-1 flex-col tablet-lg:flex-row">
          <section className="flex min-h-0 flex-1 flex-col p-4 tablet-lg:p-6">
            <StagedMediaGrid />
          </section>

          {hasStagedMedia && (
            <aside className="order-first shrink-0 px-4 pt-4 tablet-lg:order-none tablet-lg:w-80 laptop:w-96 desktop:w-[26rem] tablet-lg:overflow-y-auto tablet-lg:border-l tablet-lg:border-border tablet-lg:px-6 tablet-lg:py-6">
              <UploadSettingsPanel />
            </aside>
          )}
        </div>

        <DialogFooter className="full flex flex-row gap-2 border-t p-2">
          {/* Driven by what is actually stageable, not by `files` — that only tracks the last
              selection, so the button lingered after every card had been removed or sent and did
              nothing when clicked. */}
          {hasStagedMedia ? (
            <Button
              onClick={async () => {
                setOpen(false);
                await handleUploadInserts();
              }}
              variant={"primary"}
              className="w-full"
            >
              {t("uploadButton", { count: mediaStagedToCreate.length })}
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button
              onClick={() => {
                handleRemoveCompleted();
                setOpen(false);
              }}
              variant="destructive"
              size={"sm"}
              className="w-full max-w-32"
            >
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
