"use client";

import type { Media } from "@repo/common-lib/types/media";
import type {
  MediaNotification,
  NewContactNotificationPayload,
  UserNotification,
} from "@repo/common-lib/types/user-notification";
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
  CircleCheck,
  ImageOff,
  Loader2,
  type LucideIcon,
  Mail,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useDateTimeFormat } from "@/lib/hooks/useDateTimeFormat";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useUserNotifications } from "../contexts/user-notifications.provider";
import { markUserNotificationAsReadAction } from "../server-actions/user-notifications.action";

/** What each media notification is about, in one glyph. */
const MEDIA_TYPE_ICONS: Record<MediaNotification["type"], LucideIcon> = {
  CREATE_UPDATE_MEDIA: Upload,
  GENERATE_MEDIA_METADATA: Sparkles,
};

/** The statuses a media is still moving through, so the card animates instead of concluding. */
const isInFlight = (status: Media["status"]) =>
  status === "UPLOADING" || status === "UPDATING";

const useCardTranslations = () => useTranslations("atelier.notifications");

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
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs uppercase tracking-wide text-text-muted">{label}</dt>
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
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-fg-2 text-text-muted shrink-0",
          className,
        )}
        role="img"
        aria-label={
          inFlight ? t(`card.status.${payload.status}`) : t("card.noThumbnail")
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
      className={cn("object-cover shrink-0", className)}
    />
  );
};

/**
 * Where the media stands. The in-flight statuses are the ones that animate; `FAILED` carries the
 * reason inline because that is the whole point of the notification. Exhaustive over
 * `MEDIA_STATUS`, so a new status has to be given a line here (TS2366) before this compiles.
 */
const MediaStatusLine = ({ payload }: { payload: Media }): ReactElement => {
  const t = useCardTranslations();

  switch (payload.status) {
    case "UPLOADING":
    case "UPDATING":
      return (
        <span className="flex items-center gap-1.5 text-xs text-text-muted font-normal">
          <Loader2 className="size-3 animate-spin shrink-0" aria-hidden />
          {t(`card.status.${payload.status}`)}
        </span>
      );
    case "FAILED":
      return (
        <span className="flex items-center gap-1.5 text-xs text-error font-normal min-w-0">
          <TriangleAlert className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {payload.failed_reason || t("card.status.FAILED")}
          </span>
        </span>
      );
    case "COMPLETED":
      return (
        <span className="flex items-center gap-1.5 text-xs text-success font-normal">
          <CircleCheck className="size-3 shrink-0" aria-hidden />
          {t("card.status.COMPLETED")}
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

  const Icon = MEDIA_TYPE_ICONS[notification.type];

  return (
    <span className="flex items-center gap-2 min-w-0">
      <MediaThumbnail payload={payload} className="size-9" />
      <span className="flex flex-col min-w-0">
        <Icon className="size-3 text-text-muted" aria-hidden />
        <span className="truncate">
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
      <Field label={t("card.publicId")}>{payload.public_id}</Field>
      {payload.status === "FAILED" && (
        <div className="text-sm text-error">
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
    <span className="flex items-start gap-2 min-w-0">
      <Mail className="size-4 mt-0.5 text-text-muted shrink-0" aria-hidden />
      <span className="flex flex-col min-w-0">
        <span className="truncate">{payload.subject}</span>
        <span className="text-xs text-text-muted font-normal truncate">
          {t("card.contactFrom", { name: payload.contact_name })}
        </span>
      </span>
    </span>
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
  const { updateUserNotification } = useUserNotifications();
  const { preview, details } = resolveViews(userNotification, onNavigate);
  const typeLabel = t(`types.${userNotification.type}`);
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
          className={cn(
            "w-full border px-3 py-2 text-sm text-left flex flex-col gap-1 transition-colors hover:bg-fg-2",
            unread
              ? "bg-fg-1 text-text font-medium border-border-em"
              : "bg-fg text-text-muted border-fg-2",
          )}
        >
          {preview}
          {/* Reading is the one thing the card can still be waiting on, so an unread one says so
              outright instead of showing a date that means nothing yet. Flips to the stamp as
              soon as opening the modal marks it read. */}
          {unread ? (
            <span className="flex items-center gap-1.5 text-xs text-error font-normal">
              <TriangleAlert className="size-3 shrink-0" aria-hidden />
              {t("status.unread")}
            </span>
          ) : (
            <span className="text-xs text-text-muted font-normal">
              {t("dialog.readAt", {
                date: formatDateTime(userNotification.read_at) ?? "",
              })}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg w-screen">
        <DialogHeader>
          <DialogTitle className="text-base pr-6">{typeLabel}</DialogTitle>
          <DialogDescription>
            {t("dialog.description", {
              date: formatDateTime(userNotification.updated_at) ?? "",
            })}
          </DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col gap-3 text-sm">{details}</dl>
      </DialogContent>
    </Dialog>
  );
};
