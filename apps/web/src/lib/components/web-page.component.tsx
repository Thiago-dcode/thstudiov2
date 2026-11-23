import {
  EDITORIAL_STANDFIRST_CLASS,
  EditorialLabel,
  editorialHeadlineClass,
} from "@repo/ui/components/custom/editorial";
import { cn } from "@repo/ui/lib/utils";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const Container = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-(--breakpoint-ultrawide) px-5 py-6 md:px-12 tablet:py-10 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700",
        className,
      )}
    >
      {children}
    </div>
  );
};

/**
 * Left-aligned on a phone, where it lines up with the breadcrumb and a long centred title wraps
 * raggedly; centred from md. `children` (e.g. an EditLink) go on their own row below the text —
 * an icon beside the title broke its wrapping. The base element rules in globals.css are
 * unlayered and beat plain utilities, hence the `!` on the sizes. Editorial type (see the
 * `a11studio-design` skill): optional metadata label, large light serif title, italic standfirst.
 */
const Header = ({
  title,
  description,
  label,
  children,
}: {
  title: string;
  description?: string;
  /** Small uppercase metadata line above the title (`ARTISTS / LISBON`). */
  label?: ReactNode;
  children?: ReactNode;
}) => {
  return (
    <header className="mx-auto mb-10 flex w-full max-w-4xl flex-col items-start gap-5 md:mb-16 md:items-center md:text-center">
      {label ? <EditorialLabel>{label}</EditorialLabel> : null}
      <h1 className={cn(editorialHeadlineClass("section"), "text-balance")}>
        {title}
      </h1>
      {description && (
        // Portfolio and collection descriptions run long: a wide column (~75 characters at
        // text-xl) so they read as a standfirst, not a narrow ribbon.
        <p
          className={cn(
            EDITORIAL_STANDFIRST_CLASS,
            "max-w-3xl text-pretty md:text-xl!",
          )}
        >
          {description}
        </p>
      )}
      {children}
    </header>
  );
};

const EditLink = ({ href, label }: { href: string; label: string }) => {
  return (
    <Link
      href={href}
      className="mt-1 inline-flex items-center gap-1.5 border-b border-border-em pb-1 text-xs uppercase tracking-[0.24em] text-text-muted transition-colors hover:border-text hover:text-text"
    >
      <Pencil className="size-3" />
      {label}
    </Link>
  );
};

const List = ({ children }: { children: Iterable<ReactNode> }) => {
  return (
    <section className="grid w-full grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 tablet:grid-cols-4 tablet:gap-x-6 tablet:gap-y-12">
      {Array.from(children)}
    </section>
  );
};

export default {
  Container,
  Header,
  EditLink,
  List,
};
