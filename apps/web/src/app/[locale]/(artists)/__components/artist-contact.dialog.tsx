"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { toast } from "@repo/ui/sonner";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useSession } from "@/lib/hooks/useSession";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createUserContactAction } from "@/modules/user-contacts/server-actions/create-user-contact.action";
import { useArtist } from "@/modules/users/providers/artist.provider";

export const ArtistContactDialog = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { artist, isPending: loadingArtist } = useArtist();
  const { session, isLoading: loadingSession } = useSession();
  const isSelfContact = Boolean(session && artist && session.id === artist.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { handleSubmit, isPending, inputErrors, success, reset } =
    useHandleAction({
      action: createUserContactAction,
      afterAction: async (result) => {
        if (result.data) {
          toast.success("Message sent successfully!");
          setOpen(false);
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
      Contact
    </Button>
  );

  if (!mounted) return fallback;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild className="cursor-pointer">
        {fallback}
      </DialogTrigger>

      <DialogContent className="max-w-xl p-6 min-h-[400px]">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {artist
              ? `Contact ${artist.name ? `${artist.name} ${artist.surname ?? ""}`.trim() : artist.username}`
              : "Contact"}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-muted">
            Send a message directly to this artist.
          </DialogDescription>
        </DialogHeader>

        {(loadingArtist || loadingSession) && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm z-50">
            <Spinner className="size-8" />
          </div>
        )}

        {!loadingSession &&
          (isSelfContact ? (
            <div className="flex min-h-[260px] items-center justify-center border border-fg-2/40 bg-fg-1/10 px-6 text-center text-sm text-text-muted">
              You can't contact yourself.
            </div>
          ) : (
            <FormComponent.Container>
              <FormComponent.Form onSubmit={handleSubmit}>
                <input type="hidden" name="user_id" value={artist?.id ?? ""} />
                <FormComponent.LabelInput
                  label="Name"
                  id="contact-name"
                  name="name"
                  placeholder="Your name"
                  required
                  error={inputErrors?.name}
                />

                <FormComponent.LabelInput
                  label="Email"
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  error={inputErrors?.email}
                />

                <FormComponent.LabelInput
                  label="Subject"
                  id="contact-subject"
                  name="subject"
                  placeholder="Commission inquiry"
                  required
                  error={inputErrors?.subject}
                />

                <FormComponent.LabelTextarea
                  label="Message"
                  id="contact-message"
                  name="message"
                  placeholder="Tell the artist about your project..."
                  rows={4}
                  required
                  error={inputErrors?.message}
                />

                <FormComponent.SubmitButton
                  isPending={isPending}
                  success={success}
                >
                  Send Message
                </FormComponent.SubmitButton>
              </FormComponent.Form>
            </FormComponent.Container>
          ))}
      </DialogContent>
    </Dialog>
  );
};
