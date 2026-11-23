import {
  EDITORIAL_PROSE_CLASS,
  EDITORIAL_PROSE_LINK_CLASS,
  EditorialHeader,
  editorialHeadlineClass,
} from "@repo/ui/components/custom/editorial";
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

const LINK_CLASS = EDITORIAL_PROSE_LINK_CLASS;

/** The reading column: starts on the opening's 4th grid column on laptop+ (12 cols, gap-x-10). */
export const LEGAL_COLUMN_CLASS =
  "w-full max-w-[38rem] laptop:ml-[calc(25%+0.625rem)]";

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
    <EditorialHeader
      as="h1"
      className="mb-6 tablet:mb-10"
      label={lastUpdated}
      title={heading}
      standfirst={intro}
    />
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
    <section className={`${LEGAL_COLUMN_CLASS} space-y-5`}>
      <h2 className={editorialHeadlineClass("sub")}>{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className={EDITORIAL_PROSE_CLASS}>{children}</p>;
}

/** Bullet list. `items` are already-rendered nodes so each one can carry its own rich markup. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="max-w-[38rem] list-disc space-y-2.5 pl-5 text-base leading-[1.75] text-text-muted marker:text-border-em">
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
