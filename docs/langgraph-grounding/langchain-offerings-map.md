# LangChain offerings map — what the team should actually use (B3, issue #129)

> CORRECTION (2026-10-27, Michael's pointer): the survey's "no catalog of
> ready-made skills" claim was WRONG. langchain-ai/langchain-skills
> (public, MIT, 1,316 stars, updated 2026-10-26) is the official catalog:
> 21 skills per README — ecosystem-primer, langchain-dependencies,
> langchain/langgraph/deepagents quickstarts, deep-agents-core,
> deep-agents-memory, deep-agents-orchestration, managed-deep-agents,
> langchain-fundamentals, langchain-middleware, langchain-rag,
> langgraph-fundamentals, langgraph-persistence, langgraph-cli,
> langgraph-human-in-the-loop, eval-engineering, swarm. Installed via
> `npx skills add langchain-ai/langchain-skills --skill '*' --yes` at
> ~/workspace/.agents/skills/. What STANDS: no ready-made DOMAIN skills —
> our domain knowledge (3-signal rule, CJ fulfilment rules, Oracle rules)
> must still be written as our own skills in LangChain's format.
>
> FREE-ONLY SCOPE (Michael, 2026-10-27, LangChain-wise): the team works
> ONLY with free offerings — skills repo, LangSmith Developer free
> tracing, LangSmith Studio, Academy, open-source frameworks. Paid
> offerings are OUT: LangSmith Deployment/Plus, Fleet, Engine, managed
> paths requiring Plus. This settles survey Decision 2: SKIP Deployment,
> B1 custom service stays. #128 (deepagents harness vs core-only) is
> still open — both options are free.

Surveyor note, 2026-10-27. 3rd Eye Supply ONLY. Nothing here is live,
deployed, or proven live — this is a survey + mapping, not a build.

## How this map was verified

Every claim below cites an official LangChain page **opened on 2026-10-27**
(docs.langchain.com, academy.langchain.com, langchain-ai.github.io
Academy lessons, langchain.com pricing). Third-party pages were used only
to *find* official pages, never as the citation. Where a price or feature
could not be confirmed on an opened official page, the map says so.

Opened official sources (all fetched 2026-10-27):

- Skills: https://docs.langchain.com/oss/python/deepagents/skills
- Deep Agents customization (create_deep_agent stack):
  https://docs.langchain.com/oss/python/deepagents/customization
- Deep Agents skills lesson (LangChain Academy lessons):
  https://langchain-ai.github.io/lca-lessons/deepagents/m3/m3.2-skills.html
- Academy, LangGraph Essentials (Python):
  https://academy.langchain.com/courses/langgraph-essentials-python
- LangSmith Deployment quickstart:
  https://docs.langchain.com/langsmith/deployment-quickstart
- LangSmith pricing (official): https://www.langchain.com/pricing
- Managed Deep Agents local development:
  https://docs.langchain.com/langsmith/python/managed-deep-agents-local-development

Prior team verification reused with attribution (not re-fetched here):
B3's library-grounding-note.md (2026-10-27) verified the official docs
for persistence (checkpointer vs. store), subgraphs, state reducers,
interrupts, and human-in-the-loop middleware. Those citations stand;
this map does not re-claim them as its own fetches.

## The headline finding (read this first)

LangChain does **not** publish a catalog/marketplace of ready-made
domain skills. The "skills" offering is a **format + middleware**:
a `SKILL.md` directory the agent discovers by frontmatter, reads on
demand, and follows — with optional `scripts/`, `references/`, and
`assets/` resources. Teams author their own skills (or copy the Deep
Agents example skills the docs link to). So "use LangChain's skills"
means: **adopt the skill system and write our skills in it** — the
3-signal rule, the CJ fulfilment rules, the Oracle catalog rules — not
"download LangChain's winning-product skill," because no such skill
exists. Anyone claiming otherwise is inventing a catalog.

The same shape holds for the rest: LangChain's offerings are a
**harness (deepagents), a runtime (LangGraph), a framework
(LangChain), and a platform (LangSmith)**. The team currently
hand-builds the harness layer. That is the gap this map closes.

## 1. Published agent skills — what they are, how to use them

From the official Skills docs page (opened 2026-10-27):

- A skill is a directory with a `SKILL.md`: YAML frontmatter (`name`,
  `description` required; `allowed-tools`, `compatibility`, `metadata`
  optional) + markdown instructions. It follows the open Agent Skills
  specification (agentskills.io), so skills are portable across agents.
- Three-level progressive disclosure: (1) **Metadata** — `name` +
  `description` in the system prompt at startup for every configured
  skill; (2) **Instructions** — full `SKILL.md` body, read via
  `read_file` only when the skill is invoked; (3) **Resources** —
  `scripts/`, `references/`, `assets/` files, read only when the
  instructions reference them.
- `SkillsMiddleware` (part of the Deep Agents stack when you pass
  `skills`) handles discovery + read; the agent handles execution.
- Skill tools: a skill can list tools under
  `metadata.include_tools`; the agent sees those tools only after it
  reads the skill (gated — calls before that fail as unknown tools).
  A skill can also be **pinned** (`pinned_skills`), forcing its full
  `SKILL.md` into the conversation before the next model call.
- Authoring rules from the same page: keep the `SKILL.md` body under
  5,000 tokens and under 500 lines; write descriptions that say **when**
  to use the skill (that is all the agent sees at discovery);
  consolidate overlapping skills (as similar descriptions multiply,
  selection degrades); keep file references one level deep.
- Backends for skill files: `StateBackend` (in LangGraph state, current
  thread), `StoreBackend` (durable, cross-thread), `FilesystemBackend`
  (disk under a `root_dir`). Skill paths can be selected per context
  (role/tenant/user/request) and isolated per identity via a backend
  that resolves paths against runtime context.
- The Academy skills lesson adds: skills can include executable
  `scripts/` the agent runs in a sandbox; skills can be refined by the
  agent itself over time; the Stripe case study (linked from the
  lesson) runs 1,000+ skills and adds a second gating pass via
  `allowedTools` once description-only discovery degrades at that
  scale — not our scale, noted for later only.
- Install/use shape (from the lesson + docs): no package to install
  for the skill system itself — it ships with `deepagents`. You pass
  skill directories to `create_deep_agent(skills=[...])` with a backend
  holding the files (e.g. `FilesystemBackend(root_dir=...)`,
  `skills=["/skills"]`).

Checked and EXCLUDED: a PyPI package named
`langchain-ai-skills-framework` appeared in web search. Its authorship
as an official LangChain product was **not** verified from any opened
official source, so it is NOT counted as a LangChain offering here and
must not be adopted on the strength of its name.

## 2. Framework pieces — what each actually provides

### LangChain (the framework)
The application framework: models, prompts, tools, memory, chains/RAG
components, and the `create_agent` minimal agent harness. (Framing per
the official docs structure: `create_agent` for a customizable harness;
see the Deep Agents customization page, which contrasts composing a
fully custom harness "from scratch" with using `create_deep_agent`.)
Our team currently imports only `langchain-core` (B1 requirements) —
not the full `langchain` package. Nothing in B1/B2 needs full
`langchain` today; do not add it without a named need.

### LangGraph (the runtime)
The stateful graph runtime underneath every agent: `StateGraph`,
explicit state schemas, nodes/edges, conditional edges, reducers,
checkpointers, `interrupt()`, streaming, subgraphs. B2's adapter
already builds a real graph on it (langgraph 0.2.45 in B1's venv).
This layer is NOT in question — the team keeps it either way.

### deepagents (the harness) — the piece the team is missing
`create_deep_agent(...)` returns a production-ready agent (a LangGraph
graph) with, from the official customization page (opened 2026-10-27):

- Parameters: `model=` (string `provider:model` or model instance),
  `system_prompt=`, `tools=` (domain tools; MCP tools supported via
  the `mcp` extra), `memory=` (AGENTS.md files loaded at startup),
  `skills=` (skills directory), `backend=` (filesystem backend,
  `StateBackend` by default), `permissions=` (path-level filesystem
  access control), `subagents=` (declarative custom subagents),
  `middleware=` (merged into the stack by matching `.name` — a match
  replaces the built-in entry in place, anything else lands after the
  core entries), `interrupt_on=` (pause before tool calls for human
  approval → `HumanInTheLoopMiddleware`), `response_format=`
  (structured output schema), `state_schema=`, `context_schema=`
  (per-run runtime context: user IDs, keys, flags), `profiles`
  (per-model default bundles).
- Bare stack (model only): `FilesystemMiddleware`,
  `SubAgentMiddleware` (general-purpose subagent auto-added),
  `SummarizationMiddleware`, `PatchToolCallsMiddleware`, prompt
  caching. Full stack adds: `AsyncSubAgentMiddleware` (async
  subagents), your `middleware`, `SkillsMiddleware` (only when you
  pass `skills`), `MemoryMiddleware` (only when you pass `memory`),
  `HumanInTheLoopMiddleware` (only when you pass `interrupt_on`).
  Prebuilt middleware also exists for retries, fallbacks, PII
  detection, and more.
- Backends: `StateBackend` (thread-scoped, in state), `StoreBackend`
  (durable cross-thread), `FilesystemBackend` (disk),
  `LocalShellBackend` (disk + `execute` shell tool), `ContextHubBackend`
  (durable storage in a LangSmith Hub repo), `CompositeBackend`
  (routes per path). Sandbox backends: LangSmith, Daytona, E2B, Modal,
  Runloop, Vercel (isolated env + filesystem + shell).
- Subagents: declarative dicts (`name`, `description`,
  `system_prompt`, `tools`, optional model override) passed to
  `subagents=`; a built-in `general-purpose` subagent (same system
  prompt/tools/model as the parent, for context isolation) is
  auto-added; subagents run in parallel and return only summaries to
  the parent. Subagent graphs have no `SubAgentMiddleware` inside
  them (only the parent exposes the `task` tool).
- Planning: the built-in planning/todo tool (per the Academy lesson
  and the harness docs: a `write_todos`-style tool that keeps an
  explicit plan in context) plus `create_summarization_tool_middleware`
  for on-demand summarization between tasks.
- Interpreters: an `eval` tool running JavaScript in a scoped QuickJS
  runtime, for composing tool calls / transforms in code without a
  full shell.
- Version note (sourced, not guessed): the Academy skills lesson
  references deepagents 0.7.22 (skill tools) and 0.7.23 (pinned
  skills). The team's B1 venv pins langgraph 0.2.45, which predates
  that deepagents era. **No current deepagents version number is
  asserted here** (the PyPI pages found in search were stale crawls
  and one failed to load) — version alignment is a decision item
  below, to be settled by installing in a branch and running the
  test suites, not by quoting a number from a search snippet.

### The reinvention verdict (B2 vs. deepagents)
B2's research agent hand-builds: a plan written into state before
tools run; a scout node that fans out internally
(ThreadPoolExecutor) and returns one signal list; a 3-signal rule;
bounded reflection/retry with a best-effort verdict; a
langgraph_adapter seam. deepagents provides the plan tool, the `task`
sub-agent tool + `SubAgentMiddleware`, filesystem/context handling
with summarization, and the same bounded-run shape — as tested
middleware, not as B2's one-off code. **Yes: B2 substantially
reinvents deepagents.** The custom parts worth keeping are the
domain logic (the 3-signal rule, the escalation-only router, the
verdict schema, the n8n-tool wiring) — not the harness mechanics
around them.

## 3. Platform / ops offerings

### LangSmith Deployment (formerly LangGraph Platform)
From the official deployment quickstart (opened 2026-10-27):

- Deploys any app that exports a graph from a `langgraph.json`
  config, via `langgraph deploy` (CLI) or the LangSmith UI (import
  from GitHub; the `hosted-langserve` GitHub app must be authorized
  once by an org owner/admin). Serverless (scales to zero, for
  testing/background/internal agents) or Dedicated (always-on,
  autoscaling, backups, HA — recommended by LangChain for
  customer-facing agents). `langgraph deploy list | logs | delete`
  manage deployments. Deployed agents expose an API (Python/JS SDK
  or REST) and 30+ API endpoints including state and memory, plus
  cron scheduling and auth for LangGraph APIs (per the pricing page).
- Requirement (official, on the quickstart): a LangSmith account on
  the **Plus plan or above** + API key. Self-hosted/hybrid control
  planes exist (Deployment control plane inside your cluster; data
  plane in your VPC) — Enterprise territory.
- What it does NOT replace for us: B1's n8n-trigger auth
  (`X-Agent-Shared-Secret`, UUIDv4 run_id idempotency, allowlist +
  DNS validation on tool calls). Deployment hosts the *graph*; the
  n8n trigger shape, the secret boundary, and the tool-call guard
  rails are still our design, wherever the graph runs.

### LangSmith Studio (free, local + deployed)
From the deployment quickstart §4 and the Managed Deep Agents local
development page (both opened 2026-10-27):

- Studio is an interactive agent IDE: send messages, inspect
  intermediate state at each node, edit state mid-run, replay from
  any prior checkpoint without writing code. For deployed graphs it
  opens from the deployment in the LangSmith UI; for local graphs it
  connects to the local Agent Server (`langgraph dev`).
- For Managed Deep Agents projects, `mda dev` compiles the project,
  runs it on a local Agent Server, and opens Studio; it creates a
  local Context Hub mock for instructions, skills, and memory.
  Schedules do NOT run locally under `mda dev` (listed at startup,
  never provisioned) — test identity/sandbox behavior in a
  development deployment before production.
- Cost: Studio itself is free to use; it needs a LangSmith account +
  API key to connect, and tracing can be disabled locally
  (`LANGSMITH_TRACING=false` keeps data local — stated on the Studio
  docs; the team should confirm the exact variable name on the
  tracing setup page before writing it into any runbook).

### LangSmith observability + evaluation (the observability gap)
From the official pricing page (opened 2026-10-27) — the platform
offers, by plan: tracing, monitoring, insights; online and offline
evals; dataset collection; annotation queue (human feedback); Prompt
Hub and Playground; bulk data export; LangSmith Engine (monitor
traces autonomously, cluster behavior into issues, diagnose code
failures, recommend prompt/code fixes, create datasets and evals);
LangSmith Fleet (no-code agents from prebuilt templates, MCP tools,
API trigger); LangSmith Sandboxes (ephemeral isolated sandboxes for
agent-generated code, auth proxy, BYO image, TTLs, snapshot/fork,
port tunneling, CLI); LLM Gateway (cost controls, rate limits,
model fallbacks, PII/secrets redaction, BYO model key, Gateway
Credits). A trace = one execution of the application, however many
steps inside it. Base traces: 14-day retention. Extended traces:
180-day retention. LangSmith states it does not train models on
customer data.

Official pricing (opened 2026-10-27, https://www.langchain.com/pricing):

- **Developer: $0 / seat / month**, 1 seat, up to 5k base traces/mo
  included, then pay-as-you-go. No deployment.
- **Plus: $39 / seat / month**, unlimited seats, up to 10k base
  traces/mo included, then pay-as-you-go; **1 free Serverless
  (Small) deployment included**; additional Serverless/Dedicated
  deployments by size (Small/Medium/Large), charged on resources
  consumed. Access to Deployment, Engine, and more.
- **Enterprise: custom pricing** — self-hosted and hybrid deployment,
  custom SSO, ABAC, RBAC, support SLA, custom seats/workspaces.
- Usage unit: **1 LSU (LangChain Standard Unit) = $1.00**.
  Deployment metering on the page: Runtime Compute 0.0675 LSU /
  vCPU-hr; Runtime Memory 0.0090 LSU / GiB-hr; Database Compute
  0.177 LSU / vCPU-hr; Database Memory 0.025 LSU / GiB-hr. Fleet
  metered in LSUs (includes 7 LSU on one tier, 37 on another);
  Sandboxes include 8 LSU/mo free. Seats billed monthly; traces
  billed monthly in arrears. Startup plan: discounted rates + up to
  $10,000 in credits (application required).
- Model tokens are NEVER included — the LLM vendor bills separately
  (Gateway Credits excepted for Gateway-routed calls). Do not quote
  $39/seat as the cost of running agents.

### Managed Deep Agents (mda) — newest scaffold, watch only
`mda dev` / Managed Deep Agents projects (docs page opened
2026-10-27, updated 2026-10-08) add: project scaffolding, Context
Hub (instructions/skills/memory as a service), schedules, sandboxes,
and a local mock for all of it. This is the direction LangChain is
pushing new agent projects. It is NOT adopted here: it would move
scheduling and memory off n8n/VPS into LangChain's managed path,
which conflicts with the standing rule (n8n stays the action layer)
and is a bigger migration than the v1 agent needs. Revisit only on
Michael's explicit call.

## 4. Learning — Academy + docs (accessible to the builders now)

The builders cannot access Michael's Mac library, so the Mac courses
cannot ground their work directly. These official, free, accessible
sources can — and they are the ones B3's note should cite next:

- **LangChain Academy, LangGraph Essentials (Python)** — free,
  13 lessons, ~1 hour video: Lesson 1 Nodes, 2 Edges, 3 Conditional
  Edges, 4 Memory, 5 Interrupt / Human-in-the-Loop, 6 Application
  (email workflow). Directly covers B2's graph, B1's checkpointing,
  and the HITL gate. URL:
  https://academy.langchain.com/courses/langgraph-essentials-python
- **LangChain Academy lessons (Deep Agents track)** — free lesson
  pages including the skills lesson verified above
  (https://langchain-ai.github.io/lca-lessons/deepagents/m3/m3.2-skills.html)
  plus the wider Deep Agents track (planning, backends, subagents,
  middleware). This is the closest official teaching to the research
  deep agent's actual shape.
- **Official docs used by B3** (already verified 2026-10-27, see
  library-grounding-note.md): persistence (checkpointer vs. store),
  subgraphs, state reducers, interrupts, HITL middleware, memory
  concepts. Keep citing these; they are the mechanism references.
- **Mac library courses** (Pluralsight Memory/State/Conversational
  Applications in LangChain; Packt Building AI Agents with Python
  and LangChain; Packt Agentic AI Systems): all ties remain
  **INFERRED from module titles only** (B3's note is explicit and
  correct about this). Upgrade path, unchanged: someone with Mac
  access checks transcripts/subtitles and confirms or deletes each
  tie. Until then, no builder doc may quote a Mac course as teaching
  a pattern.

## 5. Templates / starters

- **LangGraph template path**: the deployment quickstart names
  "LangGraph template" as one of the two starting paths (the other
  is bring-your-own-framework). No template names are given on that
  page, so none are asserted here — the team should list them from
  the LangGraph CLI (`langgraph new`) at scaffold time, not from
  memory.
- **Deep Agents example skills**: the customization page links
  "Deep Agents example skills" on GitHub — the right starting
  copies for our first skills (structure + frontmatter conventions),
  to be adapted, not pasted blindly.
- **LangSmith Fleet prebuilt templates**: no-code agent templates
  on the pricing page (Plus+). Not our path (we build in code), noted
  only so nobody re-buys what Fleet sells.
- **Academy lesson repos**: the Academy lessons themselves
  (langchain-ai.github.io/lca-lessons) are runnable teaching code —
  the cheapest starter corpus for the builders.

## 6. Mapping to our tree — ADOPT / ADAPT / SKIP

Standing rules applied throughout: n8n stays the ACTION layer;
LangChain/LangGraph is the BRAIN layer; money actions are
human-approved or rule-gated, never autonomous; secrets are env vars
only, never in code.

| # | Offering → our piece | Verdict | Reason (one line) |
|---|---|---|---|
| 1 | Skill system (`SKILL.md` + `SkillsMiddleware`) → B2 agent knowledge (3-signal rule, CJ rules, Oracle rules) | **ADOPT** | It is the official mechanism for exactly this: codified multi-step workflows + domain knowledge with progressive disclosure, visible in traces. |
| 2 | deepagents harness (`create_deep_agent`) → B2 research deep agent (#122) | **ADOPT — DECISION NEEDED** | B2 substantially reinvents it (plan tool, sub-agent fan-out, file/context handling); adopting it retires custom harness code but contradicts #128's "avoid prebuilt frameworks by default" — Michael must amend #128 or rule otherwise. |
| 3 | deepagents middleware à la carte (planning, summarization, HITL via `interrupt_on`, SkillsMiddleware) → B2 core graph | **ADAPT** | If #128 stands, adopt the tested middleware pieces inside the core graph (docs support `.name`-matched replacement) instead of the whole harness. |
| 4 | deepagents for Oracle (#123), Dev (#124), fulfilment-exception (#125) specs | **ADOPT** (as harness or `create_agent` minimal) | Short agents do not need B2's custom graph at all; fulfilment-exception MUST use `interrupt_on` for money actions — the harness provides it natively. |
| 5 | LangSmith tracing (Developer, free) → observability gap (B1/B2 have none) | **ADOPT** | Zero-to-small integration cost, 5k traces/mo free, and it is how skill activation + agent decisions become debuggable instead of log-guessed. |
| 6 | LangSmith evals/datasets/Prompt Hub → agent quality loop | **ADAPT** (later) | Adopt after the first agent runs: turn real traces into datasets, score verdicts, version prompts — not before there is anything to evaluate. |
| 7 | LangSmith Studio (free) → local dev/debug of graphs | **ADOPT** | Free visual debugger: inspect state per node, edit mid-run, replay from checkpoint — replaces printf-debugging the graph. |
| 8 | LangSmith Deployment (Plus $39/seat + usage) → REPLACE B1 custom FastAPI service (#126/#127) | **SKIP for v1 — DECISION NEEDED** | The custom service + n8n trigger shape is built, reviewed, and owns auth/idempotency/allowlist that Deployment does not replace; revisit after the first agent works, not mid-build. |
| 9 | B1 checkpointer: custom pooled PostgresSaver → official checkpointer | **ADAPT (correction)** | B1 ALREADY uses the official `langgraph-checkpoint-postgres` PostgresSaver; only the pool wiring + run store are custom. Do not reframe this as custom-vs-official checkpointer — the remaining custom work is the Postgres-backed run store (a wiring item) + pool lifecycle. |
| 10 | Academy Essentials + Deep Agents lessons → B3 grounding (#129) | **ADOPT** | Free, accessible to builders now, and directly on-point (Memory, Interrupt/HITL, skills) — unlike the Mac courses, which builders cannot open. |
| 11 | Mac library courses → B3 grounding | **ADAPT** | Keep as INFERRED title ties only; upgrade only via transcript checks by someone with Mac access. Never quote as "the course teaches X" until then. |
| 12 | Managed Deep Agents (`mda`) + Context Hub + schedules | **SKIP for v1** | Would move scheduling/memory off n8n/VPS into LangChain's managed path — conflicts with the action-layer rule; revisit only on Michael's explicit call. |
| 13 | LangSmith Fleet / Engine / Sandboxes / LLM Gateway | **SKIP for v1** | No-code templates, autonomous failure-diagnosis, agent sandboxes, and gateway routing solve problems we do not have yet; Engine in particular must not auto-diagnose production money-path agents unsupervised. |
| 14 | `langchain-ai-skills-framework` (PyPI) | **SKIP (unverified)** | Authorship as an official LangChain product not verified from an opened official source — do not adopt on the strength of its name. |
| 15 | Version alignment (B1 pins langgraph 0.2.45; Academy lesson references deepagents 0.7.22+ features) | **ADAPT — DECISION NEEDED** | Adopting deepagents requires a version-alignment branch (upgrade pins, rerun all suites) — never a silent upgrade, and never a version number quoted from a search snippet. |

## 7. Decisions needed from Michael (proposals, NOT silent substitutions)

1. **Amend #128 or keep core-only?** Adopting the deepagents harness
   (mapping #2) contradicts core-discipline.md §2 ("avoid by
   default: prebuilt agent frameworks, middleware stacks"). Either
   amend §2 to bless deepagents as the approved harness, or rule
   ADAPT (#3: middleware à la carte inside the core graph). The
   team must not pick this itself.
2. **LangSmith Deployment vs. B1 custom service?** Mapping #8 says
   SKIP for v1, but the call is Michael's: Plus ($39/seat/mo +
   usage) buys hosted serving + 1 free small serverless deployment
   and retires VPS service operation — at the cost of moving the
   agent runtime to LangChain's cloud and re-doing the n8n trigger
   shape against Deployment's API. No move without his go.
3. **Version-alignment branch?** Mapping #15: approve a branch that
   upgrades langgraph/deepagents pins and re-runs every suite, or
   hold pins and accept that deepagents features newer than the pins
   are unavailable. Either is defensible; drifting is not.
4. **First skills to write?** Proposed first three (as SKILL.md
   directories under the agent backend): `winning-product-3-signal`
   (the 3-signal rule + escalation triggers), `cj-fulfilment-rules`
   (stock/backorder/idempotency/dead-letter rules from the #111
   tree), `oracle-catalog-answers` (catalog/order/tracking tool
   use). Content comes from our specs, not from LangChain — the
   format is LangChain's, the knowledge is ours.

## 8. What this map deliberately does NOT claim

- No deepagents version number is asserted (see §2 version note).
- No LangSmith per-trace overage rate is asserted (the pricing page
  says pay-as-you-go beyond included traces and gives LSU metering
  for deployment resources; third-party overage figures conflicted
  and were not confirmed on the official page — use the official
  usage calculator before modeling a bill).
- No `langgraph new` template names are asserted (the quickstart
  names the path, not the templates).
- No Mac course content is asserted (INFERRED titles only).
- Nothing here is live, deployed, or proven live. Adoption items
  above are recommendations + decisions, not shipped changes.
