import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Editorial primitives for A11STUDIO's public pages: the art-publication look described in the
 * `a11studio-design` skill. Small uppercase metadata, hairlines, large light headlines, italic
 * standfirsts. Pure presentation: callers pass already-translated text. Compose new editorial
 * components from these pieces instead of re-typing their classes.
 *
 * Typeface: Poppins throughout. `font-serif` resolves to it on purpose (brand decision); keep the
 * classes as they are and never add a serif font.
 *
 * Global `p` and `h1`–`h6` rules in globals.css are unlayered and beat plain utilities, hence the
 * `!` on every typographic class here. Do the same on any `p`/`h*` you style by hand.
 */

/** `1` → `001`: the issue-style number in a label (`HOW IT WORKS / 001`). */
export const editorialNumber = (index: number) =>
  String(index).padStart(3, '0');

/** The metadata label's type: small, uppercase (CSS only), widely tracked, muted. Safe on `<h2>`. */
export const EDITORIAL_LABEL_CLASS =
  'font-sans! text-xs! font-medium! uppercase leading-none! tracking-[0.24em]! text-text-muted';

/** The italic standfirst under a headline. Override the width with `cn(…, "max-w-3xl")`. */
export const EDITORIAL_STANDFIRST_CLASS =
  'max-w-xl font-serif! text-lg! italic leading-relaxed! text-text-muted tablet:text-xl!';

/** A link set like the metadata labels, with a hairline that darkens on hover. */
export const EDITORIAL_LINK_CLASS =
  'text-xs! font-medium uppercase tracking-[0.24em] border-b border-border-em pb-1.5 transition-colors hover:border-text hover:text-text';

/** Inline links inside editorial prose: a quiet hairline underline that darkens on hover. */
export const EDITORIAL_PROSE_LINK_CLASS =
  'text-text underline decoration-border-em decoration-1 underline-offset-4 transition-colors hover:decoration-text';

/**
 * Content that sits under an `EditorialHeader`'s headline: from laptop up it starts on the
 * header's 4th grid column (12 cols, gap-x-10 → 25% + 3/12 of a gap).
 */
export const EDITORIAL_COLUMN_CLASS = 'laptop:ml-[calc(25%+0.625rem)]';

/** Long-form reading text: ≥ 16px, relaxed leading, ~65 characters per line. */
export const EDITORIAL_PROSE_CLASS =
  'max-w-[38rem] text-base! leading-[1.75]! text-text-muted';

const HEADLINE_CLASS = {
  page: 'text-4xl! tablet:text-5xl! laptop:text-6xl!',
  section: 'text-3xl! tablet:text-4xl! laptop:text-5xl!',
  sub: 'text-2xl! tablet:text-3xl!',
} as const;

export type EditorialSize = keyof typeof HEADLINE_CLASS;

/** The large light headline: `page` (h1), `section` (h2), `sub` (chapter / item titles). */
export function editorialHeadlineClass(size: EditorialSize = 'section') {
  return cn(
    'font-serif! font-normal! leading-[1.04]! tracking-[-0.02em]! text-text',
    HEADLINE_CLASS[size],
    size === 'sub' && 'leading-[1.15]! tracking-[-0.01em]!',
  );
}

/** The short centred hairline above a centred opening or closing statement. Decorative. */
export function EditorialRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('h-px w-10 bg-border-em', className)}
    />
  );
}

/** Metadata line: `SECTION / QUALIFIER`. Not a heading; screen readers hear natural casing. */
export function EditorialLabel({
  children,
  qualifier,
  className,
}: {
  children: ReactNode;
  qualifier?: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn(EDITORIAL_LABEL_CLASS, className)}>
      {children}
      {qualifier ? (
        <>
          <span aria-hidden="true" className="mx-2 text-text-muted/60">
            /
          </span>
          <span className="tabular-nums">{qualifier}</span>
        </>
      ) : null}
    </p>
  );
}

/**
 * One chapter of a long-form page: a hairline, the issue-style number (or a label) in the narrow
 * left column, the sub-headline and the body in the reading column. Pair with an
 * `EditorialHeader` above so the columns line up.
 */
export function EditorialChapter({
  id,
  marker,
  title,
  headingId,
  children,
  className,
}: {
  id?: string;
  /** Left-column metadata, e.g. `editorialNumber(2)`. */
  marker?: ReactNode;
  title: ReactNode;
  headingId?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'grid gap-6 border-t border-border pt-6 laptop:grid-cols-12 laptop:gap-x-10 laptop:pt-8',
        className,
      )}
    >
      <div className="laptop:col-span-3 laptop:pt-2.5">
        {marker ? <EditorialLabel>{marker}</EditorialLabel> : null}
      </div>
      <div className="flex max-w-[38rem] flex-col gap-5 laptop:col-span-9">
        <h2 id={headingId} className={editorialHeadlineClass('sub')}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

/** A pull quote / statement line inside editorial prose. */
export const EDITORIAL_STATEMENT_CLASS =
  'max-w-[38rem] font-serif! text-xl! italic leading-snug! text-text tablet:text-2xl!';

/**
 * A section or page opening: hairline, label in a narrow left column, large headline and an
 * optional italic standfirst on a 12-column grid. `stack` puts the label above the headline (narrow
 * pages such as forms), `center` is for closing statements and short pages.
 * `as="h1"` with `size="page"` for the top of a page.
 */
export function EditorialHeader({
  label,
  qualifier,
  title,
  standfirst,
  children,
  align = 'start',
  as: Heading = 'h2',
  size = Heading === 'h1' ? 'page' : 'section',
  rule = true,
  className,
}: {
  label?: ReactNode;
  qualifier?: ReactNode;
  title: ReactNode;
  standfirst?: ReactNode;
  /** Extra content under the standfirst (a byline, a date, a single action). */
  children?: ReactNode;
  align?: 'start' | 'stack' | 'center';
  as?: 'h1' | 'h2';
  size?: EditorialSize;
  /** The top hairline (start alignment) or short centred rule. */
  rule?: boolean;
  className?: string;
}) {
  const centered = align === 'center';
  const grid = align === 'start';
  return (
    <header
      className={cn(
        centered
          ? 'flex flex-col items-center gap-6 text-center'
          : grid
            ? 'grid gap-6 laptop:grid-cols-12 laptop:gap-x-10'
            : 'flex flex-col gap-6',
        !centered && rule && 'border-t border-border pt-6 laptop:pt-8',
        className,
      )}
    >
      {centered && rule ? <EditorialRule /> : null}
      {label ? (
        <EditorialLabel
          qualifier={qualifier}
          className={grid ? 'laptop:col-span-3 laptop:pt-3' : undefined}
        >
          {label}
        </EditorialLabel>
      ) : null}
      <div
        className={cn(
          'flex flex-col gap-5',
          centered && 'items-center',
          grid && (label ? 'laptop:col-span-9' : 'laptop:col-span-12'),
        )}
      >
        <Heading
          className={cn(
            editorialHeadlineClass(size),
            centered ? 'max-w-3xl' : 'max-w-4xl',
          )}
        >
          {title}
        </Heading>
        {standfirst ? (
          <p className={EDITORIAL_STANDFIRST_CLASS}>{standfirst}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
