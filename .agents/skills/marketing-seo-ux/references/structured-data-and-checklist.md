# Structured data and launch checklist

Read when adding JSON-LD or doing a pre-launch SEO pass. Use the project's `lib/seo/json-ld.tsx`.

## JSON-LD

Always escape: `JSON.stringify(data).replace(/</g, "\\u003c")`. Validate at the Rich Results Test and validator.schema.org. Only mark up content visible on the page.

| Type | Use for | Required essentials | What Google does with it (2026) |
|---|---|---|---|
| `Organization` | site-wide, homepage | `name`, `url`, `logo`, `sameAs` | Knowledge panel, logo, entity signals. Worth it. |
| `WebSite` | homepage | `name`, `url` | Site name in results. The sitelinks search box (`SearchAction`) was retired in Nov 2024; it is kept only for other engines. |
| `Person` / `ProfilePage` | artist pages | `name`, `url`, `image`, `sameAs` | Profile-page understanding, entity linking. Worth it. |
| `ImageObject` / `CreativeWork` | portfolio and media pages | `name`, `contentUrl`, `creator`, `datePublished`, plus `license`/`acquireLicensePage` for the "Licensable" badge | Image-search credit; licence badge only with a real licence page. |
| `Article` | Journal, guides | `headline`, `image`, `author`, `datePublished`, `dateModified`; set `og:type=article` | Author/date understanding. Worth it once there are guides. |
| `FAQPage` | real FAQ sections | `mainEntity[]` of `Question` + `acceptedAnswer` | **No rich result** for this site (restricted to government and health since 2023). Harmless; don't add it to new pages expecting a snippet. |
| `HowTo` | — | — | Rich result removed in 2023. Don't add. |
| `BreadcrumbList` | any nested page | `itemListElement[]` with `position`, `name`, `item` | Breadcrumb trail in results (desktop). Worth it. |
| `Product` / `Offer` | paid plans, services | `name`, `offers.price`, `priceCurrency`, `availability` | Merchant/product snippets only with a real price shown on the page. |

Structured data describes a page Google has already decided to index. It never gets a page indexed on its own.

Minimal shape:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://a11studio.com" },
    { "@type": "ListItem", "position": 2, "name": "Artists", "item": "https://a11studio.com/artists" }
  ]
}
```

## Sitemap and robots

- Max 50,000 URLs or 50 MB per file (the project shards); only canonical, indexable URLs; accurate `lastModified`.
- `robots` disallows private paths (`/api/`, signed-in areas) and points at the sitemap index. Submit it in Search Console.

## Checklist

Critical
- [ ] HTTPS; robots allows crawling in production; non-production is noindex (`isIndexableEnv`)
- [ ] Unique title and description; a single `<h1>`
- [ ] No `noindex` on public pages; sitemap and noindex use the same visibility predicate

High
- [ ] Canonical and hreflang on every page; OG and Twitter cards via `/og-image.jpg`
- [ ] Mobile layout verified; Core Web Vitals passing

High (content)
- [ ] Each indexable template shows a specific `<h1>` and real body text inside `<main>` (count the words as Googlebot sees them); thin templates are `noindex` and left out of the sitemap

Medium
- [ ] Structured data for key entities, validated
- [ ] Descriptive `alt`, breadcrumbs, internal links with descriptive anchors

Ongoing
- [ ] Fix crawl errors in Search Console; check broken links; keep the sitemap current
- [ ] Re-inspect the key URLs monthly (GSC MCP `batch_url_inspection`) and track how many are indexed out of how many are submitted

Tools: Search Console, PageSpeed Insights, Rich Results Test, Lighthouse, Facebook Sharing Debugger, LinkedIn Post Inspector.
