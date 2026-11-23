import { cn } from "@repo/ui/lib/utils";
import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";

/**
 * The quiet line under a homepage CTA. The early-access part only shows while registration is
 * really closed (the CTA then opens the waitlist), so the scarcity it implies is always true.
 * It reads a deploy-wide flag, never the visitor, so it is safe in edge-cached HTML.
 */
export async function CtaMicrocopy({ className }: { className?: string }) {
  const t = await getTranslations("landingV2.microcopy");
  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  return (
    <p className={cn("text-sm! tracking-wide text-text-muted", className)}>
      {registrationIsClosed ? `${t("earlyAccess")} · ` : null}
      {t("free")}
    </p>
  );
}
