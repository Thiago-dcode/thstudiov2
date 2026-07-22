"use client";

import { Timer } from "@repo/ui/components/custom/Timer";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export const TryAgainButton = ({ nextAttempt }: { nextAttempt: number }) => {
  const t = useTranslations("auth.passwordRecovery");
  const route = useRouter();
  return (
    <>
      {nextAttempt <= 0 ? (
        <Link
          href="/auth/password-recovery"
          className="block text-center w-full px-4 py-3 bg-text hover:bg-text-muted text-bg font-semibold transition-colors"
        >
          {t("tryAgain")}
        </Link>
      ) : (
        <div className="cursor-not-allowed flex items-center justify-center gap-2 text-sm text-center w-full px-4 py-3 bg-text/50 text-bg font-semibold transition-colors">
          {t("tryAgainIn")}{" "}
          <Timer
            expiresIn={nextAttempt}
            options={{
              onFinish: async () => {
                route.refresh();
              },
            }}
          />
        </div>
      )}
    </>
  );
};
