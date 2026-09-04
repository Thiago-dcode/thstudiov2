# Testing and Quality

> 786 tests, unevenly distributed — and why saying so is the right answer.
> Related: [`devops-and-cicd.md`](./devops-and-cicd.md) · [`ai-agent-harness.md`](./ai-agent-harness.md) · [`databases.md`](./databases.md)

---

## 1. What you have

🟢 **786 test cases across 33 tracked test files**, 158 `describe` blocks. Jest and Vitest, React Testing Library, Supertest.

Re-derive rather than trusting this number later:

```bash
git ls-files | grep -E '\.(test|spec)\.tsx?$' | wc -l
```

🟢 **The gate:** `.github/workflows/ci-cd.yml` runs `turbo run lint` then `turbo run test`, and `build-and-push` declares `needs: test`. **No image is built unless both pass.**

---

## 2. The test pyramid 🔵

```
        ╱╲          E2E — few, slow, brittle, highest confidence
       ╱  ╲
      ╱────╲        Integration — some, moderate speed
     ╱      ╲
    ╱────────╲      Unit — many, fast, cheap, narrow
```

The shape argues for many fast unit tests and few slow end-to-end ones, because cost and flakiness rise as you climb.

🔵 **The competing model — the "testing trophy"** (Kent C. Dodds) — argues integration tests give the best confidence-per-effort, since unit tests can all pass while the assembled system is broken. Knowing both models exist, and that the choice depends on where *your* bugs actually come from, is better than reciting either.

---

## 3. Your coverage shape, honestly ⚠️

🟢 **~9,100 lines of tests cover the query builder alone.** The API layer is comparatively thin.

**This is defensible, and you should say it plainly rather than hedge:**

> "My coverage is deliberately lopsided. The query builder has around 9,000 lines of tests because it's the thing everything else depends on — it generates SQL by hand, so a bug there is silent data corruption across 42 modules, and it has no upstream community finding bugs for me. The API layer is thinner, and the honest reason is that controllers and services are mostly orchestration over that core. If I were adding tests tomorrow, I'd start with authorisation paths, because those are the ones where a bug is a security issue rather than a visible failure."

**"I tested the thing everything else depends on first" is a real strategy.** "I have 786 tests" is a number; the strategy is the answer.

🟢 Specific tests worth knowing you have, because they signal judgement rather than coverage-chasing:

- `app-throttler.guard.spec.ts` — the guard behind the [trusted-proxy bug](./security.md#3-rate-limiting-and-the-trusted-proxy-bug-)
- `media-type.guard.spec.ts` — upload validation, a security boundary
- `redact.test.ts` — secret redaction
- `prune-daily-log-files.test.ts` — log retention
- `auth.service.spec.ts`
- `packages/common-lib/src/utils/__tests__/media.test.ts`

**Tests clustered on security boundaries and on the code that caused a real incident is exactly where they should be.**

---

## 4. What good tests look like 🔵

**AAA** — Arrange, Act, Assert. One logical assertion per test.

**Test behaviour, not implementation.** A test asserting a private method was called breaks on every refactor and proves nothing. A test asserting the output for an input survives refactoring — which is the entire point of having it.

**Test doubles**, precisely, since these get conflated:

| Term | Meaning |
|---|---|
| **Dummy** | Filler, never used |
| **Stub** | Returns canned answers |
| **Spy** | A stub that records how it was called |
| **Mock** | Pre-programmed with expectations; fails if not met |
| **Fake** | A working lightweight implementation (in-memory repo) |

🟢 **Your [ports-and-adapters](./architecture.md#4-ports-and-adapters-hexagonal-architecture) design makes all of this cheap.** Every external system sits behind an abstract class, so a test supplies a fake `StorageService` or `LLMService` without touching the network. **This is the concrete payoff of the architecture** — worth stating that way, since "it's more testable" is usually claimed and rarely demonstrated.

🟢 The same reason `MediaProcessor` takes dependencies as constructor arguments rather than calling `.instance()` internally ([`design-patterns.md`](./design-patterns.md#7-singleton)).

**Coverage is a weak metric.** 100% line coverage can miss every meaningful branch. It's useful as a *floor* and misleading as a *target* — Goodhart's law applies directly.

---

## 5. Static analysis and types 🟢

| Tool | Role |
|---|---|
| **TypeScript** | The largest single quality mechanism in the repo |
| **Biome** | Lint + format, one fast tool |
| **ESLint** | `packages/eslint-config` |
| **Turborepo** | Task orchestration + caching |

⚠️ **A deliberate trade worth knowing**, in `apps/web/next.config.ts`:

```ts
typescript: { ignoreBuildErrors: true },
// TypeScript is enforced in CI (test job) before deploy runs.
// Skipping the post-compile type-check here avoids a separate multi-minute
// pass on the resource-constrained droplet (1 vCPU / 1 GB).
```

**This looks like a red flag and isn't** — types are checked in CI *before* the image is built, so skipping the re-check during the build is removing a duplicate, not removing a gate. Be ready to explain that, because a reviewer scanning the config will flag it.

🔵 **Types as tests.** A well-typed codebase eliminates whole categories of test. The [shared kernel](./architecture.md#5-shared-kernel) means a queue producer and consumer that disagree is a *compile error*, not a runtime bug — that's a type doing a test's job, across a process boundary.

---

## 6. Quality gates and AI-assisted code 🟢

**This is the part that matters most for 2026 interviews.**

Your quality system has two layers that do different things:

| Layer | What it is | Property |
|---|---|---|
| `.opencode/agents/reviewer.md` | A subagent that reads every changed file and checks module structure, API contracts, import boundaries | **Heuristic** — judgement varies run to run |
| `turbo run lint` + `turbo run test` in CI | 786 tests, lint, typecheck | **Deterministic** — same input, same verdict, always |

🔵 **Why the distinction matters.** AI reviewers are useful and *not* enforcement: they're non-deterministic, so the same change can get different verdicts. The industry consensus is that they add context, while gates enforce policy. Presenting the reviewer as a *supplement* to the gate — never a replacement — is the sophisticated position.

🟢 **What the reviewer catches that lint can't:** "repository must extend `BaseRepository`", "controller must wrap responses in `ApiResponse<T>`", "no `../../` crossing package boundaries", "flag unnecessary `'use client'`". These are *architectural* rules with no lint rule to express them.

> **Say this:** "I use agents to write and review code, but the reviewer is a heuristic layer, not a gate — it's non-deterministic, so I don't let it decide whether something ships. The gate is lint plus 786 tests in CI, and nothing gets built unless both pass. The reviewer's job is catching things a linter structurally can't express — module layering, API contract mismatches between the two sides, import boundaries."

**That answer distinguishes you from both "I don't use AI" and "I let Cursor write it."**

---

## 7. Gaps ⚠️

1. **No E2E tests.** No Playwright or Cypress. Nothing tests that a user can actually sign up and upload.
2. **No post-deploy smoke test.** The pipeline's last word is "containers started", not "the site works."
3. **No coverage reporting.** You don't know your actual number.
4. **Thin API-layer tests**, especially authorisation paths.
5. **No load testing** ([`scaling-and-replicas.md`](./scaling-and-replicas.md#8-capacity-honestly-)).
6. **No mutation testing** — the technique that tests your tests by introducing bugs and checking they fail. Nice-to-have, worth knowing the name.

🔵 **The highest-value addition is a single E2E happy-path test**: sign up → upload → media reaches `COMPLETED`. It crosses every component (API, queue, worker, S3, LLM, WebSocket) and would catch integration breakage that 786 unit tests structurally cannot.

---

## Interview drills

**"What's your testing strategy?"**
§3. Lead with the lopsidedness and the reason, then say what you'd add next and why. **Never claim uniform coverage** — it's checkable and it isn't true.

**"How do you test code that calls OpenAI?"**
You don't call it. `LLMService` is an abstract port; tests inject a fake returning fixed responses. Concrete payoff of hexagonal architecture — and a good moment to point out that this is *why* the abstraction exists, not a happy accident.

**"You use AI to write code. How do you know it's correct?"**
§6. The heuristic/deterministic distinction. This question is increasingly common and most answers are weak.

**"What's the difference between a mock and a stub?"**
§4. A small precision question that's easy points.

**"Why does your Next.js build skip type checking?"**
Because CI already type-checked before the image was built, and repeating a multi-minute pass on a 1 vCPU droplet buys nothing. Knowing why the scary-looking line is safe is better than not having it questioned.
