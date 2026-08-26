"use client";

import type { UserContact } from "@repo/common-lib/types/user-contact";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDateTimeFormat } from "@/lib/hooks/useDateTimeFormat";

export const ContactsList = ({ contacts }: { contacts: UserContact[] }) => {
  const t = useTranslations("atelier.contacts");
  const formatDateTime = useDateTimeFormat();
  const [selected, setSelected] = useState<UserContact | null>(null);

  return (
    <>
      <div className="flex flex-col border border-fg-2">
        <div className="hidden tablet:grid grid-cols-[1.2fr_1.4fr_1.6fr_auto] gap-4 px-4 py-2.5 bg-fg text-xs uppercase tracking-wide text-text-muted border-b border-fg-2">
          <span>{t("table.name")}</span>
          <span>{t("table.email")}</span>
          <span>{t("table.subject")}</span>
          <span>{t("table.receivedAt")}</span>
        </div>

        {contacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => setSelected(contact)}
            aria-label={t("openAria", { subject: contact.subject })}
            className="grid grid-cols-1 tablet:grid-cols-[1.2fr_1.4fr_1.6fr_auto] gap-1 tablet:gap-4 items-center px-4 py-3 text-left text-sm border-b border-fg-2 last:border-b-0 hover:bg-fg-2 transition-colors"
          >
            <span className="font-medium truncate">{contact.contact_name}</span>
            <span className="text-text-muted truncate">
              {contact.contact_email}
            </span>
            <span className="truncate">{contact.subject}</span>
            <span className="text-xs text-text-muted tablet:text-right whitespace-nowrap">
              {formatDateTime(contact.created_at)}
            </span>
          </button>
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-xl w-screen">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base pr-6">
                  {selected.subject}
                </DialogTitle>
                <DialogDescription>
                  {t("dialog.description", {
                    date: formatDateTime(selected.created_at) ?? "",
                  })}
                </DialogDescription>
              </DialogHeader>

              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    {t("dialog.from")}
                  </dt>
                  <dd>{selected.contact_name}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    {t("dialog.email")}
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${selected.contact_email}`}
                      className="inline-flex items-center gap-1.5 hover:text-text-muted transition-colors"
                    >
                      <Mail className="size-3.5" />
                      {selected.contact_email}
                    </a>
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    {t("dialog.message")}
                  </dt>
                  <dd className="whitespace-pre-wrap break-words max-h-72 overflow-auto border border-fg-2 bg-fg p-3">
                    {selected.message}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
