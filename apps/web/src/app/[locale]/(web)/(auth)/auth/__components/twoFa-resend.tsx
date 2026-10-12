"use client";

import {
  TWOFA_CODE_TTL_MINUTES,
  TWOFA_RESEND_COOLDOWN_SECONDS,
} from "@repo/common-lib/constants/limits";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { resend2faServerAction } from "@/modules/auth/server-actions/twofa.action";

const TTL_MS = TWOFA_CODE_TTL_MINUTES * 60 * 1000;
const COOLDOWN_MS = TWOFA_RESEND_COOLDOWN_SECONDS * 1000;

/**
 * Shows how long the emailed code stays valid and lets the user ask for a new one. An expired
 * code no longer bounces the user back to login: they resend from here and keep their place.
 */
export const TwoFaResend = ({
  initialExpiresAt,
}: {
  initialExpiresAt: string | null;
}) => {
  const t = useTranslations("auth");
  const [expiresAt, setExpiresAt] = useState(() =>
    initialExpiresAt ? new Date(initialExpiresAt).getTime() : 0,
  );
  const [now, setNow] = useState<number | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { handleAction, isPending, errors } = useHandleAction({
    action: resend2faServerAction,
    afterAction: async (result) => {
      if (!result.data) return;
      setExpiresAt(new Date(result.data.twofa_expires_at).getTime());
      setResent(true);
    },
  });

  // Rendered on the server with no clock: hold the layout until the first tick.
  if (now === null) {
    return <div className="min-h-20" aria-hidden />;
  }

  const remainingMs = Math.max(0, expiresAt - now);
  const expired = remainingMs === 0;
  // The code was issued TTL before it expires; the cooldown runs from then.
  const cooldownSeconds = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - TTL_MS + COOLDOWN_MS - now) / 1000))
    : 0;
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      {resent && !expired && (
        <p className="text-sm text-text" role="status">
          {t("twoFa.newCodeSent")}
        </p>
      )}
      <p className="text-xs text-text-muted">
        {expired
          ? t("twoFa.codeExpired")
          : t("expiresIn.remaining", { minutes, seconds })}
      </p>
      <div className="flex items-center gap-1 text-sm text-text-muted">
        <span>{t("twoFa.didntGetCode")}</span>
        <Button
          type="button"
          variant="link"
          className="h-auto min-h-11 px-1 text-sm text-text"
          disabled={isPending || cooldownSeconds > 0}
          onClick={() => {
            setResent(false);
            handleAction();
          }}
        >
          {cooldownSeconds > 0
            ? t("twoFa.resendIn", { seconds: cooldownSeconds })
            : t("twoFa.resend")}
        </Button>
      </div>
      <p className="text-xs text-text-muted">{t("twoFa.checkSpam")}</p>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </div>
  );
};
