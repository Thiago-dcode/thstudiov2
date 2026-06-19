"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useTimer } from "@repo/ui/hooks/useTimer";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export const ExpiresIn = ({
  expiresIn,
  redirect,
}: {
  expiresIn: number;
  redirect: string;
}) => {
  const router = useRouter();
  const { timeObj } = useTimer(expiresIn, {
    onFinish: async () => {
      router.push(redirect);
    },
  });
  const renderText = useMemo(() => {
    if (!timeObj) return "";
    const minStr =
      timeObj.minutes > 0
        ? `${timeObj.minutes} minute${timeObj.minutes > 1 ? "s" : ""} and `
        : "";
    const secStr = `${timeObj.seconds} second${timeObj.seconds > 1 ? "s" : ""}`;
    return `You have ${minStr}${secStr} remaining`;
  }, [timeObj]);
  return (
    <div className="text-center w-full ">
      <p className="text-xs text-center w-full flex items-center justify-center">
        {renderText || <Spinner />}
      </p>
    </div>
  );
};
