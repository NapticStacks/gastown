# AI Assistant Documentation

This directory contains context for AI coding assistants. Human developers can ignore this.

## Quick Start

1. Read `context/overview.md` for high-level understanding
2. Check `maps/component-map.json` to find specific code
3. Use `guides/` for common development tasks

## Structure

- `context/` - Conceptual understanding (read first)
  - `overview.md` - High-level system overview
  - `architecture.md` - Component relationships and data flow
  - `glossary.md` - Domain terminology

- `maps/` - Structured lookups (JSON for quick reference)
  - `component-map.json` - Machine-readable component index
  - `concept-map.json` - Domain concept → code mapping

- `guides/` - Step-by-step workflows (for common tasks)
  - `common-tasks.md` - Frequent operations and patterns
  - `adding-features.md` - Feature addition workflow

## For Humans

If you find this directory helpful, great! But it's designed for AI tool consumption.
The main `docs/` directory contains user-facing documentation.

## Maintenance

Update this documentation when:
- Adding major features
- Changing architecture
- Modifying core concepts
- Adding new component directories

## Navigation Tips for AI

**When asked about architecture**: Read `context/architecture.md`
**When asked about syntax/commands**: Check `maps/component-map.json` for command implementations
**When asked about domain terms**: Check `context/glossary.md`
**When asked to add a feature**: Follow `guides/adding-features.md`
**When asked to debug**: Check `guides/common-tasks.md` for debugging patterns

## UNF Integration (NEW)

**Gastown is now integrated into the Unified Naptic Framework!**

**Key Document**: `context/unf-integration.md`

This document describes:
- Gastown's role as the local development orchestration layer
- Integration with local-infra (Celery task queue)
- Integration with agents-prod (AWS Lambda deployment)
- Phase 0 completion status (installation & setup)
- Phase 1 planned work (A2A protocol integration)

**Quick Links**:
- **Phase 0 Results**: `/Users/jordanm/Github/.ai/context/phase-0-completion-summary.md`
- **Phase 1 Planning**: `/Users/jordanm/Github/.ai/context/phase-1-planning-guide.md`
- **Main SOP**: `/Users/jordanm/Github/.ai/context/gastown-unf-integration-sop.md`
- **Local-infra Integration**: `/Users/jordanm/Github/local-infra/.ai/context/gastown-integration.md`

**Status**: Phase 0 ✅ Complete | Phase 1 📅 Planned
