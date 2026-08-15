"use client";

import type { ProfileStatus } from "@repo/common-lib/types/profile-status";
import { cn } from "@repo/ui/lib/utils";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useUserMetrics } from "../providers/user-metrics.provider";

const PROFILE_STATUS_FLAGS = [
  "has_full_name_field",
  "has_profession_field",
  "has_avatar_field",
  "has_location",
  "has_categories",
  "has_media",
  "has_portfolio",
  "has_about_page",
] as const satisfies ReadonlyArray<keyof ProfileStatus>;

type ProfileStatusFlag = (typeof PROFILE_STATUS_FLAGS)[number];

const STEP_HREFS: Record<ProfileStatusFlag, string> = {
  has_full_name_field: "/atelier/home?tab=profile",
  has_profession_field: "/atelier/home?tab=profile",
  has_avatar_field: "/atelier/home?tab=avatar",
  has_location: "/atelier/home?tab=address",
  has_categories: "/atelier/home?tab=categories",
  has_media: "/atelier/media?open=1",
  has_portfolio: "/atelier/portfolios/create",
  has_about_page: "/atelier/about?open=1",
};

const STEP_LABEL_KEYS: Record<
  ProfileStatusFlag,
  | "fullName"
  | "profession"
  | "avatar"
  | "location"
  | "categories"
  | "media"
  | "portfolio"
  | "aboutPage"
> = {
  has_full_name_field: "fullName",
  has_profession_field: "profession",
  has_avatar_field: "avatar",
  has_location: "location",
  has_categories: "categories",
  has_media: "media",
  has_portfolio: "portfolio",
  has_about_page: "aboutPage",
};

/** Bump when new required steps are added so prior "completed" dismissals reset. */
const completedKey = (userId: number) =>
  `profile-setup-guide-completed-v2-${userId}`;

export const ProfileSetupGuide = ({ userId }: { userId: number }) => {
  const t = useTranslations("atelier.common.setupGuide");
  const { metrics, isLoading } = useUserMetrics();
  const [dismissed, setDismissed] = useState(true);
  const [shrunk, setShrunk] = useState(false);

  const status = metrics?.profile_status;

  const { percent, allDone } = useMemo(() => {
    if (!status) {
      return { percent: 0, allDone: false };
    }
    const completedCount = PROFILE_STATUS_FLAGS.filter(
      (flag) => status[flag] === true,
    ).length;
    const total = PROFILE_STATUS_FLAGS.length;
    return {
      percent: Math.round((completedCount / total) * 100),
      allDone: completedCount === total,
    };
  }, [status]);

  const handleDismiss = () => {
    setDismissed(true);
    if (allDone) {
      localStorage.setItem(completedKey(userId), "1");
    }
  };
  useEffect(() => {
    if (isLoading || !status) return;
    console.log("ALLDONE", allDone);
    if (!allDone) {
      console.log("ALLDONEremoving");

      localStorage.removeItem(completedKey(userId));
      setDismissed(false);
    }
  }, [allDone, isLoading, status]);

  useEffect(() => {
    setDismissed(localStorage.getItem(completedKey(userId)) === "1");
  }, []);

  const handleToggleShrink = () => {
    setShrunk((prev) => !prev);
  };

  if (isLoading || !status || dismissed) {
    return null;
  }

  if (shrunk) {
    return (
      <div className="">
        <button
          type="button"
          onClick={handleToggleShrink}
          className="flex items-center gap-3 border border-border bg-fg px-4 py-3 shadow-lg text-left hover:bg-fg-1 transition-colors"
          aria-label={t("expand")}
        >
          <span className="text-sm! font-medium text-text">{t("title")}</span>
          <span className="text-xs! text-text-muted tabular-nums">
            {percent}%
          </span>
          <ChevronUp className="size-4 text-text-muted" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="w-[min(100vw-3rem,20rem)] border border-border bg-fg shadow-lg"
      aria-label={t("title")}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm! font-semibold text-text">{t("title")}</h2>
          <p className="mt-0.5 text-xs! text-text-muted tabular-nums">
            {t("progress", { percent })}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleShrink}
            className="p-1.5 text-text-muted hover:text-text transition-colors"
            aria-label={t("shrink")}
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-text-muted hover:text-text transition-colors"
            aria-label={t("close")}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div
          className="h-1 w-full bg-fg-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-text transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col border-t border-border max-h-72 overflow-y-auto">
        {PROFILE_STATUS_FLAGS.map((flag) => {
          const done = status[flag] === true;
          const label = t(`steps.${STEP_LABEL_KEYS[flag]}`);
          return (
            <li key={flag} className="border-b border-border last:border-b-0">
              <Link
                href={STEP_HREFS[flag]}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm! transition-colors hover:bg-fg-1",
                  done ? "text-text-muted line-through" : "text-text",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center border",
                    done
                      ? "border-text bg-text text-fg"
                      : "border-border-em text-transparent",
                  )}
                  aria-hidden
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default ProfileSetupGuide;
