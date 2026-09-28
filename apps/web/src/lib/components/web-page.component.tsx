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
        "mx-auto w-full max-w-(--breakpoint-ultrawide) px-6 py-4 md:px-12 tablet:py-8 animate-in fade-in duration-1000",
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
 * unlayered and beat plain utilities, hence the `!` on the sizes.
 */
const Header = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) => {
  return (
    <header className="mx-auto mb-8 flex w-full max-w-3xl flex-col items-start gap-3 md:mb-12 md:items-center md:text-center">
      <h1 className="text-2xl! leading-tight! tracking-tight text-balance md:text-4xl!">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm! leading-relaxed! text-text-muted text-pretty md:text-base!">
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
      className="mt-1 inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:border-text hover:text-text"
    >
      <Pencil className="size-3" />
      {label}
    </Link>
  );
};

const List = ({ children }: { children: Iterable<ReactNode> }) => {
  return (
    <section className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 tablet:grid-cols-4 tablet:gap-5">
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
