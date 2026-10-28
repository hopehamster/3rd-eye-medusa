# Dev agent — short spec (issue #124, child of #121)

## Job

Long-horizon development investigation work that linear n8n workflows
handle poorly: understand a task, gather repo evidence, propose and test
a change, and defend it through criticism — with every step visible.

## Graph

plan → tools → reflect → verdict, with a critic loop.

- **plan**: explicit investigation plan before any tool call (files to
  read, tests to run, what "done" means).
- **tools**: repo read (files, search), test run (pytest/unittest),
  git (status, diff, log — read-only except on an explicit branch the
  human approved). No pushes, no merges, no deploys from this agent.
- **reflect**: re-read the plan against the evidence; did the change do
  what the plan required, or did it drift?
- **critic loop**: a critic pass challenges the proposal (edge cases,
  regressions, simpler alternative). Findings go back to tools for at
  most a bounded number of rounds, then a verdict is delivered with
  unresolved criticisms named, not hidden.
- **verdict**: what was investigated, what changed (if anything), test
  results, and what still needs a human.

## RAG assistant element

Repo knowledge is retrieved (indexed code/docs), not recalled from model
memory: every claim about the codebase cites a file and line the tools
actually read. Stale index = re-index, never guess.

## Rules

- TDD: a failing test before any behavior change, same as the human team.
- The agent never grades its own work as final: its verdict goes to a
  human reviewer (or the independent review agent path) before merge.
- Secrets: env vars only, never in code, prompts, or retrieved context.

## Framework — per-agent decision, SPEC ONLY (corrected
2026-10-27, Michael comment 6460788465)

Dev-trial judging is DROPPED: no trial process is imposed,
pursued, or left as an open item for this agent. #124 stays
spec-only. The per-agent framework line stands as spec'd — the
research agent (#122) stays on its small custom graph, and #123 /
#125 use `create_agent` + `interrupt_on` — and this spec records
the dev agent's graph shape (plan → tools → reflect → verdict,
with a critic loop) without attaching any trial, judging process,
owner, duration, candidate count, or evidence pack to it. The
gates in this spec are unchanged: the verdict still goes to a
human reviewer before merge, the agent still never pushes,
merges, or deploys, and secrets stay env vars only. The pins are
unchanged: langgraph stays at 0.2.45 through the #130/#131 merge
decision (see `core-discipline.md`); any upgrade need goes to the
separate upgrade-pins branch (full suite re-run), never to a
silent upgrade.

## Done when (from #124)

A dev investigation runs as a graph (plan → tools → reflect → verdict)
with its steps visible. (Live run is a later leg; this spec is this leg.)

## Wiring-leg requirement — approval-gate enforcement (B2-8)

The agent never grades its own work as final — but that rule, like the
research agent's approval gate, is only a spec sentence until wired
code enforces it. Enforcement is a wiring-leg (B1) requirement: the
verdict MUST route to a human reviewer (or the independent review agent
path) before any merge, and wired code MUST refuse merge/deploy actions
without that review. Do not close #124 on this spec alone.
