# Gas Town Overview for AI Assistants

## Purpose

Gas Town is a multi-agent orchestration system for coordinating multiple AI coding agents (like Claude Code) working on software projects. It solves the problem of context loss when agents restart by persisting work state in git-backed hooks, enabling reliable multi-agent workflows that can scale to 20-30 agents across multiple projects.

## Core Abstractions

- **Town**: The workspace root (`~/gt/`) that coordinates all workers across multiple rigs
- **Rig**: A project container wrapping a git repository, managing its own agents (Polecats, Refinery, Witness, Crew)
- **Beads**: Git-backed atomic work units stored as JSONL, representing issues, tasks, or any trackable work item
- **Convoy**: A work-order wrapping related beads for batch tracking across rigs
- **Hook**: A special pinned bead for each agent - when work appears on your hook, you must run it (GUPP principle)
- **Identity**: All work is attributed to specific agents (e.g., `gastown/crew/joe`, `gastown/polecats/toast`)

## Execution Model

Gas Town is a Go CLI tool (`gt`) that orchestrates agent workflows. Agents are spawned as separate processes (Claude Code, Codex, etc.) that read work from hooks and execute it. Work state persists in git worktrees and beads databases. The system uses a two-level beads architecture: town-level (`hq-*` prefix) for coordination and rig-level (project prefix) for implementation work.

## Key Files

- Entry point: `internal/cmd/root.go` - Cobra CLI root command
- Agent management: `internal/polecat/`, `internal/crew/`, `internal/witness/`, `internal/refinery/`
- Beads integration: `internal/beads/` - Beads ledger operations
- Mail system: `internal/mail/` - Agent communication via mailboxes
- Convoy tracking: `internal/convoy/`, `internal/swarm/` - Work batching and tracking
- Rig management: `internal/rig/` - Project container lifecycle
- Templates: `internal/templates/` - Role definitions and message templates

## Quick Start for AI

To understand a feature: Start at command definition in `internal/cmd/` → component manager → underlying implementation
To add a feature: See `.ai/guides/adding-features.md`
To debug: Check `.ai/maps/error-catalog.json` (if created) or component-specific error handling
To understand agent roles: Read `docs/overview.md` and `internal/templates/roles/`
