import type { MetadataRoute } from "next";

/**
 * PWA / install manifest, served at `/manifest.webmanifest`. Next injects `<link rel="manifest">`
 * automatically (no layout change needed). Colors mirror the design tokens in
 * `packages/ui/src/styles/globals.css` (`--color-bg`, `--color-accent`).
 *
 * Icons live in `apps/web/public/` (from the realfavicongenerator set).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "A11STUDIO — Where Artists Get Discovered",
    short_name: "A11STUDIO",
    description:
      "The portfolio platform where artists get discovered — showcase your work and connect with clients, collectors and collaborators.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    background_color: "#FAFAF9",
    theme_color: "#ED2100",
    categories: ["art", "design", "photography", "portfolio"],
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
