# Architecture

## Pipeline Overview

User Command → CLI Parser (`internal/cmd/`) → Component Manager → Beads/Git Operations → Agent Spawning/Communication

## Components

### CLI Commands (`internal/cmd/`)
**Purpose**: User-facing command interface using Cobra
**Entry**: `internal/cmd/root.go:rootCmd`
**Dependencies**: All other internal packages
**Key Pattern**: Commands delegate to managers in respective packages (e.g., `polecat.Manager`, `rig.Manager`)

### Rig Management (`internal/rig/`)
**Purpose**: Project container lifecycle and configuration
**Entry**: `internal/rig/manager.go:Manager`
**Dependencies**: Workspace detection, git operations
**Key Algorithm**: Discovers rigs from town root, manages rig configs, handles worktree operations

### Polecat Management (`internal/polecat/`)
**Purpose**: Ephemeral worker agent lifecycle
**Entry**: `internal/polecat/manager.go:Manager`
**Dependencies**: Rig, git worktrees, beads
**Key Algorithm**: Spawns worktrees from `mayor/rig`, assigns work via hooks, Witness monitors lifecycle

### Crew Management (`internal/crew/`)
**Purpose**: Persistent worker agent lifecycle
**Entry**: `internal/crew/manager.go:Manager`
**Dependencies**: Rig, git clones, beads
**Key Algorithm**: Manages full git clones for long-lived workers, maintains identity across sessions

### Witness (`internal/witness/`)
**Purpose**: Per-rig polecat lifecycle manager
**Entry**: `internal/witness/manager.go:Manager`
**Dependencies**: Polecat manager, beads
**Key Algorithm**: Patrol loop monitors polecat health, detects stuck agents, triggers recovery

### Refinery (`internal/refinery/`)
**Purpose**: Merge queue processor for rig
**Entry**: `internal/refinery/manager.go:Manager`
**Dependencies**: Git worktrees, beads
**Key Algorithm**: Processes merge queue, handles conflicts, verifies before merging to main

### Deacon (`internal/deacon/`)
**Purpose**: Background supervisor daemon (watchdog chain)
**Entry**: `internal/deacon/manager.go:Manager`
**Dependencies**: Town-level beads, dog manager
**Key Algorithm**: Patrol cycles monitor system health, dispatch plugins, manage dogs

### Beads Integration (`internal/beads/`)
**Purpose**: Git-backed ledger operations
**Entry**: Various functions in `internal/beads/`
**Dependencies**: Git, Dolt (for storage)
**Key Algorithm**: Two-level architecture (town `hq-*` vs rig-level), routing via `routes.jsonl`

### Mail System (`internal/mail/`)
**Purpose**: Agent communication via mailboxes
**Entry**: `internal/mail/router.go`, `internal/mail/mailbox.go`
**Dependencies**: Beads, identity system
**Key Algorithm**: Routes messages to agent mailboxes, resolves identities, injects mail into agent sessions

### Convoy/Swarm (`internal/convoy/`, `internal/swarm/`)
**Purpose**: Work batching and tracking
**Entry**: `internal/swarm/manager.go:Manager`
**Dependencies**: Beads, mail
**Key Algorithm**: Groups related beads into convoys, tracks progress, notifies on completion

### Templates (`internal/templates/`)
**Purpose**: Role definitions and message templates
**Entry**: `internal/templates/templates.go`
**Dependencies**: Text/template
**Key Algorithm**: Renders role context and messages from templates in `internal/templates/roles/` and `internal/templates/messages/`

## Data Flow Map

```
User Command (gt convoy create ...)
  ↓ internal/cmd/convoy.go
Convoy Manager (internal/swarm/)
  ↓ Creates beads via internal/beads/
Beads Stored (town-level hq-* or rig-level)
  ↓ Work assigned via gt sling
Hook Created (agent's pinned bead)
  ↓ Agent reads hook
Agent Executes Work
  ↓ Updates beads
Convoy Progress Tracked
  ↓ Completion notification
User Notified
```

## Agent Lifecycle

```
Polecat: Spawn → Worktree Created → Hook Assigned → Work Executed → MR Created → Witness Monitors → Cleanup
Crew: Persistent → Full Clone → Multiple Sessions → Work Continues
Witness: Persistent → Patrol Loop → Monitor Polecats → Trigger Recovery
Refinery: Persistent → Merge Queue → Process MRs → Merge to Main
Deacon: Persistent → Patrol Loop → System Health → Plugin Dispatch → Dog Management
```

## Two-Level Beads Architecture

**Town Level** (`~/gt/.beads/`):
- Prefix: `hq-*`
- Purpose: Cross-rig coordination, Mayor mail, agent identity beads
- Examples: `hq-mayor`, `hq-deacon`, `hq-cv-abc` (convoy)

**Rig Level** (`<rig>/mayor/rig/.beads/`):
- Prefix: Project-specific (e.g., `gt-*`, `bd-*`)
- Purpose: Implementation work, MRs, project issues
- Examples: `gt-abc12` (issue), `gt-mr-xyz` (merge request)

Routing via `routes.jsonl` maps prefixes to rig paths.
