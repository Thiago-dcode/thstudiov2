"use client";

import { ENUMS } from "@repo/common-lib/constants/enums";
import type { OauthProviders } from "@repo/common-lib/types/auth";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { oauth2InitiateAction } from "@/modules/auth/server-actions/Oauth2Initiate.action";

/** Brand names as the providers spell them (never translated). */
const PROVIDER_LABELS: Record<OauthProviders, string> = {
  google: "Google",
};

export const Oauth2Strategy = ({
  invitationLink,
  invitationEmail,
}: {
  invitationLink?: string;
  /** Email the invitation was issued to; the provider account must match it. */
  invitationEmail?: string;
}) => {
  const t = useTranslations("auth.oauth");
  const providerRef = useRef<OauthProviders>(null);

  const router = useRouter();

  const { handleAction, errors, isPending } = useHandleAction({
    action: async () => {
      if (!providerRef.current) return null;
      return await oauth2InitiateAction(providerRef.current, invitationLink);
    },
    afterAction: async (result) => {
      // A full navigation: the provider's consent page is another origin.
      if (result?.data) router.push(result.data);
    },
  });

  return (
    <div>
      {ENUMS.OAUTH_PROVIDERS.map((provider) => {
        return (
          <Button
            key={`oauth2-strategy-${provider}`}
            onClick={() => {
              providerRef.current = provider;
              handleAction();
            }}
            disabled={isPending}
            variant="outline"
            className="w-full min-h-11 gap-3 text-sm text-text hover:bg-fg-1"
          >
            <Image
              src={`/icons/${provider}.png`}
              alt=""
              width={16}
              height={16}
            />
            {t("continueWith", { provider: PROVIDER_LABELS[provider] })}
          </Button>
        );
      })}
      {invitationEmail ? (
        <p className="mt-2 text-center text-xs! text-text-muted">
          {t("invitationEmailHint", {
            email: invitationEmail,
            provider: ENUMS.OAUTH_PROVIDERS.map(
              (provider) => PROVIDER_LABELS[provider],
            ).join(" / "),
          })}
        </p>
      ) : null}
      <Errors errors={errors || []} />
    </div>
  );
};
