# Gastown Integration with Unified Naptic Framework (UNF)

**Last Updated**: 2026-02-01
**Status**: Phase 0 Complete - Ready for Phase 1
**Integration Focus**: Multi-agent orchestration bridge between local development and AWS production

---

## Overview

Gastown (this repository) serves as the **local development orchestration layer** for the Unified Naptic Framework (UNF). It provides:

1. **Multi-agent coordination** in local environment
2. **Persistent work tracking** via git-backed hooks and Beads ledger
3. **Bridge to production** through A2A protocol and AWS Lambda integration
4. **Development foundation** for agent testing and iteration

### UNF Context

The broader UNF system consists of:

- **Agents-prod** (`/Users/jordanm/Github/agents-prod/`)
  - 20+ specialized Lambda agents
  - A2A protocol implementation
  - Cost tracking and token management
  - Production deployment infrastructure

- **Local-infra** (`/Users/jordanm/Github/local-infra/`)
  - Celery task queue (Redis backend)
  - Local execution environment
  - Integration bridge between Gastown and agents-prod

- **Gastown** (this repo)
  - Local work orchestration
  - Development coordination hub
  - Git-backed work persistence

---

## Phase 0: Installation & Setup (COMPLETE)

**Status**: ✅ All tasks completed 2026-02-01

### Completed Infrastructure

**Town Workspace** (~/.naptic/):
- Central coordination hub for all local agents
- Git-backed work tracking
- Beads ledger with hq- prefix
- Mayor agent (Chief of Staff) for work coordination
- Deacon watchdog for health monitoring
- 32 built-in workflow formulas

**Local-infra Rig Integration**:
- Beads ledger with li- prefix
- External project routing configured
- Celery task queue ready for integration
- SQLite backend for work items

**CLI Tools**:
- `gt` (v0.5.0+) - Gastown orchestration
- `bd` (v0.49.3) - Beads ledger management

### Key Files Created

During Phase 0, the following UNF integration documentation was created in `/Users/jordanm/Github/.ai/context/`:

1. `gastown-unf-integration-sop.md` - Complete SOP with all Phase 0 tasks
2. `phase-0-completion-summary.md` - Results and verification
3. `phase-1-planning-guide.md` - Next phase architecture
4. `README-GASTOWN-INTEGRATION.md` - Navigation index
5. `current-state.md` - Living project status

---

## Phase 1: UNF A2A Integration (PLANNED)

**Duration**: 2-3 days
**Start**: Ready when resources available (2026-02-02+)
**Goal**: Connect Gastown to UNF A2A protocol and AWS Lambda agents

### Architecture Integration

```
Gastown Town (Local)               UNF Production (AWS)
├── Mayor (Coordinator)       ←→   ├── Lambda Mayor
├── Polecats (Workers)        ←→   ├── 20+ Lambda Agents
├── Hooks (Git Worktrees)     ←→   ├── S3 + EventBridge
├── Beads (hq-prefix)         ←→   ├── DynamoDB
└── local-infra Rig (li-)     ←→   └── Pinecone Vector DB
```

### Phase 1 Tasks

**Task 1.1: A2A Endpoint for Mayor**
- Create REST endpoint exposing Mayor as A2A-compatible service
- Implement `/.well-known/agent.json` for service discovery
- Support JSON-RPC 2.0 task protocol
- Duration: 6 hours

**Task 1.2: Celery ↔ Beads Integration**
- Link Celery task creation to Beads issues
- Map task IDs to bead IDs (li-*)
- Sync task status back to Beads
- Duration: 4 hours

**Task 1.3: Status Sync Daemon**
- Create sync service between Beads and Redis
- Poll every 2 seconds
- Handle status transitions (pending → in_progress → completed/failed)
- Duration: 5 hours

**Task 1.4: Git Commit Automation**
- Automate git commits on status changes
- Create immutable audit trail
- Sign commits with agent identity
- Duration: 3 hours

**Task 1.5: Integration Test Suite**
- Build 3 integration test scenarios
- Test single task flow
- Test multi-task parallel execution
- Test error handling and recovery
- Duration: 4 hours

**Total Phase 1 Effort**: 22 hours

---

## Key Concepts

### Bead IDs

Gastown uses hierarchical bead ID system:

- **Town-level**: `hq-{hash}` (e.g., `hq-abc12`, `hq-mayor`)
- **Local-infra**: `li-{hash}` (e.g., `li-xyz99`, `li-task-1`)
- **Production**: `prod-{hash}` (future)

### Convoys

Logical groupings of related work:
- Named convoys: `morning-security-audit`, `deploy-v2-release`
- Contain 5-15 beads
- Tracked from creation to completion
- Create git commit trail

### Hooks

Git worktree-based persistent storage:
- One worktree per active task
- Survives agent crashes
- Automatic git commits on status changes
- Enable resumable work via `gt handoff`

### A2A Protocol

Agent-to-Agent communication:
- JSON-RPC 2.0 based
- Discoverable via `/.well-known/agent.json`
- SigV4 authentication (production)
- Supports sync and async tasks

---

## Workflow: From Development to Production

```
1. LOCAL DEVELOPMENT (Gastown)
   Developer → Create convoy (hq-conv-123)
   Developer → Create beads (li-abc12, li-xyz99)
   Developer → Assign to workers (gt sling)

2. LOCAL EXECUTION
   Workers execute beads
   Status updates in Redis
   Beads ledger syncs

3. A2A DISPATCH (Phase 1)
   Mayor → Discovers AWS Lambda agents
   Mayor → Sends beads to production (via A2A)
   Production agents execute beads

4. COST TRACKING
   All agent executions log costs
   Aggregated in DynamoDB
   Dashboard shows per-agent metrics

5. FEEDBACK LOOP
   Production results → Pinecone index
   Used for pattern discovery
   Improvements incorporated locally
```

---

## Integration Points with Other Repos

### With agents-prod

**What Gastown gets from agents-prod**:
- A2A protocol specification
- Agent card format (JSON)
- Cost tracking standards
- Agentic design patterns
- Production deployment patterns

**File**: `/Users/jordanm/Github/agents-prod/.ai/context/unified-agent-framework.md`

**Usage**: Reference for implementing A2A endpoints and cost tracking in Phase 1

### With local-infra

**What local-infra gets from Gastown**:
- Work orchestration and coordination
- Persistent task tracking via Beads
- Git-backed audit trail
- Mayor agent for complex workflows

**Key Integration**:
```
Gastown Town (hq-*)
    ↓
External projects routing
    ↓
Local-infra Rig (li-*)
    ↓
Celery Task Queue (Redis)
    ↓
Workers execute tasks
```

**Beads Ledger Syncing**:
- Town-level beads create work items
- External routing directs to local-infra
- Celery picks up and executes
- Status syncs back to Beads
- Git commits track all changes

---

## Development Workflow for Gastown Contributors

### When Adding Features

1. **Understand UNF context**: Read `/Users/jordanm/Github/agents-prod/.ai/context/unified-agent-framework.md`
2. **Check integration points**: Verify feature doesn't break A2A protocol or cost tracking
3. **Test locally**: Use `~/.naptic/` town workspace for testing
4. **Document**: Update this file and relevant SOP docs

### When Debugging Issues

1. **Check Beads status**: `bd list` in local-infra
2. **Check Redis state**: Connect to local Redis, check task queue
3. **Review git commits**: Check `git log` in ~/.naptic/ for audit trail
4. **Check Mayor logs**: Review Mayor session output for orchestration issues

### When Making Breaking Changes

1. **Coordinate with**: agents-prod team (A2A protocol changes)
2. **Test with**: Both town workspace (hq-) and local-infra rig (li-)
3. **Update**: All relevant documentation and SOPs
4. **Communicate**: Document breaking change in commit message

---

## Deployment Strategy

### Phase 0 (CURRENT): Local Only

**Environment**: macOS development machine
**Scale**: Single machine (~5-10 agents)
**Persistence**: Git + SQLite
**Cost**: $0 (local development)

### Phase 1: Local + Production Bridge

**Environment**: macOS + AWS Lambda
**Scale**: Local development + 20+ Lambda agents
**Persistence**: Git + SQLite (local) + DynamoDB (AWS)
**Cost**: ~$50-100/month (Lambda + DynamoDB + Pinecone)

### Phase 2+: Full Production

**Environment**: Pure AWS infrastructure
**Scale**: 30+ distributed agents, multiple regions
**Persistence**: DynamoDB + Pinecone
**Cost**: Variable based on usage

---

## Key Repositories and Paths

### Gastown (This Repo)

```
/Users/jordanm/Github/gastown/
├── cmd/gt/              # GT CLI implementation
├── internal/            # Core Gastown logic
├── .ai/                 # AI documentation
│   ├── context/
│   │   ├── overview.md
│   │   ├── architecture.md
│   │   ├── glossary.md
│   │   └── unf-integration.md (THIS FILE)
│   ├── guides/
│   └── maps/
└── README.md            # User documentation
```

### Town Workspace (Runtime)

```
~/.naptic/              # Central town workspace
├── .git/               # Git repository
├── .beads/             # Town-level Beads
│   ├── config.yaml
│   ├── beads.db
│   └── formulas/
├── mayor/              # Mayor agent
├── deacon/             # Deacon watchdog
└── plugins/            # Extensibility
```

### Local-infra Rig (Integration)

```
/Users/jordanm/Github/local-infra/
├── .beads/             # Local-infra Beads
│   ├── config.yaml
│   ├── beads.db
│   └── AGENTS.md
├── tasks/              # Celery tasks
├── workers/            # Task workers
└── .ai/               # Local-infra docs
```

### UNF Documentation (Reference)

```
/Users/jordanm/Github/.ai/context/
├── gastown-unf-integration-sop.md       # Main SOP
├── phase-0-completion-summary.md        # Phase 0 results
├── phase-1-planning-guide.md            # Phase 1 architecture
├── README-GASTOWN-INTEGRATION.md        # Navigation
└── current-state.md                     # Living status

/Users/jordanm/Github/agents-prod/.ai/
├── context/unified-agent-framework.md   # UNF architecture
├── guides/agent-deployment-guide.md     # Lambda deployment
└── [many other reference docs]
```

---

## Cost Tracking & Token Management

### Standards (from UNF)

Every agent execution must log:
```json
{
  "agent_name": "mayor",
  "task_id": "hq-abc12",
  "model_used": "claude-sonnet-4.5",
  "input_tokens": 4200,
  "output_tokens": 1800,
  "estimated_cost": "$0.0342",
  "execution_time_ms": 2100,
  "timestamp": "2026-02-01T19:59:00Z"
}
```

### Model Selection

- **Claude Haiku**: Simple operations (formatting, queries)
- **Claude Sonnet 4.5**: Standard coding, complex logic
- **Claude Opus 4.5**: Strategic planning, expert tasks

### Implementation (Phase 1)

Cost tracking will be integrated:
1. In Mayor agent task dispatch
2. In Celery worker execution tracking
3. In git commit audit trail
4. In DynamoDB aggregation (production)

---

## Security & Compliance

### Local Development

- Git repository contains no secrets (added to .gitignore)
- Beads ledger is local-only (SQLite)
- No AWS credentials in development workspace

### Production (Phase 1+)

- AWS Secrets Manager for API keys
- SigV4 authentication for A2A calls
- IAM least-privilege per agent
- Audit logging to CloudWatch
- Data encryption at rest (S3) and in transit (TLS)

### Compliance

- SOC 2 Type II (agents-prod)
- GDPR compliance for EU data
- Data retention: 30 days logs, 1 year analytics
- Right to deletion for prospect data

---

## Troubleshooting UNF Integration

### Issue: Beads not syncing

**Cause**: Status sync daemon (Phase 1) not running
**Current Status**: Phase 0 - Not yet implemented
**Resolution**: Will be implemented in Phase 1 Task 1.3

### Issue: A2A endpoint not discoverable

**Cause**: Mayor not exposing `/.well-known/agent.json`
**Current Status**: Phase 0 - Not yet implemented
**Resolution**: Will be implemented in Phase 1 Task 1.1

### Issue: Git commits not created on status changes

**Cause**: Automation not yet implemented
**Current Status**: Phase 0 - Manual git commands only
**Resolution**: Will be automated in Phase 1 Task 1.4

### Issue: Cost tracking missing

**Cause**: Cost logging not yet integrated
**Current Status**: Phase 0 - Not yet implemented
**Resolution**: Will be integrated in Phase 1

---

## References

### Internal UNF Documentation

1. **Unified Agent Framework**: `/Users/jordanm/Github/agents-prod/.ai/context/unified-agent-framework.md`
   - A2A protocol details
   - Agent architecture
   - Cost tracking standards

2. **Agent Deployment Guide**: `/Users/jordanm/Github/agents-prod/.ai/guides/agent-deployment-guide.md`
   - AWS Lambda deployment
   - CodeBuild CI/CD
   - Docker container strategy

3. **Gastown SOP**: `/Users/jordanm/Github/.ai/context/gastown-unf-integration-sop.md`
   - Complete Phase 0-1 walkthrough
   - Installation steps
   - Troubleshooting guide

### External Documentation

1. **Gastown Official**: https://github.com/steveyegge/gastown
2. **Beads Official**: https://github.com/steveyegge/beads
3. **Anthropic Claude API**: https://console.anthropic.com

---

## Next Steps

### Immediate (Next 1-2 days)

- [ ] Review Phase 0 completion summary
- [ ] Verify installation on development machine
- [ ] Familiarize with `~/.naptic/` town structure
- [ ] Test basic `gt` and `bd` commands

### Short Term (This week)

- [ ] Begin Phase 1 planning
- [ ] Set up Phase 1 development environment
- [ ] Design A2A endpoint for Mayor
- [ ] Plan Celery ↔ Beads integration

### Medium Term (Next 1-2 weeks)

- [ ] Implement Phase 1 tasks (22 hours)
- [ ] Build integration test suite
- [ ] Update documentation with Phase 1 results
- [ ] Prepare for production deployment

---

## Questions & Support

For questions about:

- **Gastown features**: See `context/` docs in this directory
- **Local-infra integration**: See `/Users/jordanm/Github/local-infra/.ai/`
- **UNF architecture**: See `/Users/jordanm/Github/agents-prod/.ai/`
- **Phase 0-1 SOP**: See `/Users/jordanm/Github/.ai/context/gastown-unf-integration-sop.md`

---

**Last Updated**: 2026-02-01
**Status**: Phase 0 Complete ✅ | Phase 1 Planned 📅
**Maintainer**: Jordan Mayer - Mayday Cybersecurity & Naptic
