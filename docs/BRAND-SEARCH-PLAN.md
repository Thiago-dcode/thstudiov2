# A11STUDIO — Ranking #1 for "a11studio" (branded search plan)

> **Goal:** someone types **a11studio** (or "a11 studio", "a11studio app", "a11studio portfolio") into Google → **a11studio.com is result #1**, ideally with sitelinks and, later, a knowledge panel.
> **Written:** 2026-09-27. **Companion doc:** `docs/SEO-AUDIT.md` (technical SEO). This plan covers the *brand/entity* side.
> **Legend:** 🤖 = code change (I can implement it) · 🧑 = you (accounts, content, outreach) · ⏱ = effort

---

## 1. Why you are not #1 today (diagnosis)

| # | Cause | Weight |
|:-:|---|:-:|
| 1 | **The name is shared.** For "a11studio" / "A11 Studio", Google already knows older entities: **A11.studio** (UX/UI studio, Bratislava — domain `a11.studio`, LinkedIn `/company/a11studio` with ~900 followers, Awwwards, Instagram `@a11.studio`), **a11studio.com.au** (photography studio), **a11studio.eu**, **A11 Design Studio** (Malaysia), **Studio A11** (Crunchbase), several Instagram accounts. Google has to *decide which "A11 Studio" you mean* — and today every signal points to them. | 🔴 |
| 2 | **The domain is ~7 weeks old** (live since 2026-08-11). Google gives new domains little trust until it sees consistent signals over time. | 🔴 |
| 3 | **Almost no one links to or mentions a11studio.com.** Branded ranking is mostly "does the web agree this site *is* A11STUDIO?" — measured by links, mentions and profiles that point here. | 🔴 |
| 4 | **Until the 2026-09-27 fixes deploy, Googlebot saw the `<title>`/canonical in `<body>`,** not `<head>` (SEO-AUDIT §1.1), and `dev.a11studio.com` was indexed as a duplicate (§19.1). Both muddy which URL is "the" A11STUDIO. | 🟠 |
| 5 | **Inconsistent brand spelling across the web:** site = "A11STUDIO", Instagram = `@a11studio.app`, LinkedIn = `a11-studio`, Organization schema had no `alternateName` on the WebSite node. Google matches entities partly by identical names. | 🟠 |
| 6 | **Search Console / Bing registration status unknown** (SEO-AUDIT §19.2). Without it, you can't request indexing, see the "a11studio" query, or fix problems. | 🟠 |

**The good news:** the query people type — **`a11studio`**, one word — is an **exact match of your `.com` domain**. None of the competitors own `a11studio.com`. For a unique exact-match brand, reaching #1 is realistic in **4–12 weeks** once the signals below are in place. "A11 Studio" (two words) is harder because A11.studio competes directly — treat it as a phase-2 target.

---

## 2. Phase 0 — Prerequisites (this week) ⏱ ~2 h

All of these are 🧑 console work after deploying the 2026-09-27 changes.

- [ ] **Deploy** the SEO fixes, then purge `robots.txt` in Cloudflare (SEO-AUDIT "After deploying").
- [ ] **Google Search Console → Domain property `a11studio.com`** (DNS TXT in Cloudflare). If it already exists, confirm you are an owner.
- [ ] **Submit `https://a11studio.com/sitemap_index.xml`.**
- [ ] **URL Inspection → "Request indexing"** for, in this order: `/`, `/about`, `/faqs`, `/artists`, `/portfolios`, `/artists/thsworld`. Also `/es` and `/pt` home.
  - In URL Inspection → *View crawled page* → confirm `<link rel="canonical">` is inside `<head>` (proves SEO-AUDIT §1.1 is live).
- [ ] **Bing Webmaster Tools → Import from GSC.** Bing's index also feeds ChatGPT search, Copilot and DuckDuckGo.
- [ ] **Kill the dev duplicate:** GSC → Removals → *Remove all URLs with prefix* `https://dev.a11studio.com/`, then close the dev window (SEO-AUDIT §19.1). A second host serving "A11STUDIO" splits the brand signal.
- [ ] **Cloudflare → Security → Bots:** make sure "Block AI Scrapers" / Bot Fight Mode is not challenging Googlebot or Bingbot (Security → Events, filter by user agent).
- [ ] **Baseline:** GSC → Performance → Queries → filter `a11studio` → note impressions, average position, CTR. Repeat weekly (§8).

---

## 3. Phase 1 — Tell Google exactly who you are, on your own site ⏱ ~0.5 day

Google builds its idea of a brand ("entity") first from **your homepage** and **structured data**. Make them unambiguous.

### 3.1 Name the brand the same way, everywhere 🧑 decide once
Pick the canonical name and the variants Google should connect to it:

| Canonical | Alternate names to declare |
|---|---|
| **A11STUDIO** | A11 Studio · a11studio · A11STUDIO App |

Use **exactly "A11STUDIO"** in every profile name, bio, email signature, press text and social handle where possible. Avoid "A11 Studio" as the primary spelling — that is the competitor's name.

### 3.2 Site-name + entity structured data 🤖 ⏱ 30 min
- [ ] 🤖 Add `alternateName: ["A11 Studio", "a11studio"]` to the **`WebSite`** node on the home page. Google's **site name** in results comes from `WebSite.name` / `alternateName` on the homepage — it is how Google learns that the query "a11studio" means *this* site.
- [ ] 🤖 Keep `Organization` + `WebSite` on the **exact** homepage URL `https://a11studio.com/` (done), and extend `Organization.sameAs` with every official profile created in §4 (single source: `apps/web/src/lib/social.ts`).
- [ ] 🤖 Add `founder.sameAs` (your personal LinkedIn / YouTube / Instagram) — ties the brand to a real, notable person (your 50k-subscriber channel is a strong trust signal).
- [ ] 🧑→🤖 Provide a **rectangular logo** (min 112×112, ideally ~600×60 wordmark PNG on transparent/white) for `Organization.logo` — used for the logo in knowledge panels.

### 3.3 Put the brand in the visible text Google reads first 🤖 ⏱ 30 min
- [ ] 🤖 Homepage `<h1>`: include the brand, e.g. **"A11STUDIO — let your art be discovered"** (today the `<h1>` is the tagline only).
- [ ] 🤖 One plain **definition sentence** high on the homepage (under the hero): *"A11STUDIO is a portfolio platform where artists showcase their work and clients discover and hire them."* — the sentence Google and AI engines lift as "what is A11STUDIO".
- [ ] Title is already brand-first (`A11STUDIO — Discover & Hire Artists | Portfolios for Artists`) — keep "A11STUDIO" as the **first word** of the home title in all three locales. ✅

### 3.4 Make the About page the "official biography" 🤖/🧑 ⏱ 1 h
Answer engines and Google's entity systems treat the About page as the source of truth.
- [ ] 🧑 Add concrete, citable facts: **founded 2025**, **founder Thiago Ferreira**, **based in Spain (A Coruña)**, languages (EN/ES/PT), what it is / isn't, contact email. Facts beat adjectives.
- [ ] 🤖 Mirror them in `Organization` (`foundingDate`, `founder`, `address` → `addressCountry: ES`, `areaServed`).

---

## 4. Phase 2 — Build the entity across the web (the biggest lever) ⏱ 1–2 days, then ongoing

Google ranks you #1 for your own name when **many independent, trusted places agree** that "A11STUDIO" = a11studio.com. Every item below is a profile or listing with: **name "A11STUDIO"**, the **same one-line description**, and a **link to https://a11studio.com**.

### 4.1 Official brand profiles 🧑 (claim the name before anyone else does)
| Platform | Why it matters | Status |
|---|---|:-:|
| **LinkedIn company page** (`/company/a11-studio`) | Strong entity source; rename display name to exactly "A11STUDIO", website field = a11studio.com | [ ] |
| **Instagram** `@a11studio.app` | Put `a11studio.com` in bio link; name field "A11STUDIO" | [ ] |
| **X / Twitter** — try `@a11studio` / `@a11studioapp` | Also enables `twitter:site` meta | [ ] |
| **YouTube channel** "A11STUDIO" | Product videos rank for the brand themselves (a second #1 result is also a win) | [ ] |
| **Facebook page** "A11STUDIO" | Another consistent NAP-style profile | [ ] |
| **Pinterest business** "A11STUDIO" (verify the domain) | Visual platform = your audience; domain verification is a direct ownership signal | [ ] |
| **TikTok** `@a11studio` (claim, even if idle) | Prevents squatting, adds a sameAs | [ ] |
| **Behance / Dribbble** team page | Art/design ecosystem, relevant links | [ ] |
| **GitHub org** (optional) | Cheap extra sameAs | [ ] |

After creating them, send me the URLs → 🤖 add all to `Organization.sameAs` + footer.

### 4.2 Business / startup databases 🧑
| Listing | Notes | Status |
|---|---|:-:|
| **Crunchbase** — "A11STUDIO" | Google's knowledge graph reads it; a competitor ("Studio A11") is already there | [ ] |
| **Product Hunt** launch | One launch day = dozens of mentions/links + a permanent brand page | [ ] |
| **Wikidata** item "A11STUDIO" (instance of: online platform / website; founder; inception 2025; official website; social IDs) | The strongest single knowledge-panel feeder. Needs at least one independent reference (press article, Product Hunt) — do it after §5 gives you one | [ ] |
| **G2 / Capterra / AlternativeTo / SaaSHub / BetaList / Indie Hackers** | "Portfolio platform" category listings — each is a brand mention + link | [ ] |
| **Google Business Profile** | ⚠️ Only if you qualify (a real address or service area where you meet clients). Online-only platforms are not eligible — don't create a fake one | [ ] |

### 4.3 The founder as an entity 🧑 (your unfair advantage)
You have a 50k-subscriber photography/travel YouTube channel. That audience and its authority are the fastest way to make Google trust "A11STUDIO".
- [ ] Channel "About" → link **a11studio.com**, text "Founder of A11STUDIO".
- [ ] A video: **"I built A11STUDIO — a portfolio platform for artists (why I quit YouTube and came back)"** — the story in A11STUDIO.md is genuinely compelling. Link in description; pin a comment.
- [ ] Add "A11STUDIO" + link to the description of your most-viewed existing videos.
- [ ] Personal LinkedIn / Instagram: "Founder @ A11STUDIO" + link.

---

## 5. Phase 3 — Earn mentions & links (ongoing, 4–12 weeks) ⏱ a few hours/week

Profiles you create yourself are the base; **independent mentions** are what push you over the established "A11.studio".

### 5.1 Artists as your distribution 🤖 + 🧑
Every artist on the platform is a potential backlink with the exact brand anchor.
- [ ] 🤖 **"Add to your bio / website" kit** in the atelier: copy-ready link ("My portfolio on A11STUDIO") + a small **"Portfolio on A11STUDIO" badge** (HTML snippet / image) linking to their profile on a11studio.com.
- [ ] 🤖 Share flow: when an artist shares their profile, prefill text that includes "on A11STUDIO".
- [ ] 🧑 Onboarding email: "Put your A11STUDIO link in your Instagram bio" — every bio link is a crawlable brand mention.

### 5.2 Launches & communities 🧑
- [ ] **Product Hunt** launch (Tuesday–Thursday, prepare hunters/supporters).
- [ ] **Show HN** (Hacker News) — "Show HN: A11STUDIO — a portfolio platform for artists, built by a photographer turned engineer".
- [ ] **Reddit** — respectful, rule-abiding posts where self-promo is allowed (r/SideProject, r/photography weekly threads, r/Filmmakers, r/Illustration feedback threads). Lead with the story, not the pitch.
- [ ] **Indie Hackers** build-in-public post.

### 5.3 Press & editorial 🧑
- [ ] Spanish / Portuguese / Galician tech & photography press (local angle: *"Un fotógrafo de A Coruña crea una plataforma…"*) — local media link generously to local founders.
- [ ] Photography & art blogs / podcasts — the founder story (burnout from creating for algorithms → a platform against algorithms) is a real hook.
- [ ] Ask to be added to **"best portfolio websites / Behance alternatives 2026"** listicles (e.g. Pixpa, Colorlib, Journo Portfolio style roundups) — these rank for your category and name you next to known brands.

### 5.4 Things **not** to do
- ❌ Buying links, link farms, PBNs, "brand-mention" packages — penalty risk, and a young domain can't absorb one.
- ❌ Fake reviews or fake Google Business Profile.
- ❌ Spinning up extra domains/subdomains that also say "A11STUDIO" (it splits the signal — same lesson as the dev subdomain).

---

## 6. Phase 4 — Make people *search* for "a11studio" 🧑 ongoing

Google weighs **navigational demand**: people searching your exact name and clicking your site is itself a ranking signal.
- [ ] Say "search **a11studio**" (one word) in videos, posts and talks — train the exact query you own.
- [ ] Put **a11studio.com** on everything visual: video end screens, watermark on your own photography, business cards / QR codes, email signature.
- [ ] Newsletter / waitlist emails → links to a11studio.com (branded traffic).

---

## 7. Phase 5 — Own more of page 1 (after you are #1)

- [ ] **Sitelinks** come automatically once Google trusts the site; help it with a clear nav (About, FAQ, Artists, Portfolios — already in header/footer) and descriptive titles.
- [ ] **Knowledge panel**: Wikidata + consistent sameAs + press. Once it appears, **claim it** ("Claim this knowledge panel" via Google, verified through Search Console / your official profiles).
- [ ] Occupy the rest of page 1 with *your* properties: YouTube video, LinkedIn, Instagram, Product Hunt page, Crunchbase, press articles.
- [ ] Second target: **"A11 Studio"** (two words) and **"a11studio portfolio"** — tracked separately; expect it to take longer because of A11.studio.

---

## 8. Measure it (weekly, 10 minutes)

| Metric | Where | Target |
|---|---|---|
| Avg. position for `a11studio` | GSC → Performance → Query filter | **1.0** within ~8–12 weeks |
| Impressions for `a11studio` / `a11 studio` | GSC | rising week over week (= brand demand growing) |
| CTR on `a11studio` | GSC | > 50% once #1 |
| Indexed pages | GSC → Pages | all sitemap URLs indexed; **0** `dev.a11studio.com` |
| Referring domains | GSC → Links → Top linking sites | +5–10 / month from §4–5 |
| Brand appears in AI answers | Ask ChatGPT / Perplexity / Gemini "What is A11STUDIO?" monthly | correct description + link |

---

## 9. Realistic timeline

| When | What should happen |
|---|---|
| Week 0–1 | Deploy fixes, GSC/Bing verified, sitemap index submitted, homepage re-crawled with metadata in `<head>` |
| Week 1–3 | Profiles (§4.1) + founder links (§4.3) live; `WebSite.alternateName` + h1/definition shipped; first position gains for `a11studio` |
| Week 3–8 | Product Hunt / Show HN / press (§5); artists' bio links accumulating; target **top 3** for `a11studio` |
| Week 8–12 | **#1 for `a11studio`**, sitelinks appear; Wikidata item; start on "A11 Studio" |
| Month 4+ | Knowledge panel candidate; own most of page 1 |

---

## 10. What I can implement right now (🤖, ~1–2 h total)

1. `WebSite.alternateName` + expanded `Organization` (founder `sameAs`, `address`, `areaServed`) — §3.2 / §3.4
2. Homepage `<h1>` with the brand + one visible definition sentence (en/es/pt) — §3.3
3. `twitter:site` once the X handle exists — §4.1
4. "Add A11STUDIO to your bio" link + badge kit in the atelier, and share text that includes the brand — §5.1
5. IndexNow ping on publish/update (Bing/Yandex/Seznam + ChatGPT search via Bing) — speeds up discovery

What I need from you for items 1 and 3: your **personal profile URLs** (YouTube channel, LinkedIn, Instagram), and the handles you claim in §4.1.
