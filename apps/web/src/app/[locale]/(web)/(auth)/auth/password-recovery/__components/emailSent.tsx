"use client";

import { Timer } from "@repo/ui/components/custom/Timer";
import { useRouter } from "next/navigation";

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
