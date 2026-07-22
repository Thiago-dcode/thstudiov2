"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useTimer } from "@repo/ui/hooks/useTimer";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export const ExpiresIn = ({
  expiresIn,
  redirect,
}: {
  expiresIn: number;
  redirect: string;
}) => {
  const t = useTranslations("auth.expiresIn");
  const router = useRouter();
  const { timeObj } = useTimer(expiresIn, {
    onFinish: async () => {
      router.push(redirect);
    },
  });
  const renderText = timeObj
    ? t("remaining", {
        minutes: timeObj.minutes,
        seconds: timeObj.seconds,
      })
    : "";
  return (
    <div className="text-center w-full ">
      <p className="text-xs text-center w-full flex items-center justify-center">
        {renderText || <Spinner />}
      </p>
    </div>
  );
};
