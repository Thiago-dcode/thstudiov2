import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Shared chrome and rich-text tag handlers for the three legal documents.
 *
 * The prose lives in `i18n/messages/{en,es,pt}.ts` and is rendered with `t.rich`, so translators
 * receive whole sentences with the emphasis and links marked up inline. Flattening the copy into
 * plain strings would have baked English word order into the JSX — a Spanish sentence cannot be
 * assumed to put the link in the same place.
 */

const LINK_CLASS =
  "text-text underline underline-offset-4 hover:text-text-muted transition-colors";

export function LegalHeader({
  lastUpdated,
  heading,
  intro,
}: {
  lastUpdated: string;
  heading: string;
  intro: ReactNode;
}) {
  return (
    <header className="space-y-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
        {lastUpdated}
      </p>
      <h1 className="text-3xl tablet:text-4xl font-bold tracking-tight text-text">
        {heading}
      </h1>
      <p className="text-sm leading-relaxed text-text-muted max-w-2xl">
        {intro}
      </p>
    </header>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-text-muted">{children}</p>;
}

/** Bullet list. `items` are already-rendered nodes so each one can carry its own rich markup. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-text-muted">
      {items.map((item, i) => (
        // Legal copy is a fixed, ordered list per document — index is a stable identity here.
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** `<strong>` inside translated prose. Spread into every `t.rich` call in a legal document. */
export const strongTag = {
  strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
};

/** `<doc>…</doc>` → an internal, locale-aware link to another legal document. */
export function docTag(href: string) {
  return {
    doc: (chunks: ReactNode) => (
      <Link href={href} className={LINK_CLASS}>
        {chunks}
      </Link>
    ),
  };
}

/** `<email/>` → the support mailto, rendered as the address itself. */
export function emailTag(address: string) {
  return {
    email: () => (
      <a href={`mailto:${address}`} className={LINK_CLASS}>
        {address}
      </a>
    ),
  };
}

/** External link with the rel attributes an outbound link needs. */
export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {children}
    </a>
  );
}
