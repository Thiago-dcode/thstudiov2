import { notFound } from "next/navigation";

/**
 * Catch-all for multi-segment paths under a valid locale that match no route (`/foo/bar`,
 * `/es/artists/{username}/nope`, `/legal/nope`). Without it those fell through to Next's built-in
 * unbranded 404; throwing here hands them to `[locale]/not-found.tsx`. Single segments still go to
 * `(web)/[search]`, and static/metadata routes win over this dynamic one. `generateMetadata` throws
 * too, so the 404 is decided before the first byte is sent.
 */
export function generateMetadata(): never {
  notFound();
}

export default function CatchAll(): never {
  notFound();
}
