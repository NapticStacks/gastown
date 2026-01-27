# Gas Town Glossary for AI Assistants

## Core Principles

**MEOW** (Molecular Expression of Work): Breaking large goals into detailed instructions for agents. Supported by Beads, Epics, Formulas, and Molecules.

**GUPP** (Gas Town Universal Propulsion Principle): "If there is work on your Hook, YOU MUST RUN IT." This ensures agents autonomously proceed with available work.

**NDI** (Nondeterministic Idempotence): Ensuring useful outcomes through orchestration of potentially unreliable processes. Persistent Beads and oversight agents guarantee eventual workflow completion.

## Environments

**Town**: The workspace root (e.g., `~/gt/`). Coordinates all workers across multiple Rigs and houses town-level agents (Mayor, Deacon).

**Rig**: A project-specific Git repository under Gas Town management. Each Rig has its own Polecats, Refinery, Witness, and Crew members.

## Agent Roles

**Mayor**: Town-level coordinator. Initiates Convoys, coordinates work distribution, notifies users. Persistent singleton.

**Deacon**: Background supervisor daemon. Runs continuous Patrol cycles, monitors system health, triggers recovery. Persistent singleton.

**Dogs**: Deacon's maintenance agents for infrastructure tasks. Cross-rig, reusable workers.

**Polecat**: Ephemeral worker agent. Spawned for specific tasks, works in isolated git worktrees, produces MRs. Witness-managed.

**Crew**: Persistent worker agent. Long-lived, maintains context across sessions. User-managed.

**Witness**: Per-rig polecat lifecycle manager. Monitors polecat health, detects stuck agents, triggers recovery. One per rig, persistent.

**Refinery**: Per-rig merge queue processor. Intelligently merges changes from Polecats, handles conflicts. One per rig, persistent.

## Work Units

**Bead**: Git-backed atomic work unit stored as JSONL. Fundamental unit of work tracking. Can represent issues, tasks, epics.

**Formula**: TOML-based workflow source template. Defines reusable patterns for common operations.

**Molecule**: Durable chained Bead workflows. Multi-step processes where each step is tracked as a Bead. Survives agent restarts.

**Wisp**: Ephemeral Beads destroyed after runs. Lightweight work items for transient operations.

**Hook**: Special pinned Bead for each agent. Agent's primary work queue - when work appears, GUPP dictates execution.

**Convoy**: Primary work-order wrapping related Beads. Groups related tasks together, can be assigned to multiple workers.

## Workflow Operations

**Slinging**: Assigning work to agents via `gt sling`. Puts work on agent's Hook for execution.

**Nudging**: Real-time messaging between agents via `gt nudge`. Immediate communication without mail system.

**Handoff**: Agent session refresh via `/handoff`. Transfers work state to new session when context is full.

**Seance**: Communicating with previous sessions via `gt seance`. Query predecessors for context and decisions.

**Patrol**: Ephemeral loop maintaining system heartbeat. Patrol agents (Deacon, Witness) continuously cycle through health checks.

## Beads Prefixes

- `hq-*`: Town-level beads (coordination, Mayor mail, agent identity)
- `<prefix>-*`: Rig-level beads (project-specific, e.g., `gt-*`, `bd-*`)
- Routing via `routes.jsonl` maps prefixes to rig paths
