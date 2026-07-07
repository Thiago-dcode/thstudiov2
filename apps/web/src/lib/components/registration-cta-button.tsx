"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  HERO_SECTION_HREF,
  scrollToHeroSection,
} from "@/lib/components/hero-section-link";
import { useAppStatus } from "@/lib/providers/app-status.provider";

type RegistrationCtaButtonProps = {
  size?: "sm" | "lg";
  className?: string;
  intent?: "getStarted" | "createPortfolio";
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function RegistrationCtaButton({
  size = "lg",
  className,
  intent = "getStarted",
  onClick,
}: RegistrationCtaButtonProps) {
  const pathname = usePathname();
  const { isRegisterClose } = useAppStatus();
  const registrationIsClosed = !isRegisterClose;
  const tCta = useTranslations("landing.cta");
  const tFooter = useTranslations("footer");

  const registerLabel =
    intent === "createPortfolio" ? tCta("button") : tFooter("cta.getStarted");
  const waitListLabel = tCta("waitListButton");
  const label = registrationIsClosed ? waitListLabel : registerLabel;
  const iconClassName = size === "sm" ? "size-3.5" : "size-4";
  const href = registrationIsClosed ? HERO_SECTION_HREF : "/auth/register";

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (!registrationIsClosed || pathname !== "/") return;

    event.preventDefault();
    scrollToHeroSection();
  };

  return (
    <Button asChild variant="accent" size={size} className={cn(className)}>
      <Link href={href} onClick={handleClick}>
        {label}
        <ArrowRight className={iconClassName} />
      </Link>
    </Button>
  );
}
