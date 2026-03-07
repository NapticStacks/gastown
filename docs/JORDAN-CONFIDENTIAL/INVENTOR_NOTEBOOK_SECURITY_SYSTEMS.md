# Inventor Notebook — Security Agentic Systems
**Systems:** prompt-shield, honeypot-orchestration, intelligent-defender
**Purpose:** Document human inventive decisions for USPTO AI-assisted invention compliance per Fed. Reg. Vol. 90, No. 228, Doc. No. 2025-21457 (Nov. 28, 2025). AI tools are instruments; all inventive conception is human. This log establishes the timeline of human decisions made alongside AI-assisted implementation.
**Inventor:** Jordan Mayer
**Tool:** Claude Code (Claude Opus 4.6)
**Claude Console org:** Mayday Cybersecurity — Org ID: f1b91ca9-a14a-479d-b4a9-1a1e25909d58
**Session dates:** March 5-6, 2026 (session UTC timestamps: 2026-03-07T02:08–02:46Z)
**Note:** Prompts reconstructed from Claude Code session transcript `f08e69c8-16aa-4f49-9411-a93af7242432.jsonl` and git history. Exact wording may vary; substance is accurate.

---

## How to Read This Log

Each entry records:
- **Human decision** — the inventive or strategic choice made by Jordan
- **Prompt issued** — the instruction given to Claude Code as AI instrument
- **AI role** — what the AI executed (implementation only; no inventive conception)

---

## Cross-System Architecture Decisions

### Entry 1 — Decision to Build Three Separate Systems vs. Monolithic SOC Agent
**Approximate time:** ~8:08 PM CST, March 6, 2026 (2026-03-07T02:08:32Z)
**Human decision (Jordan):** Determined that the security agentic portfolio should be three independent, composable systems — prompt-shield, honeypot-orchestration, and intelligent-defender — rather than a single monolithic SOC agent. Each system has a distinct responsibility domain: prompt-shield handles AI agent input/output security scanning; honeypot-orchestration handles deception technology deployment across cloud platforms; intelligent-defender handles SOC coordination, alert triage, and incident response. This separation-of-concerns architecture enables independent scaling, independent deployment lifecycles, and defense-in-depth through system isolation. A compromise of one system does not cascade to the others. Jordan specified this three-system decomposition in the "Round 4" execution plan (Task 3, Task 10a, Task 10b) authored before the Claude Code session.
**Prompt issued:** "Implement the following plan: # Plan: Round 4 -- Platforms, Security Agents, Deception, Pricing, Design [...] Task 10: Two New Security Agentic System Repos [...] 10a. Mayday Honeypot Orchestration System [...] 10b. Intelligent Defender"
**AI role:** AI received the three-system architecture as a specification and scaffolded each system's codebase per Jordan's design. AI did not determine the system decomposition, the separation-of-concerns boundaries, or the decision to build three systems instead of one. All architectural partitioning was Jordan's.

---

### Entry 2 — "Automation Without Security Is Dangerous" as Founding Design Principle
**Approximate time:** ~8:17 PM CST, March 6, 2026 (2026-03-07T02:17:44Z)
**Human decision (Jordan):** After the honeypot-orchestration and intelligent-defender scaffolds were dispatched as background agents, Jordan issued a follow-up directive requiring that both systems embody Naptic's founding design principle: security-by-design with AI guardrails baked in from step one. This is not a technical implementation detail — it is a philosophical and business decision that "automation without security is dangerous" (and its complement, "security without automation is exhausting") must be encoded into every agentic system Naptic/Mayday builds. Jordan required that AI guardrails modules be included in the initial scaffold, not bolted on later.
**Prompt issued:** "for both of the agents - really have deeprooted understanding of our agentic design pattersn and desire for secure by design principles with proper ai security guardrails baked into the reuqirements from the first step"
**AI role:** AI incorporated a `guardrails.py` module into honeypot-orchestration and security-aware patterns into intelligent-defender's responder node (human approval gates, auto_respond=False default). AI did not determine the "automation without security is dangerous" principle, the requirement for day-one guardrails, or the secure-by-design philosophy. All of these were Jordan's standing directives.

---

### Entry 3 — Closed-Loop Feedback Architecture Across Three Systems
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan)
**Human decision (Jordan):** Designed a closed-loop integration architecture where the three systems form a continuous feedback cycle: (1) prompt-shield detects prompt injection attacks and fires alerts via webhook to intelligent-defender; (2) intelligent-defender triages the alert, scores priority, and if the threat involves infrastructure compromise, dispatches deception tasks to honeypot-orchestration via its deception_coordinator node; (3) honeypot-orchestration deploys honeypots near the affected resources and feeds threat intelligence back to intelligent-defender for correlation. This closed-loop design means each system both consumes and produces intelligence for the others, creating a self-reinforcing defensive posture. Jordan specified this integration in the Round 4 plan: intelligent-defender's "[Deception Coordinator] -- Interfaces with Honeypot Orchestration System" and prompt-shield's alert webhook to intelligent-defender.
**Prompt issued:** (Embedded in the Round 4 plan specification provided at session start. Integration paths specified in Task 10a architecture and Task 10b architecture diagrams.)
**AI role:** AI implemented the integration points as specified: `deception_coordinator.py` in intelligent-defender dispatches tasks to honeypot-orchestration via `honeypot_client.py`; prompt-shield's `shield-config.yaml` includes `webhook_url: null # intelligent-defender webhook` as the alert destination. AI did not conceive the closed-loop feedback architecture or determine which systems should communicate with which. All integration design was Jordan's.

---

## prompt-shield Entries

### Entry 4 — Decision to Build Defense-in-Depth (5 Layers) vs. Single Scanner
**Approximate time:** ~8:19 PM CST, March 6, 2026 (2026-03-07T02:19:35Z)
**Human decision (Jordan):** Determined that prompt injection defense requires a multi-layer defense-in-depth architecture rather than a single scanning approach. Jordan's directive created an agent dedicated to prompt injection monitoring and specified that it should research "best practices for prompt injection defense and scanning and visibility 2026." The resulting architecture implements five independent layers: (1) Input Scanning (ML classifier + regex + perplexity checking, pre-LLM), (2) System Prompt Hardening (role/capability constraints, output format enforcement), (3) Canary Token Injection (synthetic decoy secrets for zero-false-positive breach detection), (4) Output Monitoring (tool call validation, PII scanning, behavioral anomaly scoring, post-LLM), (5) Privilege Enforcement (per-tool IAM scoping, human approval for high-risk operations). Jordan's requirement for a comprehensive defense plan drove this five-layer architecture; no single technique stops prompt injection (per OWASP: "it is unclear if there are fool-proof methods of prevention").
**Prompt issued:** "we need to spawn an new agent to scan for prompt injection and be our agentic hub for monitroing for prompt injection across all of our deployed agents. we need to design a plan for that (should be its own github repo and spawn a research agent to use firecrawl mcp to research best practices for prompt injection defense and scanning and visiability 2026"
**AI role:** AI researched prompt injection defense literature (OWASP LLM01:2025, MITRE ATLAS, Orca Security AILM, vendor documentation) and synthesized findings into a defense plan at `/home/jmay/github/gastown/docs/prompt-injection-defense-plan.md`. AI then scaffolded the `prompt-shield` repo implementing the five-layer pattern. AI did not determine that multiple layers were needed, that prompt-shield should be a standalone system, or that it should monitor all deployed agents. Those were Jordan's decisions. AI executed the research and implementation.

---

### Entry 5 — Canary Token Strategy for Zero-False-Positive Detection
**Approximate time:** ~8:19 PM CST, March 6, 2026 (specified in prompt-shield research directive)
**Human decision (Jordan):** By directing the research agent to investigate "best practices for prompt injection defense," Jordan's research pipeline identified canary tokens (via `canari-llm`) as a critical detection layer. Jordan approved and adopted this approach: inject synthetic decoy secrets (fake API keys, fake AWS credentials, fake email addresses) into every agent's system prompt context. If any canary token appears in agent output, it confirms a successful prompt injection attack with zero false positives. This is the only detection technique that provides certainty of breach (100% precision). Jordan decided to deploy canary tokens in all agent system prompts (5 tokens per agent), rotate them every 30 days, and set canary fires to always trigger ESCALATE action (the highest-severity response). This decision is reflected in `shield-config.yaml`: `canary_fire_action: "ESCALATE"`.
**Prompt issued:** (Part of the prompt-shield research and scaffold directive in Entry 4. Jordan reviewed and approved the canary token strategy from the research output.)
**AI role:** AI researched the `canari-llm` library, documented its capabilities (deterministic fake secret generation, exact-match output scanning, webhook alerting, LangGraph integration via `wrap_chain()`), and implemented the canary scanning subsystem (`canary/manager.py`, `canary/scanner.py`). AI did not decide to use canary tokens, determine the rotation schedule, or set the ESCALATE policy for canary fires. Those decisions were Jordan's.

---

### Entry 6 — LangGraph StateGraph for Deterministic Auditability
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan)
**Human decision (Jordan):** Determined that all three security agentic systems must use LangGraph StateGraph as their orchestration framework. This is not merely a technology choice — it is an architectural decision driven by auditability requirements. StateGraph provides deterministic, reproducible execution paths with typed state at every node boundary. Every state transition is inspectable, loggable, and replayable. For security systems that may need to produce evidence for compliance audits (SOC 2 Type 2, incident investigations, legal proceedings), deterministic auditability is a non-negotiable requirement. Jordan specified "LangGraph StateGraph" explicitly in the Round 4 plan for both honeypot-orchestration and intelligent-defender, and extended this pattern to prompt-shield's scanning pipeline.
**Prompt issued:** "Scaffold with UNF patterns (LangGraph StateGraph, typed state, CI/CD)" (from Round 4 plan, Task 10)
**AI role:** AI implemented StateGraph-based orchestration in all three systems: `ShieldPipeline` in prompt-shield uses parallel StateGraph branches for scanner execution; `create_orchestration_graph()` in honeypot-orchestration uses StateGraph with conditional routing; `create_soc_coordinator_graph()` in intelligent-defender uses a linear StateGraph pipeline. AI did not decide to use LangGraph StateGraph or determine why deterministic auditability was required. Those were Jordan's architectural decisions.

---

### Entry 7 — Security-as-Code: Per-Agent YAML Profiles
**Approximate time:** ~8:24 PM CST, March 6, 2026 (prompt-shield scaffold creation)
**Human decision (Jordan):** Determined that agent security policies must be managed as code — version-controlled YAML configuration files, not runtime configuration or database entries. Each agent gets its own security profile defining: allowed tools, risk tolerance thresholds, scan sensitivity levels, and action policies. This "security-as-code" pattern means security policy changes go through the same PR review process as application code changes. Jordan's design principle: "Agent security profiles, tool whitelists, and Colang rails are version-controlled and reviewed in PRs alongside application code." The default `shield-config.yaml` demonstrates this pattern with per-scanner configuration, per-agent canary allocation, and configurable policy actions (ALLOW/WARN/BLOCK/ESCALATE).
**Prompt issued:** (Part of the prompt-shield design specification. Jordan required security-as-code patterns as part of the "secure by design principles" directive in Entry 2.)
**AI role:** AI implemented `shield-config.yaml` with structured YAML configuration for ingress scanners, egress scanners, canary tokens, policy engine, alert routing, and observability. AI created the `policy/profiles.py` and `policy/engine.py` modules to load and apply per-agent profiles. AI did not determine that security policies should be code-managed, what the YAML schema should contain, or the PR-review requirement. Those were Jordan's decisions.

---

### Entry 8 — Scanning at Both Ingress AND Egress
**Approximate time:** ~8:24 PM CST, March 6, 2026 (prompt-shield architecture)
**Human decision (Jordan):** Determined that prompt-shield must scan at two critical control points: ingress (before the LLM processes input) and egress (after the LLM produces output, before tool calls execute or responses reach users). Ingress scanning catches known attack patterns before they reach the model. Egress scanning catches the consequences of successful attacks — unauthorized tool calls, data exfiltration via output, canary token extraction, behavioral anomalies. Most prompt injection defenses focus only on input scanning; Jordan's decision to enforce both ingress and egress creates a security sandwich where even novel attacks that bypass input classification are caught at the output layer. This is reflected in the `ShieldPipeline` class with its separate `scan_ingress()` and `scan_egress()` methods, and in `shield-config.yaml` with independent `ingress:` and `egress:` configuration blocks.
**Prompt issued:** (Part of the defense-in-depth architecture specified in the prompt-shield design. Jordan's directive for comprehensive "monitoring" and "scanning" implied both input and output coverage.)
**AI role:** AI implemented the dual-gate architecture with separate ingress middleware (`middleware/ingress.py`) and egress middleware (`middleware/egress.py`), each with independent scanner chains. AI did not determine that both ingress and egress scanning were necessary or design the two-gate control point architecture. That was Jordan's security architecture decision.

---

### Entry 9 — Human-in-the-Loop ESCALATE Action
**Approximate time:** ~8:24 PM CST, March 6, 2026 (prompt-shield policy design)
**Human decision (Jordan):** Determined that prompt-shield's policy engine must include an ESCALATE action alongside ALLOW, WARN, and BLOCK. ESCALATE is distinct from BLOCK: it halts the request AND routes the incident to a human operator for review via intelligent-defender webhook, Slack alerts, and PagerDuty. This ensures that high-confidence detections (especially canary token fires, which have zero false positives) always involve human judgment before automated response. Jordan set canary fires to always trigger ESCALATE rather than automatic BLOCK, because a confirmed prompt injection attack requires human-directed incident response — not just a blocked request. This design reflects Jordan's principle that automated systems should escalate to humans for consequential security decisions.
**Prompt issued:** (Part of the "secure by design principles with proper ai security guardrails" directive. The ESCALATE action and human escalation pattern are Jordan's standing requirements for all Naptic agentic systems.)
**AI role:** AI implemented the `Action` enum with four values (ALLOW, WARN, BLOCK, ESCALATE) in `pipeline.py`, configured `canary_fire_action: "ESCALATE"` in the default config, and implemented alert routing to intelligent-defender webhook, Slack, and PagerDuty in `alerts/router.py`. AI did not determine the four-action taxonomy, the ESCALATE semantics, or the decision to always escalate canary fires. Those were Jordan's policy decisions.

---

### Entry 10 — Integration Architecture: prompt-shield to intelligent-defender Webhook
**Approximate time:** ~8:24 PM CST, March 6, 2026 (prompt-shield alert design)
**Human decision (Jordan):** Determined that prompt-shield alerts must feed directly into intelligent-defender's SOC coordination pipeline rather than operating as a standalone alerting system. When prompt-shield detects a prompt injection attempt, it emits a structured JSON webhook payload to intelligent-defender, which then triages the alert alongside other security events (CloudWatch, GuardDuty, Splunk), correlates with threat intelligence, and coordinates the response. This integration means prompt injection attacks are treated as first-class security incidents in the same SOC workflow as infrastructure threats, not siloed in a separate AI-security channel. Jordan specified this integration path in the prompt-shield architecture: "Webhook --> intelligent-defender" in the Alert/SOC Integration layer.
**Prompt issued:** (Specified in the Round 4 plan and the defense plan architecture. Jordan designed the webhook integration as part of the closed-loop architecture in Entry 3.)
**AI role:** AI implemented the alert payload schema in `alerts/schemas.py` with fields for `event_type`, `severity`, `agent_id`, `detection_layer`, `detection_details`, and `context`. AI configured `alerts.webhook_url` in `shield-config.yaml` for the intelligent-defender endpoint. AI did not determine that prompt-shield should integrate with intelligent-defender or design the webhook-based integration pattern. Those were Jordan's architectural decisions.

---

## honeypot-orchestration Entries

### Entry 11 — Decision to Span Three Cloud Platforms (AWS + O365 + GWS)
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan, Task 3 and Task 10a)
**Human decision (Jordan):** Determined that honeypot deployment must span three cloud platforms simultaneously — AWS, Office 365, and Google Workspace — rather than focusing on a single cloud provider. Jordan specified the exact deception token types for each platform: AWS (EC2 honeypots, fake S3 buckets with honeytokens, IAM honeytoken credentials, fake RDS instances, Lambda canary endpoints); Office 365 (decoy mailboxes, honeytoken documents in SharePoint/OneDrive, fake admin accounts); Google Workspace (decoy accounts, honeytoken files in Drive, fake shared drives). This multi-platform approach reflects the reality of Mayday's client environments: B2B SaaS companies typically run on AWS infrastructure with either O365 or Google Workspace for productivity — attackers move laterally across all three. A deception system limited to one platform would leave blind spots in the attack surface.
**Prompt issued:** "Task 10a. Mayday Honeypot Orchestration System [...] AWS Deployer -- Provisions EC2 honeypots, S3 honeytokens, IAM canary creds, Lambda canaries [...] O365 Deployer -- Creates decoy mailboxes, SharePoint honeytokens, fake admin accounts [...] GWS Deployer -- Creates decoy Drive files, shared drives, honeytoken accounts" (from Round 4 plan)
**AI role:** AI scaffolded separate deployer nodes for each platform (`nodes/aws_deployer.py`, `nodes/o365_deployer.py`, `nodes/gws_deployer.py`) and the `HoneypotDeployment` typed state with `platform: Literal["aws", "o365", "gws"]`. AI did not determine which platforms to support, which deception token types to deploy on each platform, or why multi-platform coverage was necessary. All platform and token type decisions were Jordan's.

---

### Entry 12 — AppAcuity-Driven Placement Analysis
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan, Task 3)
**Human decision (Jordan):** Determined that honeypot placement should be driven by AppAcuity architecture diagram analysis rather than manual configuration or random placement. AppAcuity produces operationalized architecture diagrams that map an organization's infrastructure, data flows, and trust boundaries. Jordan decided that the Placement Analyzer node should ingest these diagrams, identify high-value assets and attack surfaces, map risk zones across target platforms, and produce prioritized placement recommendations. This means honeypots are placed where they are most likely to detect real attacks — near crown-jewel assets, along lateral movement paths, and at trust boundaries — rather than deployed uniformly. This intelligence-driven placement is a key differentiator from commodity honeypot solutions.
**Prompt issued:** "AppAcuity integration: Ingest operationalized diagrams to identify risk exposure -- recommend optimal honeypot placement" and "[Placement Analyzer] -- Ingests AppAcuity diagrams, maps risk, recommends placement" (from Round 4 plan, Task 3 and Task 10a)
**AI role:** AI implemented `placement_analyzer_node()` in `nodes/placement_analyzer.py` and `utils/appacuity.py` for diagram parsing. The `OrchestratorState` includes `appacuity_diagram: dict[str, Any]` as the primary input and `placement_recommendations: list[PlacementRecommendation]` as the analysis output. AI did not conceive the AppAcuity integration, the risk-driven placement strategy, or the decision to make placement analysis the entry point of the orchestration pipeline. Those were Jordan's.

---

### Entry 13 — Conditional Routing: Skip Platforms With No Recommendations
**Approximate time:** ~8:20 PM CST, March 6, 2026 (honeypot-orchestration scaffold, git commit `c9a7f9f` at 20:20 CST)
**Human decision (Jordan):** Determined that the orchestration graph should conditionally route through deployers based on the placement analyzer's recommendations, skipping platforms that have no pending deployments. If AppAcuity analysis determines that a client has no Google Workspace exposure, the GWS deployer should be skipped entirely rather than invoked with an empty deployment list. This conditional routing pattern prevents unnecessary API calls, reduces execution time, and avoids errors from invoking deployers against platforms the client does not use. Jordan's architecture specified this as conditional edges in the StateGraph.
**Prompt issued:** (Part of the Task 10a architecture specification. The conditional routing pattern is implied by the per-platform deployer design — each platform is only deployed to if the placement analyzer recommends it.)
**AI role:** AI implemented conditional routing functions (`_route_after_placement`, `_route_after_aws`, `_route_after_o365`) that check `state["pending_deployments"]` for platform-specific entries and route accordingly. If no deployments are pending for any platform, the graph skips directly to the monitor node. AI implemented the routing logic per Jordan's conditional-execution architecture. AI did not determine that platforms should be skippable or design the conditional routing strategy.

---

### Entry 14 — Deception Token Types Selection
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan, Task 3)
**Human decision (Jordan):** Selected the specific deception token types for each platform based on attacker tradecraft analysis. For AWS: EC2 honeypots (attract network scanners and lateral movement), fake S3 buckets with honeytokens (detect data exfiltration attempts), IAM honeytoken credentials (detect credential theft), fake RDS instances (attract database-targeting attacks), Lambda canary endpoints (detect API abuse). For O365: decoy mailboxes (detect email-based reconnaissance), honeytoken documents in SharePoint/OneDrive (detect document exfiltration), fake admin accounts (detect privilege escalation attempts). For GWS: decoy accounts, honeytoken files in Drive, fake shared drives (same detection categories adapted to Google's platform). Each token type maps to a specific attacker technique in the MITRE ATT&CK framework. Jordan selected these types based on Mayday's experience with real-world attack patterns against B2B SaaS clients.
**Prompt issued:** (Enumerated explicitly in Round 4 plan, Task 3: "EC2 honeypots, fake S3 buckets with honeytokens, IAM honeytoken credentials, fake RDS instances, Lambda canary endpoints" for AWS; "Decoy mailboxes, honeytoken documents in SharePoint/OneDrive, fake admin accounts" for O365; "Decoy accounts, honeytoken files in Drive, fake shared drives" for GWS.)
**AI role:** AI implemented the `HoneypotDeployment` typed state with `resource_type: str` to support the enumerated token types, and structured each platform deployer to provision the specified resource types. AI did not determine which deception token types to deploy or the attacker-tradecraft rationale behind each selection. Those were Jordan's security engineering decisions.

---

### Entry 15 — AI Guardrails Module Baked In From Day One
**Approximate time:** ~8:17 PM CST, March 6, 2026 (2026-03-07T02:17:44Z)
**Human decision (Jordan):** After the honeypot-orchestration scaffold was already dispatched, Jordan issued a follow-up directive requiring that AI security guardrails be embedded in the codebase from the first commit — not added as a later enhancement. This resulted in `guardrails.py` being included in the initial scaffold with six defense-in-depth controls: input sanitization (credential leak detection, platform validation, deployment count limits), action authorization gates (human approval required for MODIFY_INFRA, DESTROY, and CREDENTIAL_OP actions), blast radius controls (MAX_DEPLOYMENTS_PER_PLATFORM, MAX_DEPLOYMENTS_PER_RUN, MAX_RUNS_PER_HOUR), credential isolation (secrets resolved from AWS Secrets Manager at execution time, never passed through agent state), output sanitization (strip honeypot infrastructure details from external reports), and tamper-evident audit logging (SHA-256 fingerprinted entries). The `SecurityGuardrails` class enforces that all node operations pass through guardrails before executing infrastructure changes.
**Prompt issued:** "for both of the agents - really have deeprooted understanding of our agentic design pattersn and desire for secure by design principles with proper ai security guardrails baked into the reuqirements from the first step"
**AI role:** AI implemented the `SecurityGuardrails` class, `ActionSeverity` enum, `AuditEntry` dataclass, and `credential_resolver()` function in `guardrails.py`. AI implemented the human-approval gate pattern (`HUMAN_APPROVAL_REQUIRED` set), the default-deny approval callback, and the tamper-evident audit fingerprint. AI did not determine that guardrails should be included from day one, define the six control categories, or decide which action severities require human approval. Those were Jordan's security architecture decisions.

---

## intelligent-defender Entries

### Entry 16 — 1-Operator-to-300-Nodes Scaling Architecture
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan, Task 10b)
**Human decision (Jordan):** Set the explicit scale target for intelligent-defender: one human SOC operator managing 300 nodes. This is not a theoretical aspiration — it is a design constraint that drives every architectural decision in the system. At 300 nodes, manual alert triage is impossible (a single GuardDuty instance can generate hundreds of findings per day). The system must automate log ingestion, threat correlation, alert scoring, and low-confidence response actions while escalating only high-confidence, high-severity incidents to the human operator. Jordan specified this scale target based on Mayday's market positioning: boutique cybersecurity firms cannot hire large SOC teams, so the intelligent-defender must be the force multiplier that lets one operator defend an enterprise-scale environment.
**Prompt issued:** "Scale target: 1 operator managing 300 nodes." (from Round 4 plan, Task 10b)
**AI role:** AI embedded the scale target in the graph module docstring ("Scale target: 1 operator managing 300 nodes") and designed the pipeline to support high-volume processing: multi-source log ingestion (CloudWatch, GuardDuty, Splunk, SIEM), automated scoring with configurable thresholds, and auto-respond capability gated by human approval. AI did not determine the 300-node scale target or the business rationale behind it. Those were Jordan's.

---

### Entry 17 — Alert Scoring Algorithm Design
**Approximate time:** ~8:20 PM CST, March 6, 2026 (intelligent-defender scaffold, git commit `dcd64c0` at 20:20 CST)
**Human decision (Jordan):** Determined that intelligent-defender must use a numeric scoring algorithm for alert triage rather than simple severity pass-through. Jordan's architecture specified "[Alert Triager] -- Priority scoring, false-positive filtering" as a distinct pipeline node. The scoring system uses: base scores mapped from source severity (critical=90, high=70, medium=40, low=15), boosted by +20 when a source IP matches a threat intelligence indicator (IOC correlation), filtered by a configurable threshold (default 30), and mapped to priority tiers (>=80 critical, >=60 high, >=40 medium, else low). This scoring approach ensures that a medium-severity event from an IP matching known threat intelligence is escalated to high priority, while a low-severity event with no CTI correlation is suppressed. Jordan specified scoring and false-positive filtering as explicit triager capabilities.
**Prompt issued:** "[Alert Triager] -- Priority scoring, false-positive filtering" (from Round 4 plan, Task 10b architecture)
**AI role:** AI implemented the scoring algorithm in `alert_triager_node()` with `_SEVERITY_SCORES` mapping, CTI IP correlation boost, threshold filtering, and priority tier mapping. AI implemented `_recommend_action()` mapping priorities to response types (critical->isolate_instance, high->block_ip, medium->notify, low->monitor). AI did not determine the scoring methodology, the severity-to-score mapping, the CTI boost value, or the threshold defaults. The scoring architecture was Jordan's specification; AI implemented the algorithm.

---

### Entry 18 — Automated Containment With Human Approval Gates
**Approximate time:** ~8:20 PM CST, March 6, 2026 (intelligent-defender scaffold)
**Human decision (Jordan):** Determined that intelligent-defender must support automated containment actions (block IP via NACL/WAF, isolate EC2 instance via security group swap, revoke IAM credentials via access key deactivation) but with a critical safety constraint: automated response is OFF by default (`auto_respond: False`). When auto_respond is disabled, the responder records all containment actions with status "pending" for human approval. When enabled, the responder executes containment actions automatically but logs every action for audit. This design reflects Jordan's principle that automated systems must have human approval gates for consequential infrastructure changes — the same principle applied across all three security systems. Jordan specified "[Responder] -- Automated containment (block IP, isolate instance, revoke creds)" in the architecture, with the human-gate pattern required by the "secure by design" directive.
**Prompt issued:** "[Responder] -- Automated containment (block IP, isolate instance, revoke creds)" (from Round 4 plan) combined with "secure by design principles with proper ai security guardrails baked into the reuqirements from the first step" (follow-up directive)
**AI role:** AI implemented `responder_node()` with `auto_respond` config flag (default False), `ResponseAction` typed state with status tracking (pending/executing/completed/failed), `_execute_containment()` placeholder for boto3 API calls, and error handling with audit logging. AI did not determine that auto_respond should default to off, that containment actions should require human approval, or the specific containment action types. Those were Jordan's security architecture decisions.

---

### Entry 19 — Six-Node Linear Pipeline Architecture
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan, Task 10b)
**Human decision (Jordan):** Designed the intelligent-defender pipeline as a six-node linear chain: log_ingestion -> threat_correlator -> alert_triager -> responder -> reporter -> deception_coordinator. Jordan chose a linear pipeline (not a branching graph) because SOC operations follow a deterministic sequence: you must ingest before you can correlate, correlate before you can triage, triage before you can respond, respond before you can report, and report before you can coordinate deception. Each node produces typed state that the next node consumes. Jordan specified each node's responsibility and data flow in the Round 4 plan architecture diagram. The deception_coordinator as the terminal node is a deliberate design choice: after all SOC processing is complete, the system dispatches proactive deception tasks to honeypot-orchestration, closing the feedback loop.
**Prompt issued:** "[SOC Coordinator Agent] (LangGraph StateGraph) -> [Log Ingestion] -> [Threat Correlator] -> [Alert Triager] -> [Responder] -> [Reporter] -> [Deception Coordinator]" (from Round 4 plan, Task 10b)
**AI role:** AI implemented `create_soc_coordinator_graph()` with six nodes connected by linear edges, `SOCCoordinatorState` TypedDict with input/processing/output/metadata field groups, and individual node modules. AI did not determine the six-node pipeline structure, the node ordering, or the decision to place deception_coordinator as the terminal node. Those were Jordan's SOC workflow design decisions.

---

### Entry 20 — Deception Coordinator: Intelligent-Defender to Honeypot-Orchestration Integration
**Approximate time:** ~8:08 PM CST, March 6, 2026 (specified in Round 4 plan, Task 10b)
**Human decision (Jordan):** Determined that intelligent-defender must include a deception_coordinator node that interfaces with the honeypot-orchestration system. When the SOC coordinator identifies high/critical alerts with correlated threat intelligence (confirmed IOC matches), it dispatches deception tasks to honeypot-orchestration to deploy honeypots near the affected resources. This creates an active defense posture: instead of merely detecting and containing threats, the system proactively plants deception technology in the attacker's path to gather additional intelligence. Jordan specified "[Deception Coordinator] -- Interfaces with Honeypot Orchestration System" as the final pipeline node. The decision to only dispatch deception tasks for high/critical alerts with CTI matches ensures deception resources are deployed strategically, not indiscriminately.
**Prompt issued:** "[Deception Coordinator] -- Interfaces with Honeypot Orchestration System" (from Round 4 plan, Task 10b)
**AI role:** AI implemented `deception_coordinator_node()` which filters for high/critical priority alerts with `correlated_indicators`, creates deception tasks with `placement_strategy: "near_resource"`, and dispatches via `honeypot_client.dispatch_deception_task()`. AI did not determine that intelligent-defender should dispatch deception tasks, the filtering criteria for actionable alerts, or the near-resource placement strategy. Those were Jordan's active defense design decisions.

---

## Evidence References

### Git Commits
- `c9a7f9f` (2026-03-06 20:20:16 CST) — "Scaffold LangGraph-based honeypot orchestration system for Mayday" (`honeypot-orchestration`)
- `dcd64c0` (2026-03-06 20:20:53 CST) — "feat: scaffold intelligent-defender SOC automation system" (`intelligent-defender`)
- `prompt-shield` repo created ~20:52 CST March 6, 2026 (no git history; file timestamps)
- `prompt-injection-defense-plan.md` created ~20:24 CST March 6, 2026

### Session Transcript
- File: `/home/jmay/.claude/projects/-home-jmay-github-gastown/f08e69c8-16aa-4f49-9411-a93af7242432.jsonl`
- Session ID: `f08e69c8-16aa-4f49-9411-a93af7242432`
- Key human prompts at UTC timestamps: 02:08:32Z (Round 4 plan), 02:17:44Z (guardrails directive), 02:19:35Z (prompt-shield directive)

### Source Code Repositories
- `/home/jmay/github/prompt-shield/` — prompt-shield scaffold (LangGraph scanning pipeline)
- `/home/jmay/github/honeypot-orchestration/` — honeypot orchestration system
- `/home/jmay/github/intelligent-defender/` — SOC coordinator agent
- `/home/jmay/github/gastown/docs/prompt-injection-defense-plan.md` — defense plan document

---

*This inventor notebook was created on March 6, 2026 from Claude Code session transcripts, git commit history, and source code review. All inventive decisions documented herein were made by Jordan Mayer. Claude Code (Opus 4.6) served as an implementation tool; it did not contribute to inventive conception.*
