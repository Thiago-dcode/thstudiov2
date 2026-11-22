# Structured data and launch checklist

Read when adding JSON-LD or doing a pre-launch SEO pass. Use the project's `lib/seo/json-ld.tsx`.

## JSON-LD

Always escape: `JSON.stringify(data).replace(/</g, "\\u003c")`. Validate at the Rich Results Test and validator.schema.org. Only mark up content visible on the page.

| Type | Use for | Required essentials |
|---|---|---|
| `Organization` | site-wide, homepage | `name`, `url`, `logo`, `sameAs` |
| `Person` / `ProfilePage` | artist pages | `name`, `url`, `image`, `sameAs` |
| `ImageObject` / `CreativeWork` | portfolio and media pages | `name`, `contentUrl`, `creator`, `datePublished` |
| `Article` | blog or guides | `headline`, `image`, `author`, `datePublished`, `dateModified`; set `og:type=article` |
| `FAQPage` | real FAQ sections | `mainEntity[]` of `Question` + `acceptedAnswer` |
| `BreadcrumbList` | any nested page | `itemListElement[]` with `position`, `name`, `item` |
| `Product` / `Offer` | paid plans, services | `name`, `offers.price`, `priceCurrency`, `availability` |

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

Medium
- [ ] Structured data for key entities, validated
- [ ] Descriptive `alt`, breadcrumbs, internal links with descriptive anchors

Ongoing
- [ ] Fix crawl errors in Search Console; check broken links; keep the sitemap current

Tools: Search Console, PageSpeed Insights, Rich Results Test, Lighthouse, Facebook Sharing Debugger, LinkedIn Post Inspector.
