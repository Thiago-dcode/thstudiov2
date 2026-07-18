"use client";

import { Timer } from "@repo/ui/components/custom/Timer";
import { useRouter } from "@/i18n/navigation";

export const EmailSentTimer = ({
  timeTillNextRecovery,
}: {
  timeTillNextRecovery: number;
}) => {
  const router = useRouter();

  return (
    <Timer
      expiresIn={timeTillNextRecovery}
      options={{
        onFinish: async () => {
          router.refresh();
        },
      }}
    />
  );
};
