'use client';

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdateEmailPreferenceAction } from "@/modules/email-preferences/server-actions/create-or-update-email-preference.action";
import type { EmailPreference } from "@repo/common-lib/types/email-preferences";
import FormComponent from "@/lib/components/form-component";
import { Errors } from "@repo/ui/components/custom/errors";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Label } from "@repo/ui/components/shadcn/label";
import { toast } from "@repo/ui/sonner";

export function EmailPreferencesForm({ emailPreference }: { emailPreference: EmailPreference }) {
  const { handleSubmit, isPending, inputErrors, errors } = useHandleAction({
    action: createOrUpdateEmailPreferenceAction,
    afterAction: async (result) => {
      if (result.data) {
        toast.success('Preferences updated');
        return;
      }

      if (result.errors) {
        result.errors.forEach((error) => toast.error(error));
      }
    },
  });

  return (
    <FormComponent.Container>
      <FormComponent.Form onSubmit={handleSubmit} className="gap-5">
        <input type="hidden" name="email" value={emailPreference.email} />
        {emailPreference.user_id ? <input type="hidden" name="user_id" value={String(emailPreference.user_id)} /> : null}

        <div className="rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-muted">
          Managing preferences for <span className="font-medium text-text">{emailPreference.email}</span>
        </div>

        <div className="space-y-3">
          <PreferenceToggle
            id="marketing"
            name="marketing"
            label="Marketing emails"
            description="Product news, launches, and occasional updates."
            defaultChecked={emailPreference.marketing}
            error={inputErrors?.marketing}
          />

          <PreferenceToggle
            id="notifications"
            name="notifications"
            label="Notifications"
            description="Account alerts and relevant platform notices."
            defaultChecked={emailPreference.notifications}
            error={inputErrors?.notifications}
          />

          <PreferenceToggle
            id="waitlist_updates"
            name="waitlist_updates"
            label="Waitlist updates"
            description="Progress updates about the waitlist and access changes."
            defaultChecked={emailPreference.waitlist_updates}
            error={inputErrors?.waitlist_updates}
          />
        </div>

        <FormComponent.Errors>
          {errors?.length ? <Errors errors={errors} /> : null}
        </FormComponent.Errors>

        <FormComponent.SubmitButton isPending={isPending} className="h-12">
          Save preferences
        </FormComponent.SubmitButton>
      </FormComponent.Form>
    </FormComponent.Container>
  );
}

function PreferenceToggle({
  id,
  name,
  label,
  description,
  defaultChecked,
  error,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-fg-2/20 px-4 py-3">
      <div className="flex items-start gap-3">
        <Checkbox id={id} name={name} value="on" defaultChecked={defaultChecked} className="mt-0.5" />
        <div className="space-y-1">
          <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-text">
            {label}
          </Label>
          <p className="text-sm leading-relaxed text-text-muted">{description}</p>
          {error ? <p className="text-xs text-error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
