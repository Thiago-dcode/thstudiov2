# DevOps and CI/CD

> From a commit to running production code, and the strategies you deliberately don't have.
> Related: [`nginx.md`](./nginx.md) · [`scaling-and-replicas.md`](./scaling-and-replicas.md) · [`security.md`](./security.md)

---

## 1. Containers, from first principles 🔵

**A container is a process with restricted visibility**, not a virtual machine. Linux gives it:

- **namespaces** — its own view of PIDs, network, mounts, hostname
- **cgroups** — limits on CPU, memory, I/O
- **union filesystem** — layered image

There's no guest kernel. That's why a container starts in milliseconds and a VM in seconds, and why containers are less isolated than VMs (kernel exploits cross the boundary).

**Image vs container:** an image is a read-only template; a container is a running instance with a writable layer on top. Class and object.

**Layers.** Each Dockerfile instruction creates a layer, cached by content. Ordering matters enormously:

```dockerfile
COPY package.json pnpm-lock.yaml ./   # changes rarely
RUN pnpm install --frozen-lockfile    # cached unless deps change
COPY . .                              # changes every commit
RUN pnpm build
```

Copy the lockfile and install *before* copying source, or every commit invalidates the dependency install.

🟢 **Multi-stage builds** are what keep your images small: build with the full toolchain, then copy only the artefact into a slim runtime stage. Next.js `output: "standalone"` (`apps/web/next.config.ts`) exists precisely for this — it emits a minimal server bundle with only the `node_modules` actually reachable.

---

## 2. Your pipeline

🟢 `.github/workflows/ci-cd.yml` — five jobs:

```
                      ┌──────────────┐
   any push / PR ────▶│     test     │  lint + tests, NODE_ENV=test
                      └───┬──────┬───┘
              develop ────┘      └──── main
                   │                     │
        ┌──────────▼────────┐  ┌─────────▼──────────┐
        │  build-and-push   │  │ build-and-push-prod│  Buildx → GHCR
        │  (env: dev)       │  │ (env: prod)        │  api · worker · web
        └──────────┬────────┘  └─────────┬──────────┘
                   │                     │
        ┌──────────▼────────┐  ┌─────────▼──────────┐
        │      deploy       │  │    deploy-prod     │  SSH → deploy script
        └───────────────────┘  └────────────────────┘
```

### The quality gate 🟢

```yaml
build-and-push:
  needs: test
```

**Nothing is built unless lint and tests pass.** That `needs:` is the entire quality gate — a deterministic barrier that doesn't care how clean the code looked.

🔵 This is the point the 2026 literature on AI-assisted development keeps making: agents are *heuristic* reviewers whose judgement varies run to run, so the thing that actually protects you is a gate that runs regardless. Yours is lint + 786 tests. See [`ai-agent-harness.md`](./ai-agent-harness.md).

### Concurrency control 🟢

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

A new push makes an in-flight PR run obsolete — cancel it. **Deploy runs are exempt** so a half-applied deploy is never interrupted. That asymmetry is a deliberate, well-reasoned detail.

### Least privilege 🟢

```yaml
permissions:
  contents: read     # workflow default
```

Then raised *locally* to `packages: write` only in build jobs. Deploy jobs get `packages: read`.

**Why it matters:** without an explicit block, every job inherits the repo's default `GITHUB_TOKEN` scope, which on older repos is read/write on everything — including deploy jobs that need no token access at all.

### Image tagging 🟢

```
ghcr.io/<owner>/a11studio-prod-api:main
ghcr.io/<owner>/a11studio-prod-api:sha-<commit>
```

🔵 **Two tags, two purposes.** The branch tag is the moving pointer for "latest deploy". The **immutable SHA tag** is what makes rollback possible: set `DOCKER_IMAGE_TAG=sha-abc123` and redeploy. Without immutable tags there's nothing to roll back *to* — `:main` has already moved.

---

## 3. Secret handling — the part most people get wrong

🟢 Your workflow separates two kinds of build-time value:

```yaml
build-args:                        # public config — inlined into the client bundle
  NEXT_PUBLIC_APP_URL: …
secrets:                           # real secrets — BuildKit secret mounts
  app_api_key=${{ secrets.APP_API_KEY }}
```

🟢 Your comment states the reason exactly:

> *"a build-arg becomes ENV in the builder stage and `cache-to: mode=max` exports that stage to the shared Actions cache."*

⚠️ **This is a genuinely subtle attack path.** `ARG` values are visible in image history; with `mode=max` the builder stage is exported to a *shared* cache. A secret passed as a build-arg leaks into an artefact other jobs can read.

**BuildKit secret mounts** expose the value only for the duration of one `RUN`, on a tmpfs, never in a layer.

🟢 **Supply-chain hardening:**

```yaml
uses: appleboy/ssh-action@029f5b4aee… # v1.0.3
```

**SHA-pinned, not tag-pinned** — with your reason in the comment: this action receives the droplet's root SSH key, so a retagged upstream release would hand over the host. Tags are mutable; commit SHAs are not.

🟢 **No long-lived PAT.** The deploy uses the run's own `GITHUB_TOKEN`, minted per run and expiring with it — replacing a PAT that was shared between dev and prod and due to expire.

🟢 **Secrets passed as `envs:`, not interpolated into the script**, because a secret containing a quote or newline would otherwise break out of the string and inject into a root shell.

⚠️ **And the anti-pattern you correctly avoided:** the SSH port is a *literal*, not a secret — because GitHub masks every occurrence of a secret value in logs (a secret of `"22"` redacts unrelated 22s), and a typo'd value surfaces only as `parse "***" as int`. That's a real incident you debugged.

**This whole section is unusually strong material.** Most candidates have never thought about build-arg cache leakage or action SHA-pinning.

---

## 4. The deploy script

🟢 `scripts/deploy-prod.sh`, six steps:

```
1. git pull origin main
2. docker compose pull                    ← prebuilt images from GHCR
3. ensure postgres + redis up, WAIT for postgres healthy
4. run migrations (via the api image's dbcli)
5. restart application services
6. flush cached user asset URLs (users/*)
```

🟢 **Design decisions worth naming:**

- **Images are pulled, not built on the droplet.** Building a Next.js app on 1 vCPU / 1 GB would be slow and could OOM. Build in CI where resources are cheap; the droplet only pulls.
- **Step 3 gates on health before step 4** — running migrations against a not-yet-ready Postgres fails in a much worse way than waiting.
- **Migrations run before services restart** (§ [`databases.md`](./databases.md#7-migrations-and-expandcontract)).
- **`set -euo pipefail`** and `script_stop: true` — fail fast rather than continuing past a broken step.
- **Step 6 exists because of a real bug**: cached CDN URLs outliving the assets they point at.
- **systemd units** (`a11studio-prod.service`) handle boot persistence.

---

## 5. Deploy strategies — what you have and don't 🔴

| Strategy | What it is | Yours? |
|---|---|---|
| **Recreate** | Stop old, start new. Brief downtime. | ✅ **This is what you have** |
| **Rolling** | Replace instances one at a time | ❌ Compose can't |
| **Blue-green** | Two full environments, flip traffic | ❌ |
| **Canary** | Route a small % to the new version | ❌ |
| **Feature flags** | Deploy dark, enable separately | ❌ |

⚠️ **You must not claim zero-downtime deploys.** `docker compose up -d` recreates containers together. Two replicas do *not* give you rolling updates — that's a Swarm/Kubernetes feature.

> **Say this:** "Deploys are recreate-with-a-brief-restart-window. I don't claim zero-downtime — Compose recreates containers together, and running two replicas doesn't change that because there's no staggered replacement. Rolling updates would need Swarm or Kubernetes. Rollback is redeploying a previous immutable SHA tag."

**Being precise here is worth more than the claim would be.** "Zero-downtime" is one of the most over-claimed phrases in the industry and one follow-up question exposes it.

---

## 6. Environment parity 🟢

Dev (`develop` branch → dev images → dev droplet) and prod (`main` → prod images → prod droplet) run **the same workflow file** with different environments, and nginx config for both is version-controlled (`dev.nginx/`, `pro.nginx/`).

🔵 This is **"dev/prod parity"** from the [Twelve-Factor App](https://12factor.net) — worth knowing by name. Other factors you satisfy: config in the environment, backing services as attached resources, stateless processes, logs as streams, disposability.

⚠️ Where you diverge from twelve-factor, and it's a fair divergence: `NEXT_PUBLIC_*` values are **baked at build time** rather than read at runtime, because they're inlined into the client bundle. That's a Next.js constraint, not a mistake — but it does mean the *same image* can't be promoted from dev to prod, which is why you build twice. Knowing that's the reason is the answer.

---

## 7. What's missing ⚠️

Ranked by cost-to-value:

1. **Resource limits.** No `mem_limit` or CPU reservation on *any* service, with 2× api + 2× web + postgres + redis + nginx + worker on **1 vCPU / 1 GB** (confirmed in `apps/web/next.config.ts`). One unbounded Node process can OOM the host and take Postgres down. **Cheapest, highest-value fix on the list.**
2. **No automated rollback.** Redeploying an old SHA is manual. No health check after deploy that reverts on failure.
3. **No smoke test post-deploy.** The pipeline's last word is "containers started", not "the site works."
4. **No dependency scanning.** No Dependabot, no `npm audit` gate, no SCA in CI.
5. **No image scanning.** Trivy or Grype on the built image would catch known base-image CVEs.
6. **No staging that mirrors prod data shape.** Dev is a real environment, which is better than most — but it isn't a rehearsal.

**Knowing this list in order is itself the good answer** to "what would you improve?"

---

## Interview drills

**"Walk me through what happens when you push to main."**
The five jobs in §2, then the six deploy steps in §4. Land on the gate — *nothing is built unless lint and tests pass* — and on immutable SHA tags making rollback possible.

**"How do you handle secrets in CI?"**
§3. Lead with the build-arg cache leak, because almost nobody knows it. Then SHA-pinned actions, per-run tokens, and env-passed rather than interpolated.

**"Do you have zero-downtime deploys?"**
No. §5. Say exactly what you have and exactly what it would take. This question is a trap for people who over-claim.

**"How do you roll back?"**
Redeploy a previous `sha-*` tag by setting `DOCKER_IMAGE_TAG`. Then volunteer the limits: it's manual, and a migration that already ran isn't reversed by it — which is *why* migrations are expand–contract.

**"Why build in CI instead of on the server?"**
1 vCPU / 1 GB. Building Next.js there would be slow and might OOM the running site. CI resources are cheap and disposable; the droplet just pulls.
