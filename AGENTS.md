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

## Workflow

1. Identify the area(s) the task touches and read the skills above.
2. Implement following those skills; respect package import boundaries.
3. Run the lint/test/build gates the skills describe for that area.
4. In the PR description, list which skills you followed.
