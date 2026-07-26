"use client";

import type { TableName } from "@repo/common-lib/types/database";
import { Button } from "@repo/ui/components/shadcn/button";
import { toast } from "@repo/ui/sonner";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { getResourceLimitInfo } from "./resource-limits";

type CreateResourceButtonProps = {
  resource: TableName;
  href: string;
  label: string;
  variant?: "default" | "outline";
};

const TOAST_COOLDOWN_MS = 5000;

export const CreateResourceButton = ({
  resource,
  href,
  label,
  variant = "default",
}: CreateResourceButtonProps) => {
  const t = useTranslations("atelier.common");
  const { metrics } = useUserMetrics();
  const lastToastRef = useRef(0);

  const limitInfo = getResourceLimitInfo(metrics, resource);

  if (limitInfo?.isAtLimit) {
    return (
      <Button
        variant="primary"
        size="sm"
        className="opacity-30 cursor-not-allowed"
        onClick={() => {
          const now = Date.now();
          if (now - lastToastRef.current < TOAST_COOLDOWN_MS) return;
          lastToastRef.current = now;
          toast.error(
            t("planLimitToast", {
              label: limitInfo.label,
              count: limitInfo.count,
              limit: limitInfo.limit,
            }),
          );
        }}
      >
        <Plus className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size="sm">
      <Link href={href}>
        <Plus className="size-4" />
        {label}
      </Link>
    </Button>
  );
};
