---
name: orchestrate
description: Multi-agent pipeline (planner → api-builder/web-builder → test-writer → reviewer, with a fix loop). Use proactively, without being asked, whenever an implementation request hits a Full-pipeline trigger in AGENTS.md (migration, new API module, api+web change, auth/payments/uploads, SEO/URL invariants, ~6+ files of logic). Not for UI tweaks, copy, or one-file fixes.
argument-hint: <what to build or fix>
---

# Orchestrate

You are the **orchestrator**. You run the pipeline, pass context between agents through files, and report to the user. **Don't edit source code yourself.** That keeps your context small and keeps the review independent. Subagents are defined in `.claude/agents/`.

## Shared state: `.claude/work/<slug>/`

Agents never see each other's conversations. Everything they share is on disk:

| File | Written by | Read by |
|---|---|---|
| `plan.md` | planner | everyone |
| `build-api.md` / `build-web.md` | builders | test-writer, reviewer |
| `tests.md` | test-writer | reviewer |
| `review.md` | reviewer | orchestrator → builders |

Pick a short kebab-case `<slug>` for the task. Each agent prompt only needs the slug, the file paths to read, and anything new since the plan. Don't paste the plan into prompts.

## Pipeline

**0. Confirm the tier.** The tier table in `AGENTS.md` decides. *Direct* and *Reviewed* tasks don't use this pipeline. If the task turns out to be *Reviewed*, stop here and follow that row instead. The user doesn't invoke agents; you decide, and you tell them the tier in one line.

**1. Plan.** Spawn `planner` with the request, the slug, and the **Constraints** it can't discover itself: the relevant user preferences from your memory (e.g. preserve server/client boundaries, Zod helper style, public-visibility predicates, photographer focus) and anything the user said in chat. If it returns *Blocking questions*, ask the user (AskUserQuestion), append the answers to `plan.md`, and continue. For large or risky plans, show the user the AC list and work split and get a go-ahead before building.

**2. Build.** Spawn `api-builder` and/or `web-builder` with: slug, "read `.claude/work/<slug>/plan.md`, implement your section". Follow the plan's order: send both spawns in **one message** when it says parallel; run api first when common-lib changes. Keep each builder's agent ID; you will resume it in step 5. If a builder reports *Needs other owner*, route that item to the owner. If a builder reports a contract problem, fix `plan.md` (re-run the planner if it's substantial) before going on.

**3. Test.** Spawn `test-writer` with the slug. Skip it when the plan has no testable ACs (e.g. pure UI copy).

**4. Review.** Spawn `reviewer` with the slug and round number. Always do this, even for *small* tasks. It is the reason the user doesn't have to review.

**5. Fix loop.** If the verdict is `CHANGES_REQUESTED`:
- Send each BLOCKER/MAJOR finding to its owner by **resuming that agent** (SendMessage to the stored agent ID), so it keeps its implementation context. Send only the findings, not the whole review.
- Findings owned by test-writer go back to test-writer the same way.
- Then spawn a **fresh** `reviewer` for round N+1 (fresh context means independent judgment). Tell it which findings to verify.
- Stop after **2 fix rounds**. If it still isn't approved, report the open findings to the user and stop. Don't loop forever.

**6. Report** to the user, briefly:
- what was built (from the plan's Goal), and the AC table from `review.md`
- files changed (from the build reports)
- gates run by the reviewer and their result
- any MINOR findings left open, deviations, and manual checks the user should do (e.g. "open /atelier/settings and change username")
- Don't commit. Committing follows the `deployment` skill, and only when the user asks.

## Rules

- One owner per file, enforced by `.claude/hooks/guard.mjs`. If two agents need the same file, run them sequentially.
- Subagents can't commit, push, stash, reset or check out; the guard blocks it.
- Read the agents' reports, not their diffs. Open source files only to settle a dispute between agents.
- Leave `.claude/work/<slug>/` in place after the task (it's gitignored). It is the audit trail and lets a later session resume.
