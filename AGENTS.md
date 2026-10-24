# Agent instructions

This repo ships project skills in `.agents/skills/<name>/SKILL.md`. They hold the architecture boundaries, conventions and step-by-step recipes for this codebase. **Read the relevant skills before making any change** — including changes requested from Linear, Slack or GitHub issues. Do not start editing until you have.

## Always read first

- `.agents/skills/tech-stack/SKILL.md`
- `.agents/skills/architecture/SKILL.md`

## Then read the skills for the area you touch

| Area | Skills |
| --- | --- |
| `apps/web`, `packages/ui`, `packages/frontend-lib` (pages, components, styling, server actions) | `frontend` (also `accessibility`, `marketing-seo-ux` for public pages) |
| `apps/api`, `packages/database`, `packages/backend-lib`, `packages/common-lib` | `backend`, plus the matching recipe: `full-api-module` (spans several recipes), `api-migration`, `api-schema-types`, `api-repository`, `api-join-queries` (+ `collision-prevention`), `api-nest-module`, `api-http-endpoint`, `api-service`, `api-queue-processor`, `api-mail` |
| Verifying API changes | `api-verification`, `api-testing` |
| Commit / push / watch CI (only when explicitly asked) | `deployment` |

## Multi-agent pipeline (Claude Code)

**The user never invokes the agents. Choosing the tier is your job, on every implementation request.** This is a standing instruction to use the subagents in `.claude/agents/` whenever the tier calls for them. Before you start editing, say in one line which tier you picked and why.

| Tier | When (any one trigger is enough for a higher tier) | What you do |
|---|---|---|
| **Direct** | UI/styling tweak, copy or i18n string, single component, config value, typo, an obvious one-file bug, questions and research | Implement it yourself and run the area's lint/build. No agents. |
| **Reviewed** | Logic change in one area across a few files, a bug fix that changes behaviour, a new server action or a small endpoint change with no schema change | Implement it yourself, write a short `.claude/work/<slug>/plan.md` (goal + acceptance criteria + files), then spawn a fresh `reviewer` and fix its BLOCKER/MAJOR findings. |
| **Full pipeline** | DB migration or schema/type contract change · new API module, endpoint family, queue processor or mail · spans both api and web · auth, permissions, payments (Stripe), uploads/S3, moderation · public URLs, slugs, redirects, sitemap/noindex/SEO invariants · roughly 6+ files of logic | Follow `.agents/skills/orchestrate/SKILL.md`: `planner` → `api-builder` / `web-builder` → `test-writer` → `reviewer`, with a bounded fix loop. |

Examples: "change the button colour" is **Direct**. "Fix the slug validation message" is **Direct**. "Make the upload limit configurable per plan" is **Reviewed**. "Username change history with redirects from old usernames" is **Full pipeline** (migration, new module, api+web, SEO redirects). If you're unsure between two tiers, pick the higher one. If the work grows past its tier partway through, move it up and say so.

Agents hand off through `.claude/work/<slug>/` files, and `.claude/hooks/guard.mjs` keeps each agent in its own lane.

## Workflow

1. Identify the area(s) the task touches and read the skills above.
2. Implement following those skills; respect package import boundaries.
3. Run the lint/test/build gates the skills describe for that area.
4. In the PR description, list which skills you followed.
