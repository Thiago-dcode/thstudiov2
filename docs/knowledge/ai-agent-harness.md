# The Agent Harness — How You Build

> The AI you develop *with*. In 2026 this is a bigger differentiator than the LLM features in the product.
> Related: [`llm-engineering.md`](./llm-engineering.md) · [`testing-and-quality.md`](./testing-and-quality.md) · [`architecture.md`](./architecture.md)

⚠️ **This is not [`llm-engineering.md`](./llm-engineering.md).** That file is AI you ship to users. This is AI you build with. Two separate claims — keep them separate and both get stronger.

---

## 1. Why this matters in 2026 🔵

The market has moved past "do you use AI tools?". What hiring managers screen for now:

- **Not** tool name-drops. "I use Cursor" is the pattern recruiters explicitly discount.
- **Yes** how AI is integrated into a real workflow, with specifics.
- **Most of all**, the *system that lets you trust what was written* — because coding agents are heuristic reviewers, not enforcement mechanisms, and the same change can get different verdicts across runs. Writing code got cheap; **review became the central activity**, and the durable advantage is the scaffolding around it.

🟢 **You have that scaffolding**, and more deliberately than most people who list these words. That's the claim to make.

---

## 2. Agent Skills — `.agents/skills/` 🟢

**19 skill directories**, each with a `SKILL.md` carrying YAML frontmatter:

```yaml
---
name: api-repository
description: >-
  Add TH Studio NestJS repository DB access for an entity. Use when creating a
  repository, adding query methods, formatters, or pagination in
  apps/api/src/v1/modules, without requiring a controller or service.
---
```

```
accessibility          api-migration        api-verification    frontend
api-http-endpoint      api-nest-module      architecture        full-api-module
api-join-queries       api-queue-processor  backend             marketing-seo-ux
api-mail               api-repository       collision-prevention tech-stack
api-schema-types       api-service          api-testing
```

### Every element has a name 🔵

**Agent Skill** — a packaged, model-invoked capability: instructions plus optional resources, loaded on demand.

**Trigger description** — the `description` field tells the model *when* to load the skill. Yours are written in the correct style: *"Use when…"* plus explicit negative conditions (*"without requiring a controller or service"*). **Negative triggers are an advanced touch** — they prevent over-firing, which is the main failure mode of a large skill library.

**Progressive disclosure** — skill bodies stay short and link to `references/` files (`accessibility/references/A11Y-PATTERNS.md`, `WCAG.md`, `api-testing/reference.md`) read only when needed. This is deliberate **context-window management**: spend tokens on the task, not on documentation the model may not need.

**Skill composition** — `full-api-module` chains other skills; `api-repository` instructs the agent to load `collision-prevention` *first*. That's a **dependency graph between skills**, and a **precondition**.

**Executable architectural governance** — the skills encode your invariants (*"all queries, formatters and pagination live here"*, *"never put SQL in the service"*). **Your layering rules aren't in a wiki nobody reads; they're in the tool that writes the code.**

> **Say this:** "I wrote nineteen Agent Skills for the repo that encode the project's conventions as model-invoked recipes. Each has a trigger description with negative conditions so it doesn't over-fire, and they use progressive disclosure — the body stays short and links to reference files loaded only when needed, so context goes to the task rather than the docs. They compose: the repository skill requires the collision-prevention skill before writing a join."

⚠️ **Known issue to fix before showing anyone.** `opencode.json` sets `skills.paths` to `.opencode/skills` — **that directory doesn't exist.** The skills live in `.agents/skills/`. Neither the opencode path nor a Claude Code skills path currently points at them. The skills are real, authored and version-controlled, but the wiring is stale. **One-line fix; do it before a walkthrough.**

---

## 3. MCP — `opencode.json` 🟢

```json
"mcp": {
  "postgres": {
    "type": "local",
    "command": ["npx","-y","@modelcontextprotocol/server-postgres","postgres://…"]
  }
}
```

🔵 **MCP = Model Context Protocol** — an open standard for connecting a model to external tools and data sources, so any MCP-speaking client can use any MCP server without bespoke glue. **Skills provide *guidance*; MCP provides *access*.** That one-line distinction is the thing to have ready.

🟢 You run a **local (stdio-transport) MCP server** exposing Postgres to the agent — and you use it meaningfully. `.agents/skills/api-testing/SKILL.md` instructs the agent to hit `localhost:8080` with curl, then **verify the resulting database side effects through the Postgres MCP server**.

**That's a closed act → observe → verify loop against real infrastructure**, which is exactly what MCP is for, and materially better than trusting an HTTP 200.

> **Say this:** "I run a Postgres MCP server locally so the agent can verify database side effects directly. My API-testing skill closes the loop — call the endpoint, then assert the row actually changed — instead of trusting the response body. Skills are the procedural layer, MCP is the access layer."

⚠️ **Security note worth volunteering:** an MCP server handing a model database credentials is a real trust boundary. Yours is local, dev-only, and scoped to a dev database. Saying that unprompted shows you thought about it.

---

## 4. Multi-agent orchestration — `.opencode/agents/` 🟢

Eight agent definitions: `orchestrator`, `planner`, `explorer`, `builder-be`, `builder-fe`, `reviewer`, `debugger`, `tester`.

| What you wrote | The name |
|---|---|
| `mode: primary` delegating to `mode: subagent` | **Orchestrator–worker pattern** (supervisor / coordinator) |
| One agent per phase, narrow job | **Role specialisation** |
| `tools: {write: false, edit: false, bash: false}` on orchestrator/planner/reviewer | **Least-privilege tool grants** |
| "Send only what each agent needs — no full conversation history" | **Context isolation / context engineering** |
| Phases 3a and 3b run in parallel | **Parallel fan-out**, then **fan-in** at review |
| FAIL → debugger → re-review; FAIL → debug → re-test | **Feedback loop** with **bounded retry** |
| "API contract both builders share" | **Shared contract / interface-first coordination** |
| explorer runs first to extract conventions | **Grounding phase** — reduces hallucinated conventions |
| debugger priority `CONTRACT → SECURITY → STRUCT → BUG → STYLE` | **Triage policy / severity ordering** |

### The two details worth leading with

**(a) A reviewer that cannot write.** `reviewer.md` declares `write: false, edit: false, bash: false, read: true`. 🔵 **A reviewer that can edit will fix what it finds instead of reporting it, and you lose the review.** Enforcing that structurally rather than by instruction is the interesting part.

**(b) Context isolation is why it works at all.** 🔵 The naive multi-agent setup passes full history to every agent, which blows the context window and degrades quality — models attend worse over long, noisy contexts. Sending each agent only its slice is **the** design constraint of multi-agent systems, and stating that is what separates having read about it from having built it.

🟢 The `reviewer.md` checklist is concrete architectural enforcement, not vibes:

- Module path must be `apps/api/src/v1/modules/{name}/`
- Repository must extend `BaseRepository`
- Controller must wrap responses in `ApiResponse<T>`
- Server actions: `'use server'` first line, `server-actions/`, `.action.ts` suffix
- Flag unnecessary `'use client'`
- Flag any `../../` crossing package boundaries

**None of those are expressible as lint rules**, which is precisely the niche.

> **Say this:** "I built an agent harness for the repo: an orchestrator delegating to seven specialist subagents, with least-privilege tool grants per role — the reviewer literally can't write files, so it reports instead of quietly fixing. Context is isolated per agent rather than passing full history, which is the thing that makes multi-agent work at all. The two builders run in parallel against a shared API contract produced in the planning phase, and there's a debug-and-retry loop before anything is accepted."

---

## 5. The whole thing is the harness 🔵

**Agent harness** = the scaffolding around the model determining what it can see, what it can do, and when. Yours:

```
.agents/skills/       19 skills — procedural knowledge, progressive disclosure
.opencode/agents/      8 subagents — roles, tool grants, orchestration
opencode.json          MCP servers — access layer
.claude/settings.local.json   permission config
CI: lint + 786 tests   the deterministic gate
```

---

## 6. Heuristic vs deterministic — the point that lands 🟢

**This is the most important idea in this file.**

| Layer | Property | Role |
|---|---|---|
| Reviewer subagent | **Heuristic** — varies run to run | Adds context, catches architectural drift |
| `turbo run lint` + `turbo run test`, `build-and-push: needs: test` | **Deterministic** — same input, same verdict | **Decides whether it ships** |

🔵 The industry consensus is exactly this: AI reviewers are *not* enforcement mechanisms because they don't operate against fixed acceptance criteria and aren't reproducible. What catches problems is gates that run regardless of how clean the code looks.

> **Say this:** "I use agents to write and review code, but the reviewer is a heuristic layer, not a gate — it's non-deterministic, so I don't let it decide whether something ships. The gate is lint plus 786 tests in CI, and nothing gets built unless both pass. The reviewer's job is the things a linter structurally can't express — module layering, contract mismatches between frontend and backend, import boundaries."

**That single answer positions you above both "I don't use AI" and "I let the agent write it."**

---

## 7. What this does *not* make you 🔴

- **An ML engineer.** No training, no fine-tuning, no model evaluation.
- **An agent-framework author.** You configured a harness; you didn't build LangGraph.
- **Someone with agentic AI in production.** The agents are development-time. The product's AI is single-shot ([`llm-engineering.md`](./llm-engineering.md)).
- **Someone with measured productivity data.** ⚠️ You have no before/after metrics. Don't invent a percentage — "it made me 40% faster" is unfalsifiable and reads as such.

---

## Interview drills

**"Do you use AI tools?"**
Don't answer the question as asked — that answer is worthless. Answer the question behind it: what the *system* is. Skills, subagents with tool grants, MCP for verification, and the deterministic gate underneath.

**"How do you make sure AI-generated code is correct?"**
§6. The single highest-value answer in this file.

**"What's MCP?"**
An open standard connecting models to tools and data. Skills guide, MCP accesses. Then your concrete use: verifying DB side effects instead of trusting an HTTP response.

**"Why does your reviewer agent have no write access?"**
Because a reviewer that can edit fixes instead of reporting, and you lose the review. Structural enforcement over instruction.

**"Has this actually made you more productive?"**
Be honest: no measurement, so no number. What you *can* say is what it changed qualitatively — conventions are applied consistently across 42 modules without you re-explaining them, and the review layer catches structural drift a linter can't see. **Refusing to invent a metric is itself a good signal.**
