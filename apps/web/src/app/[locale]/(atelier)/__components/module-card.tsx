import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button, buttonVariants } from "@repo/ui/components/shadcn/button";
import { Switch } from "@repo/ui/components/shadcn/switch";
import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Atelier card shell shared by every module list (portfolios now; collections, services and
 * clients later). No hooks and no directive on purpose: it renders from a server or a client
 * component. Interactive controls (handle, switches, actions) are siblings of the editor link,
 * never children of it.
 */
type RootProps = {
  /** Editor link wrapping the media and the title. */
  href: string;
  media: ReactNode;
  title: string;
  badges?: ReactNode;
  toggles?: ReactNode;
  actions?: ReactNode;
  /** Reason line under the actions; give it an `id` and point `aria-describedby` at it. */
  note?: ReactNode;
  dragHandle?: ReactNode;
  className?: string;
};

function Root({
  href,
  media,
  title,
  badges,
  toggles,
  actions,
  note,
  dragHandle,
  className,
}: RootProps) {
  return (
    <article
      className={cn(
        "surface-card group relative flex w-full min-w-0 max-w-80 text-left flex-col",
        className,
      )}
    >
      <div className="relative">
        {/* The title link below is the accessible one; this one only widens the click target. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          {media}
        </Link>
        {dragHandle ? (
          <div className="absolute left-1 top-1 z-10 bg-bg/80">
            {dragHandle}
          </div>
        ) : null}
        {badges ? (
          <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-wrap gap-1">
            {badges}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <Link
          href={href}
          className="block min-w-0 truncate text-base font-medium text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-em"
        >
          {title}
        </Link>
        {toggles ? <div className="flex flex-col gap-1">{toggles}</div> : null}
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        {note}
      </div>
    </article>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-fg-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text">
      {children}
    </span>
  );
}

type ActionProps = {
  icon: ReactNode;
  children: ReactNode;
  href?: string;
  /** Open in a new tab. */
  external?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

function Action({
  icon,
  children,
  href,
  external,
  disabled,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: ActionProps) {
  const className = "min-h-11 min-w-11 flex-1";
  if (disabled || !href) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={className}
      >
        {icon}
        {children}
      </Button>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-em",
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

type ToggleProps = {
  /** Unique per card: namespaces the label id. */
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Marks the switch busy while a request is in flight. */
  pending?: boolean;
  /** Explanation shown in an info tooltip next to the label. */
  info?: ReactNode;
};

function Toggle({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
  pending,
  info,
}: ToggleProps) {
  const labelId = `${id}-label`;
  return (
    <div className="flex min-h-11 flex-col justify-center">
      <div className="flex items-center justify-between gap-3">
        {/* Not a <label for>: only the switch itself toggles, never a click on the text. */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span id={labelId} className="min-w-0 text-xs text-text">
            {label}
          </span>
          {info ? <InfoTooltip content={info} /> : null}
        </div>
        <Switch
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          aria-labelledby={labelId}
          aria-busy={pending || undefined}
        />
      </div>
    </div>
  );
}

export const ModuleCard = Object.assign(Root, { Badge, Action, Toggle });
