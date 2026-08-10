import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type AdminPageContainerProps = {
  children: ReactNode;
};

export const AdminPageContainer = ({ children }: AdminPageContainerProps) => {
  return (
    <section className="size-full p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 overflow-auto">
      {children}
    </section>
  );
};

type AdminPageTitleProps = {
  title: string;
  publicHref?: string;
  info?: string;
  children?: ReactNode;
};

export const AdminPageTitle = async ({
  title,
  publicHref,
  info,
  children,
}: AdminPageTitleProps) => {
  const t = await getTranslations("atelier.common");
  return (
    <div className="flex  flex-col tablet:flex-row items-start justify-between gap-3">
      <div className="flex items-center  gap-2 min-w-0">
        <h1 className="self-start text-xl! sm:text-2xl! font-semibold truncate">
          {title}
        </h1>
        {publicHref && (
          <Link
            href={publicHref}
            rel="noopener noreferrer"
            aria-label={t("viewPublicPage")}
            className="shrink-0 text-text-muted hover:text-text transition-colors"
          >
            <ExternalLink className="size-4" />
          </Link>
        )}
        {info && <InfoTooltip content={info} />}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-1 w-full tablet:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};

type AdminPageEmptyStateProps = {
  icon: ReactNode;
  description: string;
  children?: ReactNode;
};

export const AdminPageEmptyState = ({
  icon,
  description,
  children,
}: AdminPageEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
      <div className="*:size-10 *:stroke-[1.5]">{icon}</div>
      <p className="text-sm text-center max-w-sm">{description}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
};
