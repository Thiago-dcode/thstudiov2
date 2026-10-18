/**
 * Caption above a gallery tile's media, shown when the layout's `items.show_title`
 * is on. Spans because it lives inside the tile's `<a>` / `<button>`; it takes the
 * full cell width (not the media's), so a letterboxed image doesn't squeeze it.
 *
 * gallery-grid.css reserves two lines for it in multi-column grids and pins the text
 * to the bottom, so the media in a row stays aligned whatever each title's length —
 * which is also why an untitled item still renders an (empty) caption.
 */
export function GalleryItemTitle({ title }: { title: string }) {
  return (
    // Type lives on the outer span so the reserved two-line height (in `lh`) and a
    // consumer's size override (e.g. a smaller preview) both follow it.
    <span className="media-gallery-card__title flex w-full min-w-0 items-end text-sm font-medium leading-snug text-text">
      <span className="line-clamp-2 min-w-0 text-left">
        {title}
      </span>
    </span>
  );
}
