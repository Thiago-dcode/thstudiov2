import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminPageContainerProps = {
  children: ReactNode;
};

export const AdminPageContainer = ({ children }: AdminPageContainerProps) => {
  return (
    <section className="size-full p-6 flex flex-col gap-6 overflow-auto">
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

export const AdminPageTitle = ({
  title,
  publicHref,
  info,
  children,
}: AdminPageTitleProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {publicHref && (
          <Link
            href={publicHref}
            rel="noopener noreferrer"
            aria-label="View public page"
            className="text-text-muted hover:text-text transition-colors"
          >
            <ExternalLink className="size-4" />
          </Link>
        )}
        {info && <InfoTooltip content={info} />}
      </div>
      {children}
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
