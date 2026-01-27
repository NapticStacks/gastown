# Adding Features

## Feature Addition Workflow

### 1. Understand the Domain

Before adding a feature, understand:
- How it fits into Gas Town's architecture (town-level vs rig-level)
- Which agent roles are involved (Mayor, Deacon, Witness, etc.)
- How it interacts with beads (town-level hq-* vs rig-level)
- Whether it needs persistent state (beads) or ephemeral state

### 2. Design the Feature

**Questions to answer**:
- Is this a CLI command, an agent role, or a component?
- Does it need new types or can it use existing ones?
- Does it need persistent storage (beads) or is it ephemeral?
- How does it integrate with existing systems (mail, hooks, convoys)?

### 3. Implementation Steps

**For CLI Commands**:
1. Create `internal/cmd/<command>.go`
2. Define command with Cobra
3. Add flags and validation
4. Implement `RunE` function
5. Register in `init()` function
6. Add to appropriate command group
7. Write tests

**For Agent Roles**:
1. Create role template in `internal/templates/roles/<role>.md.tmpl`
2. Create manager in `internal/<role>/manager.go` (if needed)
3. Create command in `internal/cmd/<role>.go` (if needed)
4. Integrate with lifecycle system
5. Add to component map

**For Components**:
1. Create package in `internal/<component>/`
2. Define types in `types.go`
3. Create manager in `manager.go`
4. Integrate with CLI (if needed)
5. Write tests
6. Update component map

### 4. Integration Points

**Beads Integration**:
- Determine if feature needs town-level (hq-*) or rig-level beads
- Use `internal/beads/` package for operations
- Update routes if new prefix needed

**Mail Integration**:
- Use `internal/mail/` for agent communication
- Define message templates if needed

**Identity Integration**:
- Use `internal/session/identity.go` for agent identity
- Ensure work is properly attributed

**Git Integration**:
- Use `internal/git/` for git operations
- Consider worktree vs clone based on use case

### 5. Testing

**Unit Tests**:
- Test individual functions and methods
- Mock external dependencies
- Test error cases

**Integration Tests**:
- Test feature end-to-end
- Use test fixtures
- Test with real git/beads (if feasible)

**Manual Testing**:
- Test in development environment
- Verify error messages
- Check help text

### 6. Documentation

**Update**:
- `.ai/maps/component-map.json` - Add new components
- `.ai/maps/concept-map.json` - Add new domain concepts
- `.ai/context/architecture.md` - Update if architecture changes
- `docs/` - Update user-facing docs (if applicable)

### 7. Code Review Checklist

- [ ] Code follows Go conventions
- [ ] Error handling is comprehensive
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No breaking changes (or documented if intentional)
- [ ] Integration points are correct
- [ ] Performance considerations addressed

## Common Feature Patterns

### Pattern: New Work Tracking Feature

**Example**: Adding a new way to track work

1. Define work unit type (bead type)
2. Create manager for work unit lifecycle
3. Add CLI commands for creating/managing work units
4. Integrate with convoys (if applicable)
5. Add mail notifications (if applicable)

### Pattern: New Agent Role

**Example**: Adding a new type of agent

1. Create role template
2. Create manager (if role needs state management)
3. Create CLI commands (start, stop, attach, status)
4. Integrate with lifecycle system
5. Add monitoring (if needed)

### Pattern: New Communication Channel

**Example**: Adding a new way for agents to communicate

1. Define message format
2. Create routing logic
3. Integrate with mail system (or create new system)
4. Add CLI commands for sending/receiving
5. Update agent templates to use new channel

### Pattern: New Workflow Automation

**Example**: Adding a new automated process

1. Define workflow steps
2. Create formula or molecule (if applicable)
3. Create manager for workflow execution
4. Add CLI commands for triggering/managing
5. Integrate with deacon/patrol (if periodic)

## Feature-Specific Considerations

### Town-Level vs Rig-Level

**Town-level features**:
- Use town-level beads (hq-* prefix)
- Stored in `~/gt/.beads/`
- Examples: Convoys, Mayor, Deacon

**Rig-level features**:
- Use rig-level beads (project prefix)
- Stored in `<rig>/mayor/rig/.beads/`
- Examples: Issues, MRs, Polecats

### Persistent vs Ephemeral

**Persistent features**:
- Stored in beads
- Survive agent restarts
- Examples: Issues, Convoys, Agent beads

**Ephemeral features**:
- Stored in memory or temporary files
- Lost on restart
- Examples: Active sessions, Temporary state

### Agent-Managed vs User-Managed

**Agent-managed features**:
- Agents create and manage
- Examples: Polecats (Witness-managed), Dogs (Deacon-managed)

**User-managed features**:
- Users create and manage
- Examples: Crew members, Convoys (user-created)

## Avoiding Common Pitfalls

1. **Don't mix town-level and rig-level**: Be clear about scope
2. **Don't forget identity**: All work must be attributed
3. **Don't bypass beads**: Use beads for persistent state
4. **Don't ignore GUPP**: If work is on hook, agent must run it
5. **Don't create orphaned state**: Ensure cleanup mechanisms exist
6. **Don't break existing workflows**: Consider backward compatibility
