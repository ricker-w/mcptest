# TeamUp — AI-Driven New Business Ideation Template

A Claude Teams template that launches specialized AI agents to conduct end-to-end business ideation — from market research and competitive analysis to MVP specification and technical architecture — all with automatically generated discussion logs reviewable as meeting minutes.

---

## Overview

When you have a new business idea, clone this repository, fill in the product concept, and launch the orchestrator. A team of AI specialists (CEO, Market Researcher, Tech Lead, Marketer, and more) will debate, analyze, and produce a complete set of deliverables ready to hand off to a development team.

```
New Business Idea
       │
       ▼
TeamUp (this repo) — cloned as a new project repo
       │
       ▼
Claude Teams launched
  ├── Phase 1: Research       (Market, Trends, UX Pain Points)
  ├── Phase 2: Tech Design    (Architecture, UI/UX, Marketing Strategy)
  ├── Phase 3: Product Def.   (Personas, Requirements, Business Model)
  └── Phase 4: Spec Writing   (Tech Stack Rules, UX Spec, Impl. Spec)
       │
       ▼
docs/        ← Reports and analysis
logs/        ← Discussion logs (meeting minutes)
.claude/rules/ ← Finalized specs for the next dev repo
```

---

## How to Use

### 1. Clone and create your project repository

```bash
gh repo create my-new-product --template <this-repo>
cd my-new-product
```

### 2. Customize the orchestrator

Edit `.claude/orchestrators/product-ideation-template.md` and fill in the `{...}` placeholders:

- Product name and concept
- Core philosophy
- Constraints (team size, tech preferences, distribution model)
- Initial feature list

### 3. Launch the Team Leader

Open Claude Code and instruct the Team Leader (CEO agent) to read the orchestrator and start execution:

```
Read .claude/orchestrators/product-ideation-template.md and begin Phase 1.
```

The leader will spin up Teammates, delegate tasks in parallel waves, and collect results automatically.

### 4. Review the output

Once all phases complete, review the deliverables:

| Location | Contents |
|----------|----------|
| `docs/` | Phase reports (competitor analysis, architecture, personas, etc.) |
| `logs/` | Discussion logs per phase — readable as meeting minutes |
| `.claude/rules/` | Finalized tech stack and branching rules for the dev repo |

---

## Directory Structure

```
.
├── .claude/
│   ├── agents/          # Specialist agent prompts (injected into Teammates)
│   ├── contexts/        # Execution mode overlays (planning, research, dev, review)
│   ├── hooks/           # Automation hooks (cost tracking, safety guards)
│   ├── orchestrators/   # Execution blueprints read by the Team Leader
│   ├── rules/           # Shared rules enforced across all agents
│   └── skills/          # Reusable sub-skills invoked in fork context
├── docs/                # Generated reports and specifications (created at runtime)
└── logs/                # Agent discussion logs / meeting minutes (created at runtime)
```

### `.claude/agents/`

Specialist Agent (SA) prompts that define each agent's persona, capabilities, output format, and success criteria. Written in CRISP format (Context / Role / Intent / Steps / Proof).

| Agent | Role |
|-------|------|
| `ceo.md` | Final decision-maker; evaluates all analyses and sets direction |
| `market-researcher.md` | TAM/SAM/SOM, competitive benchmarking, quantitative data |
| `trend-analyst.md` | Industry trends, "Why Now?" timing analysis |
| `ux-researcher.md` | User pain points via JTBD framework |
| `tech-lead.md` | Tech stack selection, architecture design |
| `developer.md` | Implementation estimation, dev workflow definition |
| `product-manager.md` | Personas, functional requirements, MVP scope |
| `product-designer.md` | UI/UX component design, screen flows |
| `marketer.md` | Positioning, launch strategy, community building |
| `business-analyst.md` | Business model, monetization, revenue projections |
| `devops-engineer.md` | CI/CD, infrastructure, deployment strategy |
| `qa-engineer.md` | Test strategy, quality gates |
| `technical-writer.md` | Documentation standards and output |

### `.claude/orchestrators/`

Execution blueprints for the Team Leader. Each file defines the full DAG of tasks, wave execution plan, agent assignments, and expected deliverables.

- `product-ideation-template.md` — Template for new product ideation (Phases 1–4)

Copy and customize this file for each new project.

### `.claude/rules/`

Shared rules loaded by all agents. These enforce consistent behavior across the entire team.

| File | Purpose |
|------|---------|
| `orchestration.md` | 3-tier architecture (Leader / Advisor / Teammate), communication protocols |
| `tdd-practices.md` | TDD cycle, test pyramid, coverage targets |
| `branching-strategy.md` | Git branching, PR flow, quality gates |
| `coding-style.md` | Language-agnostic code quality standards |
| `security.md` | Input validation, injection prevention, secret management |

> **Note**: A `tech-stack.md` file is generated by the Tech Lead agent during Phase 4 and placed here.

### `.claude/contexts/`

Mode overlays that modify agent behavior for specific execution contexts.

| File | When to Use |
|------|-------------|
| `planning.md` | Architecture and task decomposition sessions |
| `research.md` | Competitive and market research sessions |
| `dev.md` | Implementation sessions |
| `review.md` | Code and spec review sessions |

### `.claude/skills/`

Reusable micro-skills executed in fork context. Each skill has its own `SKILL.md` defining inputs, steps, and success criteria.

| Skill | Purpose |
|-------|---------|
| `spec-creator` | Generate CRISP-format agent/skill/rule/orchestrator specs |
| `common-doc-writer` | Safely write documents and code files |
| `common-doc-reader` | Efficiently read and summarize documents |

### `.claude/hooks/`

Hook scripts that run automatically on tool events.

| Hook | Trigger | Purpose |
|------|---------|---------|
| `block-no-verify.js` | `PreToolUse(Bash)` | Prevents `git --no-verify` to enforce pre-commit hooks |
| `cost-tracker.js` | `Stop` | Tracks token usage and cost per session |

### `docs/`

Created at runtime. Stores all phase deliverables:

```
docs/
├── phase1-competitor-analysis.md
├── phase1-trend-analysis.md
├── phase1-pain-points.md
├── phase1-synthesis.md
├── phase2-architecture.md
├── phase2-ui-design.md
├── phase2-marketing-strategy.md
├── phase2-decision.md
├── phase3-personas.md
├── phase3-functional-requirements.md
├── phase3-business-model.md
├── phase3-mvp-scope.md
├── phase4-ux-spec.md
└── phase4-impl-spec.md
```

### `logs/`

Created at runtime. Stores discussion logs per phase, readable as meeting minutes.

```
logs/
├── phase1/
│   ├── t01-competitor-analysis-log.md
│   ├── t02-trend-analysis-log.md
│   └── ...
├── phase2/
├── phase3/
├── phase4/
└── decision-timeline.md    ← Key decisions across all phases
```

---

## Execution Flow

The orchestrator runs in 4 phases, each composed of parallel waves:

```
Phase 1 — Research
  Wave 1-A (parallel):  T01 Competitor Analysis
                        T02 Trend Analysis
                        T03 UX Pain Points
  Wave 1-B (sequential): T04 Research Synthesis

Phase 2 — Technical Design
  Wave 2-A (parallel):  T05 Architecture Design
                        T06 UI/UX Design
                        T07 Marketing Strategy
  Wave 2-B (sequential): T08 CEO Decision — Architecture

Phase 3 — Product Definition
  Wave 3-A (parallel):  T09 Persona Definition
                        T10 Functional Requirements
                        T11 Business Model
  Wave 3-B (sequential): T12 CEO Decision — MVP Scope

Phase 4 — Spec Concretization
  Wave 4 (parallel):    T13 Tech Stack Rules
                        T14 Branching Strategy
                        T15 UX/UI Spec
                        T16 Implementation Spec
```

When Phase 4 completes, all specifications are ready to initialize a new development repository.

---

## Agent Communication Architecture

All agents communicate through the Team Leader (CEO) in a star topology. Direct agent-to-agent communication is prohibited.

```
                    Team Leader (CEO / Opus)
                           │
            ┌──────────────┼──────────────┐
            │              │              │
         Advisor       Teammate A     Teammate B
       (read-only)    (Sonnet)       (Sonnet)
```

- **Team Leader**: Delegates, reviews quality gates, makes decisions
- **Advisor**: Reads specs/codebase and distills information for the Leader
- **Teammates**: Implement tasks based solely on Leader instructions

---

## Customization Guide

### Adding a new agent

```bash
cp .claude/agents/market-researcher.md .claude/agents/my-new-agent.md
# Edit the CRISP sections to define the new specialist
```

### Creating a new orchestrator

Use the spec-creator skill or copy the template:

```bash
cp .claude/orchestrators/product-ideation-template.md \
   .claude/orchestrators/my-product.md
# Fill in all {placeholder} fields
```

### Extending the rules

Add a new `.md` file to `.claude/rules/`. All agents can reference it.

---

## Requirements

- [Claude Code](https://claude.ai/code) with Claude Teams enabled
- Claude Opus 4.x (Team Leader) + Claude Sonnet 4.x (Teammates)
- MCP servers configured in `.claude/settings.json`: `context7`, `serena`, `github`

---

## Related

- [README_JA.md](./README_JA.md) — Japanese version of this document
- `.claude/rules/orchestration.md` — Full orchestration protocol
- `.claude/orchestrators/product-ideation-template.md` — Orchestrator template
