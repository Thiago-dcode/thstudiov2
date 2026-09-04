# LLM Engineering — What You Ship

> The AI *in the product*. Not agentic, and the accurate names are better anyway.
> Related: [`ai-agent-harness.md`](./ai-agent-harness.md) · [`async-and-messaging.md`](./async-and-messaging.md) · [`security.md`](./security.md)

⚠️ **Keep this file and [`ai-agent-harness.md`](./ai-agent-harness.md) strictly separate in your head.** This is AI *you ship to users*. That is AI *you build with*. Conflating them is the fastest way to sound like someone repeating job-post vocabulary.

---

## 1. The honest starting point 🔴

**What you built is not agentic.**

🔵 An **agent** is an LLM in a loop with tools, choosing its own next action until a goal is met. The defining properties are **tool use**, **iteration**, and **autonomous control flow**.

🟢 Your `AiService` makes **single-shot, structured completion calls**. No tools, no loop, no planning. Calling it agentic will end badly on the first follow-up.

**But what you did build has real names**, and several are practices most people who claim "LLM experience" have never implemented.

---

## 2. The vocabulary, mapped to your code 🟢

| What's in your code | The name |
|---|---|
| Abstract `LLMService` + `openAi-llm.service.ts` | **Provider abstraction / model-agnostic interface** |
| One call returns EN/ES/PT together | **Multi-output structured generation** (~3× cost reduction) |
| Passing `EXPECTED_JSON` as the shape to fill | **Structured output** via **schema-in-prompt** |
| Stripping ```` ```json ```` fences before parsing | **Defensive parsing** |
| `matchesExpectedResponse` check | **Schema conformance validation** |
| `Math.min(10, Math.max(0, round(severity)))` | **Output clamping / range coercion** |
| Deriving `is_allowed` from severity, ignoring the model's own boolean | **Not trusting model self-assessment** |
| `temperature: 0.1` for moderation | **Low-temperature decoding for classification** |
| The 0–10 severity rubric in the prompt | **Calibrated rubric grading** / **LLM-as-judge** |
| "If unsure, it is NOT present — return the lower severity" | **Anti-false-positive instruction**; tuning the **precision/recall trade-off** |
| Defaulting to allowed when parsing fails | **Fail-open policy** |
| Sending an image URL as a content part | **Multimodal / vision input** |
| Stable system-prompt prefix | **Prompt caching optimisation** |
| Feeding profession, city, categories into the prompt | **Grounding / context injection** |
| `sanitizeSeoText` rejecting junk/stuffing/profanity | **Output guardrails** with a **safe fallback** |
| `llm_tokens_usage` table + per-user credits | **Token accounting / usage metering / quota enforcement** |
| Moderation feeding a 3-strike ban | **Content-safety pipeline with graduated enforcement** |

---

## 3. The three genuinely sophisticated moves

Most "I've used the OpenAI API" candidates have none of these. Lead with them.

### (a) Not trusting the model's own boolean 🟢

The moderation prompt returns both a severity score (0–10) and an `is_allowed` flag. **You ignore the flag and derive the decision from the score against your own threshold.**

🔵 **Why this is right:** a model's self-assessment and its graded output disagree more often than you'd expect, because the boolean collapses a judgement the score expresses with nuance. Deriving the decision yourself means **the threshold is a product decision you control and can tune without touching the prompt.**

> **Say this:** "The moderation call returns a severity score and its own allow/block boolean. I ignore the boolean and threshold the score myself — they disagree more than you'd think, and keeping the threshold in my code means I can tune strictness without re-engineering the prompt."

### (b) Fail-open, chosen deliberately 🟢

If parsing fails, content is **allowed**.

🔵 **Fail-open vs fail-closed** is a deliberate direction-of-failure choice:

- **Fail-open** — on error, permit. Availability over safety. A parsing bug won't block every upload.
- **Fail-closed** — on error, deny. Safety over availability. A bug blocks everything.

⚠️ **You chose the opposite direction for SEO indexability** ([`seo-and-performance.md`](./seo-and-performance.md#2-the-fail-closed-indexability-gate-)), which fails *closed*.

**Being able to name two systems in the same codebase where you chose opposite defaults, with reasons, is one of the strongest small answers you have.** The reasoning: a false block on upload is a broken product for a paying user; a false index of a dev environment is a duplicate-content problem taking weeks to unwind. Different costs, different directions.

### (c) Cost engineering 🟢

Four distinct mechanisms:

1. **Multi-output generation** — EN/ES/PT in one call rather than three
2. **Stable system-prompt prefix** — providers cache a shared prefix, cutting input cost
3. **Debouncing via delayed jobs** — rapid edits collapse into one generation ([`async-and-messaging.md`](./async-and-messaging.md#idempotency-))
4. **`llm_tokens_usage` metering against per-user credits** — per-call accounting

🟢 **And metering caught a real bug:** a nightly re-generation defect re-billing the entire catalogue indefinitely. **You only find that if you're measuring.**

> **Say this:** "Every call is metered into a usage table against per-user credits. That's how I caught a nightly job re-generating metadata for the whole catalogue on a loop — the cost showed up as a line going up before it showed up anywhere else."

**A cost bug found through instrumentation is a strong story** — it demonstrates that the metering is real rather than decorative.

---

## 4. Grounding, not RAG 🔴

🟢 You inject structured application data — profession, city, categories — into the prompt.

🔵 **RAG (Retrieval-Augmented Generation)** specifically means retrieving relevant documents from a corpus, usually via embeddings and a vector store, and injecting them. **You have no embeddings, no vector store, no retrieval step.**

**The accurate term is grounding, or context injection from structured application data.**

⚠️ It serves the same *purpose* as RAG — giving the model facts it wouldn't otherwise have — which is why the temptation exists. Claiming RAG invites "what's your chunking strategy?" and "how do you handle embedding drift?", and there's no good answer because there's no vector store.

> **Say this:** "It's grounding, not RAG — I inject structured application data I already have rather than retrieving from a corpus. There's no vector store, so calling it RAG would be wrong."

**Volunteering that distinction is worth more than the acronym.**

---

## 5. Structured output 🔵

**The core problem:** an LLM emits text; you need a typed object.

**The techniques, weakest to strongest:**

1. **Schema-in-prompt** — describe the shape, ask for JSON. 🟢 What you do. Needs defensive parsing.
2. **JSON mode** — the provider guarantees syntactically valid JSON, not your schema.
3. **Constrained decoding / structured outputs** — the provider enforces your JSON Schema at token-sampling level. The strongest available.
4. **Function/tool calling** — the model returns arguments matching a declared signature.

🟢 Your defensive chain — strip fences → parse → `matchesExpectedResponse` → clamp → guardrail → safe fallback — is the correct engineering around option 1.

⚠️ **Worth saying:** if you were building it today you'd use the provider's native structured-output mode and drop most of the defensive parsing. Knowing your approach is a generation behind, and why it was right at the time, is better than defending it as optimal.

---

## 6. Output guardrails 🟢

`sanitizeSeoText` rejects placeholder junk, keyword stuffing and profanity, falling back to a safe value rather than persisting garbage.

🔵 **Why this matters more than it sounds.** LLM output goes straight into `<title>`, `<meta description>` and alt text — **user-visible, search-engine-visible, permanent**. A hallucinated or stuffed description is an SEO liability that outlives the request. Validating before persisting is the difference between a demo and a product.

🔵 **Guardrails come in three places:** input (prompt injection, PII), output (what you do), and behavioural (for agents — not applicable here).

---

## 7. Model parameters 🔵

| Parameter | Effect |
|---|---|
| **temperature** | Randomness. 🟢 `0.1` for moderation — you want the same verdict every time |
| **top_p** | Nucleus sampling. Usually tune one *or* the other, not both |
| **max_tokens** | Output cap — a cost and latency control |
| **seed** | Best-effort reproducibility |

🟢 **Low temperature for classification is the right instinct**, and the reason is worth stating: creativity is a liability in a moderation decision. Higher temperature for SEO copy, where variety is a feature, is the correct opposite choice.

⚠️ **Determinism caveat:** even at `temperature: 0`, LLM output is not guaranteed reproducible — floating-point non-determinism and provider-side batching mean the same input can produce different output. Knowing this prevents an over-claim.

---

## 8. What you must not claim 🔴

- **Agentic AI** — single-shot, no tools, no loop
- **RAG / vector databases / embeddings** — none present
- **Fine-tuning** — none
- **Evals** — 🔵 an *eval* is a systematic test suite scoring model output against a labelled dataset. ⚠️ You have guardrails and validation, which is not the same thing. **This is worth knowing as a real gap**: you can't currently tell whether a prompt change made output better or worse, other than by looking.
- **Model training / MLOps** — none
- **Multi-agent product features** — the agents are in your dev harness ([`ai-agent-harness.md`](./ai-agent-harness.md)), a *different and still impressive* claim. Keep them apart.

---

## The paragraph to have ready

> **Say this:** "It's not agentic — they're single-shot structured generation calls behind a provider-agnostic interface, so the model is swappable. What I focused on is everything around the call: schema validation on the way out, clamping, guardrails that fall back to a safe value rather than persisting junk into meta tags, and per-call token metering against user quotas. The moderation path is an LLM-as-judge with a calibrated severity rubric, and I derive the allow/block decision from the score rather than trusting the model's own boolean, because those two disagree more often than you'd expect. The gap is that I have no evals — I can't currently prove a prompt change is an improvement, only that it doesn't break the schema."

**That paragraph is worth far more than the word "agentic" ever would be**, and the closing admission is what makes the rest credible.

---

## Interview drills

**"Tell me about LLM work you've shipped."**
The paragraph above. Lead with what surrounds the call, not the call.

**"How do you handle hallucination?"**
You can't prevent it; you constrain the blast radius. Schema conformance, clamping, guardrails, safe fallback, and grounding in real application data so there's less to invent. Then the honest limit: no evals, so quality is spot-checked rather than measured.

**"Is your system agentic?"**
No, and here's what it actually is. Correcting the premise is the answer.

**"How do you control cost?"**
Four mechanisms in §3(c), then the bug metering caught.

**"How would you add evals?"**
A labelled set of inputs with expected properties, scored on each prompt change — schema conformance rate, guardrail rejection rate, and agreement with human labels on a moderation sample. Having a *plan* for the gap is the next best thing to not having the gap.
