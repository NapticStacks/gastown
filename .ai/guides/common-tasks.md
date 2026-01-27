# Common Tasks

## Adding a New CLI Command

**Files to modify** (in order):
1. `internal/cmd/<command>.go` - Create new command file
2. `internal/cmd/root.go` - Register command in `init()` function
3. Add command to appropriate group (GroupWork, GroupAgents, etc.)

**Template** (for a new command):
```go
package cmd

import (
	"github.com/spf13/cobra"
)

var myCommandCmd = &cobra.Command{
	Use:   "mycommand <args>",
	Short: "Brief description",
	Long:  `Detailed description with examples.`,
	Args:  cobra.MinimumNArgs(1), // or cobra.ExactArgs(1), etc.
	RunE:  runMyCommand,
}

func init() {
	// Add flags if needed
	// myCommandCmd.Flags().StringVar(&myFlag, "flag", "", "Flag description")
	
	// Add to root or parent command
	rootCmd.AddCommand(myCommandCmd)
	// Or: parentCmd.AddCommand(myCommandCmd)
}

func runMyCommand(cmd *cobra.Command, args []string) error {
	// Implementation
	return nil
}
```

**Checklist**:
- [ ] Command file created in `internal/cmd/`
- [ ] Command registered in `init()` function
- [ ] Command added to appropriate group (if needed)
- [ ] Flags defined (if needed)
- [ ] Error handling implemented
- [ ] Tests added (if applicable)
- [ ] Help text written

## Adding a New Agent Role

**Files to modify** (in order):
1. `internal/templates/roles/<role>.md.tmpl` - Create role template
2. `internal/cmd/<role>.go` - Create command file (if needed)
3. `internal/<role>/manager.go` - Create manager (if needed)
4. Update `.ai/maps/component-map.json` - Add role to components

**Template** (for role template):
```markdown
# {{.RoleName}} Role

## Purpose
[Description of role]

## Lifecycle
[When role is created, how it runs, when it's cleaned up]

## Responsibilities
- [Responsibility 1]
- [Responsibility 2]

## Commands
- `gt <role> start` - Start the role
- `gt <role> attach` - Attach to running role

## Context
[Role-specific context and instructions]
```

**Checklist**:
- [ ] Role template created
- [ ] Command file created (if needed)
- [ ] Manager created (if needed)
- [ ] Role integrated into system
- [ ] Documentation updated

## Adding a New Component Manager

**Files to modify** (in order):
1. `internal/<component>/manager.go` - Create manager
2. `internal/<component>/types.go` - Define types (if needed)
3. `internal/cmd/<component>.go` - Create or update command file
4. Update `.ai/maps/component-map.json` - Add component

**Template** (for manager):
```go
package component

import (
	"path/filepath"
	"github.com/steveyegge/gastown/internal/workspace"
)

type Manager struct {
	townRoot string
	// other fields
}

func NewManager(townRoot string) *Manager {
	return &Manager{
		townRoot: townRoot,
	}
}

func (m *Manager) DoSomething() error {
	// Implementation
	return nil
}
```

**Checklist**:
- [ ] Manager created
- [ ] Types defined (if needed)
- [ ] Command integration (if needed)
- [ ] Error handling
- [ ] Tests added
- [ ] Documentation updated

## Debugging Agent Issues

1. **Check agent status**: `gt agents` or `gt <role> status`
2. **Check hooks**: `gt hooks list` - Verify work is assigned
3. **Check mail**: `gt mail check` - See if agent has messages
4. **Check logs**: Look in agent's directory for session logs
5. **Check beads**: `bd show <bead-id>` - Verify work item state
6. **Check witness/deacon**: `gt witness status` or `gt deacon status` - See if monitoring is active

## Debugging Convoy Issues

1. **Check convoy status**: `gt convoy status <convoy-id>`
2. **Check tracked issues**: Look at convoy's `tracks` field
3. **Check issue states**: `bd show <issue-id>` - Verify issues are in expected state
4. **Check swarm**: Look at active workers assigned to convoy's issues
5. **Check notifications**: Verify `notify` field has correct subscribers

## Debugging Beads Operations

1. **Check routes**: `cat ~/gt/.beads/routes.jsonl` - Verify prefix routing
2. **Check beads location**: Routes point to `mayor/rig/.beads/` for rig-level beads
3. **Check town beads**: `~/gt/.beads/` for town-level beads (hq-* prefix)
4. **Check Dolt**: If using Dolt, check database state
5. **Check permissions**: Verify read/write access to beads directories

## Modifying Type System

Gas Town uses Go's type system. When adding new types:

1. **Define types**: Create or update `internal/<component>/types.go`
2. **Update JSON serialization**: Add JSON tags if types are serialized
3. **Update managers**: Modify managers to use new types
4. **Update commands**: Update CLI commands to handle new types
5. **Update tests**: Add tests for new types

## Working with Git Worktrees

Gas Town uses git worktrees extensively:

- **Polecats**: Worktrees from `mayor/rig` to `polecats/<name>/`
- **Refinery**: Worktree from `mayor/rig` to `refinery/rig/`
- **Crew**: Full clones (not worktrees) in `crew/<name>/`

**Key operations**:
- Create worktree: `git worktree add -b <branch> <path>`
- Remove worktree: `git worktree remove <path>`
- List worktrees: `git worktree list`

## Testing Patterns

**Unit tests**: `*_test.go` files alongside source files
**Integration tests**: `*_integration_test.go` files
**Test helpers**: `internal/cmd/test_helpers_test.go`

**Common patterns**:
- Use test fixtures in `testdata/` directories
- Mock external dependencies (git, beads)
- Test error cases and edge cases
- Use table-driven tests for multiple scenarios
