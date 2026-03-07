# Gastown Use Cases for NapticStacks

Real deployment scenarios mapped to actual Naptic/Mayday/CMU projects. Each scenario exploits gastown's strength: **parallel agents on a single codebase** with coordinated merges.

---

## Scenario 1: agents-prod Lambda Blitz

- **Repo:** `/home/jmay/github/agents-prod`
- **Problem:** 20 agentic design patterns as Lambda functions need testing, hardening, and docs
- **Gastown approach:** 15 polecats, each takes 1-2 Lambda functions. Writes tests, fixes bugs, adds docs.
- **Convoy:** "All 20 Lambdas production-ready"
- **Bonus:** A/B test Claude Opus vs Sonnet on Lambda debugging tasks to inform model selection

## Scenario 2: Omerta Phases 2-3 Parallel Build

- **Repo:** `/home/jmay/github/omerta`
- **Problem:** webflow-lambda Phase 2 (GoHighLevel upsert) + Phase 3 (Slack + Sheets)
- **Gastown approach:** Decompose into 8-10 parallel tasks: contact mapper, GHL client, Slack notifier, Sheets logger, integration tests, error handling, deployment config, docs
- **Why gastown fits:** All same repo, refinery manages merges across tightly coupled components

## Scenario 3: naptic-platform Feature Sprint

- **Repo:** `/home/jmay/github/naptic-platform`
- **Problem:** Astro marketing site needs multiple pages/features simultaneously
- **Gastown approach:** 5-10 polecats, each builds a page/component in parallel
- **Why gastown fits:** Witness monitors for broken builds, refinery merges cleanly

## Scenario 4: STR Governance Platform Build

- **Repo:** `/home/jmay/github/short-term-rental-governance`
- **Problem:** 6-module agentic build spec (address normalization, compliance monitoring, audit trails, entity dedup, reporting, API)
- **Gastown approach:** 10-15 polecats per module phase
- **Critical:** Patent deadline April 14 -- need velocity
- **Why gastown fits:** Convoy per module, cross-module dependencies tracked, maximum parallelism

## Scenario 5: sales-ndc-mayday Proposal Factory

- **Repo:** `/home/jmay/github/sales-ndc-mayday`
- **Problem:** 8+ client folders need updated proposals, discovery templates, pricing
- **Gastown approach:** Each polecat handles one client's materials
- **Why gastown fits:** Consistent branding via shared CLAUDE.md, low merge conflict (separate client folders)

## Scenario 6: CMU Innovation Lab Deliverables

- **Repo:** `/home/jmay/github/cmu-innovation-lab`
- **Problem:** Requirements docs, partnership materials, demo prep (April 14 deadline)
- **Gastown approach:** Multiple parallel tracks: requirements.json updates, presentation materials, demo build
- **Why gastown fits:** Attribution tracks who produced what for academic accountability

## Scenario 7: PIE.ZAA Support Agent Expansion

- **Repo:** `/home/jmay/github/piezaa-piper-customer-support`
- **Problem:** Expand Piper from 8 to 15+ email classification types
- **Gastown approach:** Each polecat adds one classification type with tests
- **Why gastown fits:** Refinery ensures classifier chain stays consistent across parallel additions

## Scenario 8: Multi-Model Tournament

- **Repo:** Any large repo (agents-prod ideal candidate)
- **Problem:** Need data-driven model selection for production deployments
- **Gastown approach:** Same 50 issues, split across Claude Opus / Sonnet / Gemini / GPT
- **Track:** Completion rate, time, revision count, test pass rate
- **Why gastown fits:** Built-in cost tracking, agent attribution, consistent task assignment
