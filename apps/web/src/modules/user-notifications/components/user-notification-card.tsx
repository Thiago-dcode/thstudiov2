"use client";

import type { Media } from "@repo/common-lib/types/media";
import type {
  DeleteMediaNotificationPayload,
  MediaNotification,
  NewContactNotificationPayload,
  UserNotification,
} from "@repo/common-lib/types/user-notification";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  ImageOff,
  Loader2,
  type LucideIcon,
  Mail,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useDateTimeFormat } from "@/lib/hooks/useDateTimeFormat";
import { useRelativeTimeFormat } from "@/lib/hooks/useRelativeTimeFormat";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useUserNotifications } from "../contexts/user-notifications.provider";
import { markUserNotificationAsReadAction } from "../server-actions/user-notifications.action";

/** What each notification is about, in one glyph. Exhaustive over `NOTIFICATION_TYPE`. */
const TYPE_ICONS: Record<UserNotification["type"], LucideIcon> = {
  NEW_CONTACT: Mail,
  CREATE_UPDATE_MEDIA: Upload,
  GENERATE_MEDIA_METADATA: Sparkles,
  FAILED_GENERATE_MEDIA_METADATA: TriangleAlert,
  DELETE_MEDIA: Trash2,
};

const isInFlight = (status: Media["status"]) =>
  MediaHelper.isLoading({ status });

const useCardTranslations = () => useTranslations("atelier.notifications");

const mediaTypeCopy = (
  t: ReturnType<typeof useCardTranslations>,
  mediaType: Media["media_type"],
) => (mediaType ? t(`card.mediaType.${mediaType}`) : null);

/** Shown in place of a payload whose entity was deleted after the notification was written. */
const Unavailable = () => {
  const t = useCardTranslations();
  return (
    <span className="text-xs text-text-muted italic">
      {t("card.unavailable")}
    </span>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1 border-l-2 border-fg-2 pl-3">
    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-muted">
      {label}
    </dt>
    <dd className="break-words">{children}</dd>
  </div>
);

const MediaThumbnail = ({
  payload,
  className,
}: {
  payload: Media;
  className?: string;
}) => {
  const t = useCardTranslations();

  if (!payload.thumbnail && !payload.url) {
    // A media still being processed has no thumbnail *yet*, which is a different message from one
    // that will never have a preview at all. Rendered as a span: the preview sits inside the
    // card's button, whose content model only allows phrasing elements.
    const inFlight = isInFlight(payload.status);
    const typeLabel = mediaTypeCopy(t, payload.media_type);
    const statusLabel = t(`card.status.${payload.status}`);
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-fg-1 text-text-muted shrink-0 border border-border",
          className,
        )}
        role="img"
        aria-label={
          inFlight
            ? typeLabel
              ? t("card.statusWithType", {
                  status: statusLabel,
                  type: typeLabel,
                })
              : statusLabel
            : t("card.noThumbnail")
        }
      >
        {inFlight ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ImageOff className="size-4" aria-hidden />
        )}
      </span>
    );
  }

  return (
    <img
      src={payload.thumbnail || payload.url}
      alt={t("card.thumbnailAlt", {
        title: payload.title || payload.public_id,
      })}
      className={cn("object-cover shrink-0 border border-border", className)}
    />
  );
};

/**
 * Where the media stands, as a status dot plus a label — the same vocabulary the atelier lists
 * use. The in-flight statuses are the ones that animate; `FAILED` carries the reason inline
 * because that is the whole point of the notification. Exhaustive over `MEDIA_STATUS`, so a new
 * status has to be given a line here (TS2366) before this compiles.
 */
const MediaTypeHint = ({ mediaType }: { mediaType: Media["media_type"] }) => {
  const t = useCardTranslations();
  const typeLabel = mediaTypeCopy(t, mediaType);
  if (!typeLabel) return null;

  return (
    <>
      <span className="text-text-muted" aria-hidden>
        ·
      </span>
      <span className="uppercase tracking-[0.08em] shrink-0 text-text-muted">
        {typeLabel}
      </span>
    </>
  );
};

const MediaStatusLine = ({ payload }: { payload: Media }): ReactElement => {
  const t = useCardTranslations();
  const typeHint = <MediaTypeHint mediaType={payload.media_type} />;

  switch (payload.status) {
    case "UPLOADING":
    case "UPDATING":
    case "GENERATING_METADATA":
      return (
        <span className="flex items-center gap-1.5 text-xs text-text-muted font-normal min-w-0">
          <Loader2 className="size-3 animate-spin shrink-0" aria-hidden />
          {t(`card.status.${payload.status}`)}
          {typeHint}
        </span>
      );
    case "FAILED":
      return (
        <span className="flex items-center gap-1.5 text-xs text-error font-normal min-w-0">
          <TriangleAlert className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {payload.failed_reason || t("card.status.FAILED")}
          </span>
          {typeHint}
        </span>
      );
    case "COMPLETED":
      return (
        <span className="flex items-center gap-1.5 text-xs text-success font-normal min-w-0">
          <CircleCheck className="size-3 shrink-0" aria-hidden />
          {t("card.status.COMPLETED")}
          {typeHint}
        </span>
      );
  }
};

const MediaPreview = ({
  notification,
}: {
  notification: MediaNotification;
}) => {
  const t = useCardTranslations();
  const { payload } = notification;
  if (!payload) return <Unavailable />;

  return (
    <span className="flex items-center gap-3 min-w-0">
      <MediaThumbnail payload={payload} className="size-11" />
      <span className="flex flex-col gap-1 min-w-0">
        <span className="truncate leading-tight">
          {payload.title || t("card.untitledMedia")}
        </span>
        <MediaStatusLine payload={payload} />
      </span>
    </span>
  );
};

/** Same shape-to-frame mapping the media pickers use, so a preview is never letterboxed. */
const getShapeClass = (shape: Media["shape"]) => {
  switch (shape) {
    case "LANDSCAPE":
      return "w-56 aspect-video";
    case "PORTRAIT":
      return "w-32 aspect-[3/4]";
    default:
      return "w-40 aspect-square";
  }
};

const MediaDetails = ({
  payload,
  onNavigate,
}: {
  payload: Media | null;
  onNavigate?: () => void;
}) => {
  const t = useCardTranslations();
  if (!payload) return <Unavailable />;

  // Every child here is a direct child of the modal's `dl`, which only accepts dt/dd/div.
  return (
    <>
      <div className="flex flex-col gap-2">
        <MediaThumbnail
          payload={payload}
          className={getShapeClass(payload.shape)}
        />
        <MediaStatusLine payload={payload} />
      </div>
      <Field label={t("card.title")}>
        {payload.title || t("card.untitledMedia")}
      </Field>
      {payload.media_type && (
        <Field label={t("card.mediaTypeLabel")}>
          {mediaTypeCopy(t, payload.media_type)}
        </Field>
      )}
      <Field label={t("card.publicId")}>
        <span className="font-mono text-xs">{payload.public_id}</span>
      </Field>
      {payload.status === "FAILED" && (
        <div className="border-l-2 border-error bg-error/5 px-3 py-2 text-sm text-error">
          {payload.failed_reason || t("card.failedFallback")}
        </div>
      )}
      {payload.status === "COMPLETED" && (
        <div>
          {/* The drawer keeps its own open state, so it has to be told to close before the
              router takes the user away from it. */}
          <Button asChild variant="outline">
            <Link href="/atelier/media" onClick={onNavigate}>
              {t("card.viewMedia")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
};

const MediaMetadataDetails = ({
  payload,
  onNavigate,
}: {
  payload: Media | null;
  onNavigate?: () => void;
}) => {
  const t = useCardTranslations();

  return (
    <>
      <MediaDetails payload={payload} onNavigate={onNavigate} />
      {payload?.seo_title && (
        <Field label={t("card.seoTitle")}>{payload.seo_title}</Field>
      )}
      {payload?.seo_description && (
        <Field label={t("card.seoDescription")}>
          {payload.seo_description}
        </Field>
      )}
    </>
  );
};

const ContactPreview = ({
  payload,
}: {
  payload: NewContactNotificationPayload | null;
}) => {
  const t = useCardTranslations();
  if (!payload) return <Unavailable />;

  return (
    <span className="flex items-center gap-3 min-w-0">
      <span
        className="flex size-11 items-center justify-center border border-border bg-fg-1 text-text-muted shrink-0"
        aria-hidden
      >
        <Mail className="size-4" />
      </span>
      <span className="flex flex-col gap-1 min-w-0">
        <span className="truncate leading-tight">{payload.subject}</span>
        <span className="text-xs text-text-muted font-normal truncate">
          {t("card.contactFrom", { name: payload.contact_name })}
        </span>
      </span>
    </span>
  );
};

const DeleteMediaPreview = ({
  payload,
}: {
  payload: DeleteMediaNotificationPayload;
}) => {
  const t = useCardTranslations();

  return (
    <span className="flex items-center gap-3 min-w-0">
      <span
        className="flex size-11 items-center justify-center border border-border bg-fg-1 text-text-muted shrink-0"
        aria-hidden
      >
        <Trash2 className="size-4" />
      </span>
      <span className="flex flex-col gap-1 min-w-0">
        <span className="truncate leading-tight">{t("card.deletedMedia")}</span>
        <span className="text-xs text-text-muted font-normal truncate font-mono">
          {t("referenceValue", { id: String(payload.id) })}
        </span>
      </span>
    </span>
  );
};

const DeleteMediaDetails = ({
  payload,
}: {
  payload: DeleteMediaNotificationPayload;
}) => {
  const t = useCardTranslations();

  return (
    <Field label={t("dialog.reference")}>
      <span className="font-mono text-xs">
        {t("referenceValue", { id: String(payload.id) })}
      </span>
    </Field>
  );
};

const ContactDetails = ({
  payload,
}: {
  payload: NewContactNotificationPayload | null;
}) => {
  const t = useCardTranslations();
  if (!payload) return <Unavailable />;

  return (
    <>
      <Field label={t("card.subject")}>{payload.subject}</Field>
      <Field label={t("card.name")}>{payload.contact_name}</Field>
      <Field label={t("card.email")}>
        <a
          href={`mailto:${payload.contact_email}`}
          className="text-accent hover:underline"
        >
          {payload.contact_email}
        </a>
      </Field>
    </>
  );
};

/**
 * The two faces of a notification: `preview` is the card body, `details` fills the modal it opens.
 * A switch rather than a lookup table, so each branch reads a payload already narrowed to its own
 * type - and so a new member of the `UserNotification` union fails to compile (TS2366, no ending
 * return) until it is given both.
 */
const resolveViews = (
  notification: UserNotification,
  onNavigate?: () => void,
): { preview: ReactNode; details: ReactNode } => {
  switch (notification.type) {
    case "NEW_CONTACT":
      return {
        preview: <ContactPreview payload={notification.payload} />,
        details: <ContactDetails payload={notification.payload} />,
      };
    case "CREATE_UPDATE_MEDIA":
      return {
        preview: <MediaPreview notification={notification} />,
        details: (
          <MediaDetails
            payload={notification.payload}
            onNavigate={onNavigate}
          />
        ),
      };
    case "GENERATE_MEDIA_METADATA":
      return {
        preview: <MediaPreview notification={notification} />,
        details: (
          <MediaMetadataDetails
            payload={notification.payload}
            onNavigate={onNavigate}
          />
        ),
      };
    case "FAILED_GENERATE_MEDIA_METADATA":
      return {
        preview: <MediaPreview notification={notification} />,
        details: (
          <MediaMetadataDetails
            payload={notification.payload}
            onNavigate={onNavigate}
          />
        ),
      };
    case "DELETE_MEDIA":
      return {
        preview: <DeleteMediaPreview payload={notification.payload} />,
        details: <DeleteMediaDetails payload={notification.payload} />,
      };
  }
};

export const UserNotificationCard = ({
  userNotification,
  onNavigate,
}: {
  userNotification: UserNotification;
  /** Called before a details view navigates away, so the host (the drawer) can close itself. */
  onNavigate?: () => void;
}) => {
  const t = useCardTranslations();
  const formatDateTime = useDateTimeFormat();
  const formatRelative = useRelativeTimeFormat();
  const { updateUserNotification } = useUserNotifications();
  const { preview, details } = resolveViews(userNotification, onNavigate);
  const typeLabel = t(`types.${userNotification.type}`);
  const TypeIcon = TYPE_ICONS[userNotification.type];
  const unread = !userNotification.read_at;

  // Opening the modal is what counts as reading it. The result goes back into the provider so the
  // card, the list order and the bell's unread dot all settle without a refetch; nothing renders
  // `isPending`, because a read stamp the user did not ask for should not be something they wait
  // on - and a failure leaves the notification unread, which is the honest outcome.
  const { handleAction } = useHandleAction({
    action: () => markUserNotificationAsReadAction(userNotification.id),
    afterAction: async ({ data }) => {
      if (data) updateUserNotification(data);
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (open && unread) void handleAction();
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("openAria", { type: typeLabel })}
          // The accent edge is the whole unread signal: with square corners a left rule reads
          // faster than a badge, and it keeps the card body free for content.
          className={cn(
            "group w-full border border-l-2 px-3 py-2.5 text-left text-sm",
            "flex flex-col gap-2 transition-colors duration-150",
            unread
              ? "border-border border-l-accent bg-fg text-text hover:bg-fg-1"
              : "border-border border-l-border bg-fg/60 text-text-muted hover:bg-fg-1 hover:text-text",
          )}
        >
          {/* Type + age: what happened and when, before the eye reaches the payload. */}
          <span className="flex items-center gap-2 w-full min-w-0">
            <TypeIcon
              className={cn(
                "size-3.5 shrink-0",
                unread ? "text-accent" : "text-text-muted",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "text-[11px] uppercase tracking-[0.08em] truncate",
                unread ? "font-medium text-text" : "text-text-muted",
              )}
            >
              {typeLabel}
            </span>
            <span
              className="ml-auto shrink-0 text-[11px] text-text-muted tabular-nums"
              title={formatDateTime(userNotification.updated_at) ?? undefined}
            >
              {formatRelative(userNotification.updated_at)}
            </span>
            <ChevronRight
              className="size-3.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          </span>

          <span className={cn("min-w-0", unread && "font-medium")}>
            {preview}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg w-screen">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base pr-6">
            <TypeIcon className="size-4 shrink-0 text-text-muted" aria-hidden />
            {typeLabel}
          </DialogTitle>
          <DialogDescription>
            {t("dialog.description", {
              date: formatDateTime(userNotification.updated_at) ?? "",
            })}
          </DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col gap-4 text-sm">{details}</dl>
      </DialogContent>
    </Dialog>
  );
};
