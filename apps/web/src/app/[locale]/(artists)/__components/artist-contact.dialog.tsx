"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { toast } from "@repo/ui/sonner";
import { Check, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import FormComponent from "@/lib/components/form-component";
import { FormPrivacyNotice } from "@/lib/components/form-privacy-notice";
import { useSession } from "@/lib/providers/session.provider";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createUserContactAction } from "@/modules/user-contacts/server-actions/create-user-contact.action";
import { useArtist } from "@/modules/users/providers/artist.provider";
import { ArtistInvite } from "./artist-invite";

export const ArtistContactDialog = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const t = useTranslations("artists.contactDialog");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  /** The message went through: the dialog shows a confirmation instead of the form. */
  const [sent, setSent] = useState(false);
  const { artist } = useArtist();
  const { session } = useSession();
  const isSelfContact = Boolean(session && artist && session.id === artist.id);
  const artistName = artist
    ? artist.name
      ? `${artist.name} ${artist.surname ?? ""}`.trim()
      : artist.username
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { handleSubmit, isPending, inputErrors, success, reset } =
    useHandleAction({
      action: createUserContactAction,
      afterAction: async (result) => {
        if (result.data) {
          trackEvent("artist_contact_sent");
          setSent(true);
          reset();
        } else if (result.errors) {
          for (const err of result.errors) {
            toast.error(err);
          }
        }
      },
    });

  const fallback = children ?? (
    <Button variant="default" size="sm">
      <Mail className="size-3.5" />
      {t("contactButton")}
    </Button>
  );

  if (!mounted) return fallback;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && !isSelfContact) trackEvent("artist_contact_opened");
        if (!v) {
          reset();
          setSent(false);
        }
      }}
    >
      <DialogTrigger asChild className="cursor-pointer">
        {fallback}
      </DialogTrigger>

      <DialogContent className="max-w-xl w-screen p-6 min-h-[400px]">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {artistName
              ? t("contactTitle", { name: artistName })
              : t("contactTitleFallback")}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-muted">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {isSelfContact ? (
          <div className="flex min-h-[260px] items-center justify-center border border-fg-2/40 bg-fg/10 px-6 text-center text-sm text-text-muted">
            {t("selfContact")}
          </div>
        ) : sent ? (
          <div role="status" className="flex flex-col gap-8 pt-4">
            <div className="flex flex-col gap-2">
              <p className="inline-flex items-center gap-2 font-serif text-xl font-light text-text">
                <Check className="size-5 shrink-0" aria-hidden />
                {t("sent.title")}
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {artistName
                  ? t("sent.body", { name: artistName })
                  : t("sent.bodyFallback")}
              </p>
            </div>
            <ArtistInvite placement="contact_success" />
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="min-h-11 w-fit">
                {t("sent.close")}
              </Button>
            </DialogClose>
          </div>
        ) : (
          <FormComponent.Container>
            <FormComponent.Form onSubmit={handleSubmit}>
              <input type="hidden" name="user_id" value={artist?.id ?? ""} />
              <FormComponent.LabelInput
                label={t("form.nameLabel")}
                id="contact-name"
                name="name"
                placeholder={t("form.namePlaceholder")}
                required
                error={inputErrors?.name}
              />

              <FormComponent.LabelInput
                label={t("form.emailLabel")}
                id="contact-email"
                name="email"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                required
                error={inputErrors?.email}
              />

              <FormComponent.LabelInput
                label={t("form.subjectLabel")}
                id="contact-subject"
                name="subject"
                placeholder={t("form.subjectPlaceholder")}
                required
                error={inputErrors?.subject}
              />

              <FormComponent.LabelTextarea
                label={t("form.messageLabel")}
                id="contact-message"
                name="message"
                placeholder={t("form.messagePlaceholder")}
                rows={4}
                required
                error={inputErrors?.message}
              />

              <FormPrivacyNotice context="artistContact" />

              <FormComponent.SubmitButton
                isPending={isPending}
                success={success}
              >
                {t("form.submit")}
              </FormComponent.SubmitButton>
            </FormComponent.Form>
          </FormComponent.Container>
        )}
      </DialogContent>
    </Dialog>
  );
};
