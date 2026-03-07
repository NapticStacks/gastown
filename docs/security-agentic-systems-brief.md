# Security Agentic Systems Brief

**Author:** Naptic Engineering
**Date:** 2026-03-06
**Classification:** Internal - Strategic & Technical
**Status:** LIVING DOCUMENT

---

## 1. Executive Summary

Naptic operates three LangGraph-based security agents that form a closed-loop **detection, triage, and deception** pipeline:

1. **prompt-shield** -- A defense-in-depth middleware agent that scans all input to and output from Naptic's AI agents for prompt injection attacks, PII leakage, and behavioral anomalies. It operates as a sidecar/middleware layer wrapping every agent deployed via `agents-prod`.

2. **intelligent-defender** -- A SOC coordinator agent that ingests security events from CloudWatch, GuardDuty, Splunk, and SIEM feeds; correlates them against threat intelligence (Bitsight CTI); triages alerts with severity scoring; executes automated containment (block IP, isolate instance, revoke credentials); and dispatches deception tasks to honeypot-orchestration.

3. **honeypot-orchestration** -- A multi-cloud deception agent that analyzes architecture via AppAcuity risk diagrams and deploys honeypots across AWS, O365, and Google Workspace. It monitors honeypot interactions, enriches events with threat intelligence, and generates actionable intelligence for the SOC.

Together these agents create a feedback loop: prompt-shield **detects** threats at the agent boundary, intelligent-defender **triages and responds**, and honeypot-orchestration **deploys deception infrastructure** to gather intelligence on attacker behavior. Canary token fires in prompt-shield feed directly into intelligent-defender as CRITICAL alerts, which can trigger automated honeypot deployment near the affected resource.

All three systems are built on LangGraph `StateGraph` with typed state, deterministic node execution, and checkpointing -- chosen specifically for the auditability and reproducibility requirements of security operations.

---

## 2. Agentic Design Patterns & Rationale

### 2.1 StateGraph (LangGraph) -- Deterministic Node Execution

All three agents use `langgraph.graph.StateGraph` as their orchestration primitive. This was chosen over autonomous agent loops (e.g., ReAct with unconstrained tool use) for security-critical reasons:

- **Deterministic execution order.** Each node in the graph fires in a defined sequence. In intelligent-defender, the flow is always: `log_ingestion -> threat_correlator -> alert_triager -> responder -> reporter -> deception_coordinator`. There are no surprise execution paths.
- **Typed state.** Every piece of data flowing through the graph is defined as a `TypedDict` with explicit fields and types, making it auditable and testable.
- **Checkpointing.** LangGraph's built-in checkpointing means every state transition is recorded, enabling forensic reconstruction of any security decision.

### 2.2 Parallel Fan-Out / Fan-In

Used in two systems:

- **prompt-shield IngressGate** runs three scanners in parallel (`MLClassifier`, `RegexScanner`, `PerplexityChecker`), then merges their scores into a single `ScanResult`. This minimizes latency while maximizing detection coverage -- a failing ML classifier does not block the regex scanner from catching a known signature.
- **honeypot-orchestration** fans out deployment across three platforms (AWS, O365, GWS) via conditional routing, then converges at the `monitor` node. Each platform deployer is independent and can be skipped if there are no recommendations for that platform.

### 2.3 Conditional Routing

honeypot-orchestration uses conditional edges extensively to skip platforms with no pending deployments:

```
placement_analyzer -> [conditional] -> aws_deployer | o365_deployer | gws_deployer | monitor
aws_deployer       -> [conditional] -> o365_deployer | gws_deployer | monitor
o365_deployer      -> [conditional] -> gws_deployer | monitor
```

The routing functions (`_should_deploy_aws`, `_should_deploy_o365`, `_should_deploy_gws`) check `state["pending_deployments"]` for platform-specific entries. If no AWS honeypots are needed, the graph skips straight to O365 or GWS or monitoring. This avoids wasted API calls and reduces blast radius.

intelligent-defender uses severity-based routing in the alert triager: events scoring below `config["alert_threshold"]` (default 30) are dropped entirely. The responder routes between automated containment and human-approval based on `config["auto_respond"]`.

### 2.4 Typed State Accumulation

Each system defines a rich `TypedDict` state that grows through nodes:

**intelligent-defender** (`SOCCoordinatorState`):
```
SecurityEvent[] -> ThreatIndicator[] -> Alert[] -> ResponseAction[] -> DeceptionTask[] -> IncidentReport[]
```

Each node reads from upstream fields and writes to its own output fields. The state acts as an immutable audit trail of every decision made during the workflow.

**honeypot-orchestration** (`OrchestratorState`):
```
AppAcuityDiagram -> PlacementRecommendation[] -> HoneypotDeployment[] -> ThreatEvent[] -> ActionableIntelligence[]
```

**prompt-shield** (`ScanResult`):
```
Messages -> {MLClassification, RegexScanResult, PerplexityResult} -> AggregatedScores -> PolicyDecision (ALLOW|WARN|BLOCK|ESCALATE)
```

### 2.5 Defense-in-Depth Layering

prompt-shield implements 5 sequential defense layers, each independent:

| Layer | Name | Function | Scanner |
|-------|------|----------|---------|
| 1 | **Ingress Gate** | Pre-LLM input scanning | MLClassifier, RegexScanner, PerplexityChecker |
| 2 | **System Hardening** | Constrain agent behavior | NeMo Guardrails Colang rules (planned) |
| 3 | **Canary Tokens** | Zero false-positive breach detection | CanaryManager + CanaryScanner via canari-llm |
| 4 | **Egress Gate** | Post-LLM output + tool call scanning | PIIScanner, CanaryScanner, ToolWhitelistValidator |
| 5 | **Privilege Enforcement** | Least-privilege per tool | SecurityProfile tool whitelists + rate limits |

No single layer is sufficient. The explicit design principle: "Perfect prevention is impossible (per OWASP). Optimize for fast detection and response."

### 2.6 Closed-Loop Feedback

The three agents form a closed loop:

```
prompt-shield DETECTS injection
       |
       v  (AlertPayload webhook)
intelligent-defender TRIAGES + RESPONDS
       |
       v  (dispatch_deception_task via honeypot_client)
honeypot-orchestration DEPLOYS traps near affected resources
       |
       v  (ThreatEvent from honeypot interaction)
intelligent-defender INGESTS new events  <-- loop closes
       |
       v
prompt-shield UPDATES scanning profiles based on new threat intel
```

### 2.7 Human-in-the-Loop Gates

Both intelligent-defender and honeypot-orchestration enforce human approval for high-impact actions:

- **intelligent-defender responder:** When `config["auto_respond"]` is `False` (the default), containment actions (block_ip, isolate_instance, revoke_creds) are recorded with status `"pending"` for human approval. Only when explicitly enabled do they auto-execute.
- **honeypot-orchestration guardrails:** The `SecurityGuardrails` class defines an `ActionSeverity` enum. Actions classified as `MODIFY_INFRA`, `DESTROY`, or `CREDENTIAL_OP` require human approval via a configurable callback. The default callback denies all such actions.
- **prompt-shield:** The `ESCALATE` action routes alerts to human SOC analysts via Slack and PagerDuty rather than taking automated action.

### 2.8 Security-as-Code Profiles

prompt-shield implements per-agent YAML security profiles loaded by `ProfileLoader`. Each profile specifies:

- Scanner thresholds (`ml_classifier_threshold`, `regex_severity_threshold`, `perplexity_threshold`)
- Tool whitelists and parameter constraints
- Canary token configuration (types, count, rotation schedule)
- Default action on detection (`WARN`, `BLOCK`, `ESCALATE`)
- Escalation channel routing
- Rate limits (requests/minute, tool calls/minute)

These profiles are version-controlled alongside application code, reviewed in PRs, and loaded at runtime via `ShieldPipeline.from_config()`.

---

## 3. System Architecture

### 3.1 prompt-shield: 5-Layer Defense-in-Depth

**Repository:** `NapticStacks/prompt-shield`
**Runtime:** LangGraph StateGraph, deployed as middleware in agents-prod Lambda functions
**Implementation status:** Scaffolded with typed interfaces; RegexScanner is the most complete component. MLClassifier, PerplexityChecker, PIIScanner, CanaryManager, and PolicyEngine have typed interfaces with TODO implementations.

```
                         External Input
                              |
                    +---------v---------+
                    |   INGRESS GATE    |
                    |  (Layer 1)        |
                    |                   |
                    | +--+ +--+ +----+  |
                    | |ML| |Rx| |Perp|  |  <-- 3 scanners in parallel
                    | +--+ +--+ +----+  |
                    +--------+----------+
                             |
                    +--------v----------+
                    | SYSTEM HARDENING  |
                    |  (Layer 2)        |  <-- NeMo Guardrails Colang (planned)
                    +--------+----------+
                             |
                    +--------v----------+
                    | CANARY TOKENS     |
                    |  (Layer 3)        |  <-- canari-llm injection
                    +--------+----------+
                             |
                         [LLM Call]
                             |
                    +--------v----------+
                    |   EGRESS GATE     |
                    |  (Layer 4)        |
                    |                   |
                    | +---+ +---+ +---+ |
                    | |PII| |Can| |Wht| |  <-- PII, Canary, Tool Whitelist
                    | +---+ +---+ +---+ |
                    +--------+----------+
                             |
                    +--------v----------+
                    | PRIVILEGE ENFORCE  |
                    |  (Layer 5)        |  <-- SecurityProfile rate limits + tool constraints
                    +--------+----------+
                             |
                    +--------v----------+
                    |  POLICY ENGINE    |
                    |  ALLOW | WARN |   |
                    |  BLOCK | ESCALATE |
                    +---------+---------+
                              |
                    +---------v---------+
                    |  ALERT ROUTER     |  --> intelligent-defender (webhook)
                    |                   |  --> Slack #security-alerts
                    |                   |  --> PagerDuty (CRITICAL only)
                    |                   |  --> CloudWatch / SIEM
                    +-------------------+
```

**Key components (implemented):**

| Component | File | Status |
|-----------|------|--------|
| `ShieldPipeline` | `pipeline.py` | Scaffolded -- `scan_ingress()` and `scan_egress()` are TODO |
| `RegexScanner` | `scanners/regex_scanner.py` | **Implemented** -- 8 patterns covering ignore_instructions, system_override, DAN jailbreak, role_hijack, instruction_injection, base64_payload, data_exfil_request, encoding_evasion |
| `MLClassifier` | `scanners/ml_classifier.py` | Scaffolded -- will wrap Guardrails AI PromptInjection validator |
| `PerplexityChecker` | `scanners/perplexity.py` | Scaffolded -- adversarial suffix detection via token distribution |
| `PIIScanner` | `scanners/pii_scanner.py` | Scaffolded -- will wrap Guardrails AI PIIDetection validator |
| `IngressGate` | `middleware/ingress.py` | Scaffolded -- coordinates parallel scanner execution |
| `EgressGate` | `middleware/egress.py` | Scaffolded -- post-LLM output + tool call validation |
| `CanaryManager` | `canary/manager.py` | Scaffolded -- token generation, injection, rotation via canari-llm |
| `PolicyEngine` | `policy/engine.py` | Scaffolded -- evaluates scores against SecurityProfile thresholds |
| `SecurityProfile` / `ProfileLoader` | `policy/profiles.py` | **Implemented** -- YAML loading, per-agent profile configuration |
| `AlertPayload` | `alerts/schemas.py` | **Implemented** -- Pydantic model for SOC webhook payloads |
| LangGraph middleware | `middleware/langgraph.py` | Scaffolded -- `shield_middleware`, `prompt_shield_ingress_middleware`, `canary_token_middleware` |

### 3.2 honeypot-orchestration: Multi-Cloud Deception

**Repository:** `NapticStacks/honeypot-orchestration`
**Runtime:** LangGraph StateGraph, invoked by intelligent-defender or standalone
**Implementation status:** Graph structure and conditional routing are implemented. Node functions are scaffolded with detailed TODOs. Guardrails module is fully implemented.

**Graph flow:**

```
placement_analyzer --[conditional]--> aws_deployer --[conditional]--> o365_deployer --[conditional]--> gws_deployer --> monitor --> alert_respond --> END
```

**State structure (`OrchestratorState`):**

- **Input:** `appacuity_diagram`, `target_platforms` (aws/o365/gws), `deployment_config`, `alert_config`
- **Processing:** `placement_recommendations[]`, `pending_deployments[]`, `deployments[]` (HoneypotDeployment), `threat_events[]` (ThreatEvent), `threat_intel_context`
- **Output:** `actionable_intelligence[]`, `alerts_sent[]`, `deployment_summary`

**Node responsibilities:**

| Node | Purpose | Status |
|------|---------|--------|
| `placement_analyzer` | Ingest AppAcuity diagram, identify high-value assets, score risk zones, generate placement recommendations | Scaffolded |
| `aws_deployer` | Provision AWS honeypots (S3 honeytokens, IAM honeyusers, EC2 honeypots) | Scaffolded |
| `o365_deployer` | Provision O365 decoy mailboxes, SharePoint sites, Teams channels | Scaffolded |
| `gws_deployer` | Provision Google Workspace decoy accounts, Drive files, Calendar entries | Scaffolded |
| `monitor` | Poll active deployments for interactions, deduplicate, enrich with threat intel | Scaffolded |
| `alert_respond` | Evaluate events against thresholds, generate intelligence, dispatch alerts to SOC | Scaffolded |

**Security guardrails (`guardrails.py`) -- Fully Implemented:**

The `SecurityGuardrails` class enforces:
- **Input validation:** Detects credential material in state (AKIA prefixes, PEM keys, passwords). Validates platforms against allowlist. Enforces per-run deployment limits (`MAX_DEPLOYMENTS_PER_RUN`, default 10).
- **Action authorization:** Five severity levels (`READ_ONLY`, `DEPLOY_DECOY`, `MODIFY_INFRA`, `DESTROY`, `CREDENTIAL_OP`). High-risk actions require human approval via configurable callback. Default callback denies all.
- **Rate limiting:** `MAX_RUNS_PER_HOUR` (default 30), enforced with sliding window.
- **Output sanitization:** Strips honeypot internal IPs, deployment credentials, AWS account IDs, and raw event payloads from external reports.
- **Audit trail:** Every authorization decision is logged with tamper-evident SHA-256 fingerprints (`AuditEntry.fingerprint`).
- **Credential isolation:** `credential_resolver()` fetches secrets from AWS Secrets Manager at execution time. Credentials are never stored in agent state or environment variables.

### 3.3 intelligent-defender: SOC Automation

**Repository:** `NapticStacks/intelligent-defender`
**Runtime:** LangGraph StateGraph
**Scale target:** 1 operator managing 300 nodes
**Implementation status:** Graph structure is implemented. Alert triager and responder have working scoring/routing logic. Deception coordinator dispatches to honeypot-orchestration. Integrations are scaffolded.

**Graph flow (linear pipeline):**

```
log_ingestion --> threat_correlator --> alert_triager --> responder --> reporter --> deception_coordinator --> END
```

**State structure (`SOCCoordinatorState`):**

- **Input:** `raw_log_sources` (cloudwatch/guardduty/splunk/siem), `config`
- **Processing:** `events[]` (SecurityEvent), `threat_indicators[]` (ThreatIndicator), `alerts[]` (Alert), `response_actions[]` (ResponseAction), `deception_tasks[]`
- **Output:** `incident_reports[]` (IncidentReport), `dashboard_payload`

**Node responsibilities:**

| Node | Purpose | Status |
|------|---------|--------|
| `log_ingestion` | Ingest events from CloudWatch, GuardDuty, Splunk, SIEM | Scaffolded |
| `threat_correlator` | Match IOCs via Bitsight CTI, profile APT groups | Scaffolded |
| `alert_triager` | Score priorities (severity base + CTI boost), filter below threshold | **Implemented** -- severity scoring, IP correlation, configurable threshold |
| `responder` | Automated containment: block IP (NACL/WAF), isolate EC2 (SG swap), revoke IAM creds | **Implemented** -- action mapping, human-in-the-loop gate via `auto_respond` flag |
| `reporter` | Build dashboards, timelines, compliance evidence (SOC 2 Type 2) | Scaffolded |
| `deception_coordinator` | Dispatch tasks to honeypot-orchestration for high/critical alerts with CTI matches | **Implemented** -- filters to high/critical + correlated indicators, calls `dispatch_deception_task()` |

**Alert scoring logic (implemented in `alert_triager_node`):**
- Base scores: critical=90, high=70, medium=40, low=15
- +20 boost if source IP matches a known-malicious IP from threat indicators
- Events below threshold (default 30) are dropped
- Score-to-priority mapping: >=80 critical, >=60 high, >=40 medium, else low
- Recommended actions: critical -> isolate_instance, high -> block_ip, medium -> notify, low -> monitor

**Integrations:**

| Integration | File | Status |
|-------------|------|--------|
| CloudWatch | `integrations/cloudwatch.py` | Scaffolded |
| GuardDuty | `integrations/guardduty.py` | Scaffolded |
| Bitsight CTI | `integrations/bitsight.py` | Scaffolded |
| Honeypot client | `integrations/honeypot_client.py` | **Implemented** -- dispatches to `HONEYPOT_ORCHESTRATION_URL` API (HTTP call is placeholder) |

---

## 4. Integration Flow

### 4.1 Detection-to-Deception Pipeline

```
                    prompt-shield
                    ============
                         |
            Detects injection attempt
            (canary fire, regex match,
             ML classification)
                         |
                         v
                  AlertPayload (JSON)
                  {event_type, severity,
                   agent_id, detection_layer,
                   detection_details, context}
                         |
                         v
               intelligent-defender
               ====================
                         |
            log_ingestion: Ingest as SecurityEvent
            threat_correlator: Match against CTI
            alert_triager: Score + prioritize
            responder: Containment actions
            deception_coordinator: Dispatch to honeypot
                         |
                         v
            honeypot-orchestration
            =====================
                         |
            placement_analyzer: Assess risk near target
            deployers: Provision traps on relevant platform
            monitor: Watch for attacker interaction
            alert_respond: Generate intelligence
                         |
                         v
               New ThreatEvent from honeypot interaction
                         |
            +------------+------------+
            |                         |
            v                         v
   intelligent-defender          prompt-shield
   (ingest as new event,         (update scanning
    close the loop)               profiles with
                                  new threat intel)
```

### 4.2 Canary Token Fire Scenario

When a canary token is detected in agent output, the following sequence executes:

1. **prompt-shield EgressGate** detects a canary token value in LLM output via `CanaryScanner`.
2. `PolicyEngine` evaluates: canary fire = automatic `ESCALATE` action (confidence: 1.0, zero false positives).
3. `AlertPayload` is generated with `severity: "CRITICAL"`, `detection_layer: "canary"`, `detection_details.canary_type` and `canary_id`.
4. Alert is dispatched to:
   - **intelligent-defender** webhook for automated triage
   - **Slack #security-alerts** for immediate human visibility
   - **PagerDuty** for on-call notification (CRITICAL severity)
5. intelligent-defender's `alert_triager` scores the event at 90+ (critical base score + CTI correlation if applicable).
6. `responder` executes containment: blocks the session/IP, triggers credential rotation.
7. `deception_coordinator` dispatches a `high` honeypot deployment task near the affected resource.
8. honeypot-orchestration deploys traps to gather intelligence on the attacker's lateral movement.

### 4.3 Alert Payload Contract

prompt-shield's `AlertPayload` (defined in `alerts/schemas.py`) is the integration contract between prompt-shield and intelligent-defender:

```python
class AlertPayload(BaseModel):
    event_type: str = "prompt_injection_detected"
    timestamp: datetime
    severity: str           # LOW, MEDIUM, HIGH, CRITICAL
    agent_id: str
    detection_layer: str    # ingress, egress, canary
    detection_details: DetectionDetails
    context: AlertContext
    recommended_action: str
```

`DetectionDetails` includes: `detector`, `detection_type`, `confidence`, `matched_pattern`, `canary_type`, `canary_id`, `found_in`.

---

## 5. Prompt Injection Defense

### 5.1 Threat Landscape

Prompt injection is the #1 threat to LLM applications per OWASP LLM01:2025 and appears in over 73% of LLM security assessments. OWASP explicitly states: "it is unclear if there are fool-proof methods of prevention for prompt injection." This makes defense-in-depth the only viable strategy.

### 5.2 Threat Categories

The prompt injection defense plan identifies 6 threat categories:

| ID | Threat | Severity | MITRE ATLAS |
|----|--------|----------|-------------|
| **T1** | Direct Prompt Injection -- attacker crafts input to override system instructions | CRITICAL | AML.T0051.000 |
| **T2** | Indirect Prompt Injection -- malicious instructions embedded in external data (emails, documents, CRM records) | CRITICAL | AML.T0051.001 |
| **T3** | AI-Induced Lateral Movement (AILM) -- injection in metadata/tags propagates through agents consuming shared data | CRITICAL | -- |
| **T4** | Tool Abuse via Injection -- coerce agent into calling tools with attacker-controlled parameters | CRITICAL | -- |
| **T5** | Multi-Agent Propagation -- injection in one agent's output becomes input to another (gastown polecats) | HIGH | -- |
| **T6** | Multimodal Injection -- hidden instructions in images, PDFs, non-text modalities | MEDIUM | -- |

T3 (AILM) is a 2026 attack vector documented by Orca Security, particularly relevant to Naptic because agents share data stores (EC2 tags, CloudWatch logs, CRM records). A single poisoned data source can influence every agent that reads from it.

### 5.3 Implementation Roadmap

| Phase | Timeline | Goal | Key Deliverables |
|-------|----------|------|-----------------|
| **Phase 1: Foundation** | Weeks 1-3 | Basic input scanning + canary tokens | LangGraph scaffolding, Guardrails AI integration, canari-llm deployment in all agent prompts, regex scanner, per-agent YAML profiles, CloudWatch logging |
| **Phase 2: Output Monitoring + CI/CD** | Weeks 4-6 | Post-LLM scanning + automated gates | Tool call whitelist validator, PII/secrets scanner, Garak in GitHub Actions, NeMo Guardrails Colang rules, behavioral baselines, pre-commit hooks |
| **Phase 3: Observability + SOC** | Weeks 7-9 | Full dashboard + automated response | Prometheus metrics, Grafana SOC dashboard, OpenTelemetry tracing, alert routing to intelligent-defender, automated containment playbooks, PagerDuty integration |
| **Phase 4: Advanced Defense** | Weeks 10-12 | Custom ML + red-team validation | Custom ML classifier on Naptic-specific patterns, cross-agent AILM correlation, secondary guard model for high-risk ops, internal red-team exercise |
| **Phase 5: Continuous** | Ongoing | Maintain and improve | Monthly Garak red-team, quarterly ML retraining, 30-day canary rotation, OWASP/MITRE tracking |

**Current status:** Phase 1 is in progress. The RegexScanner (8 patterns), SecurityProfile/ProfileLoader (YAML), and AlertPayload (Pydantic schema) are implemented. MLClassifier, PerplexityChecker, PIIScanner, IngressGate, EgressGate, CanaryManager, and PolicyEngine are scaffolded with typed interfaces.

---

## 6. External Input Scanning Architecture

### 6.1 IngressGate as Universal Middleware

Every external input handler -- webhooks, email ingestion, CRM triggers, customer chat -- must pass through the `IngressGate` before any data reaches an LLM. The `IngressGate` (defined in `middleware/ingress.py`) coordinates parallel execution of all scanners and returns a single `ScanResult` with an `Action` decision.

### 6.2 Integration Points

prompt-shield provides three integration patterns:

**LangGraph Native Middleware** (defined in `middleware/langgraph.py`):
```python
agent = create_react_agent(
    model=model,
    tools=tools,
    middleware=[
        prompt_shield_ingress_middleware,
        prompt_shield_egress_middleware,
        canary_token_middleware,
    ],
)
```

**Decorator Pattern** (defined in `middleware/langgraph.py`):
```python
@shield_middleware
async def my_node(state, config):
    ...  # pre-LLM scan + post-LLM scan wrapped automatically
```

**FastAPI / Lambda Middleware** (defined in `pipeline.py`):
```python
shield = ShieldPipeline.from_config("shield-config.yaml")
result = await shield.scan_ingress(messages=..., agent_id=...)
if result.action == "BLOCK":
    return shield.blocked_response(result)
```

### 6.3 Per-Source Scanning Profiles

Security profiles (loaded from YAML by `ProfileLoader`) allow per-agent and per-source tuning:

- **Customer-facing agents** (e.g., mayday-agent): `ml_classifier_threshold: 0.5`, `default_action_on_detection: "BLOCK"`, canary tokens enabled
- **Internal agents** (e.g., honeypot-orchestration): `ml_classifier_threshold: 0.8`, `default_action_on_detection: "WARN"`, higher trust but still scanned
- **CRM-connected agents**: PII scanning enabled, tool whitelist restricted to read-only HubSpot operations

Profile fields include: `ml_classifier_threshold`, `regex_severity_threshold`, `perplexity_threshold`, `allowed_tools`, `tool_parameter_constraints`, `canary_token_types`, `canary_token_count`, `canary_rotation_days`, `default_action_on_detection`, `escalation_channel`, `max_requests_per_minute`, `max_tool_calls_per_minute`.

### 6.4 Scanner Inventory

| Scanner | Type | Patterns/Capabilities | Status |
|---------|------|-----------------------|--------|
| **RegexScanner** | Heuristic | 8 compiled patterns: `ignore_instructions` (CRITICAL), `system_override` (CRITICAL), `dan_jailbreak` (CRITICAL), `role_hijack` (HIGH), `instruction_injection` (CRITICAL), `base64_payload` (MEDIUM), `data_exfil_request` (HIGH), `encoding_evasion` (MEDIUM). Supports custom pattern injection. | **Implemented** |
| **MLClassifier** | ML | Wraps Guardrails AI `PromptInjection` validator. Target: DeBERTa/DistilBERT fine-tuned model. Confidence threshold configurable per profile (default 0.7). 90-95% benchmark detection. 5-50ms latency budget. | Phase 1 (scaffolded) |
| **PerplexityChecker** | Statistical | Detects adversarial suffix attacks via token distribution anomaly. Configurable threshold (default 100.0). Segments input text and scores each segment independently. | Phase 2 (scaffolded) |
| **PIIScanner** | Pattern + ML | Scans 8 PII/secret types: email, phone, SSN, credit_card, api_key, aws_key, private_key, password. Wraps Guardrails AI `PIIDetection` validator. | Phase 2 (scaffolded) |
| **CanaryScanner** | Exact match | Zero false-positive detection. Scans LLM output for extracted canary token values. Backed by canari-llm with local SQLite forensic DB. Token types: api_key, email, aws_key, credit_card. 30-day rotation. | Phase 1 (scaffolded) |
| **ToolWhitelistValidator** | Policy | Validates tool calls against per-agent whitelists defined in SecurityProfile. Checks tool name and parameter constraints. | Phase 2 (scaffolded) |

### 6.5 Canary Token Architecture

Canary tokens are the highest-confidence detection layer. The `CanaryManager` handles their lifecycle:

1. **Generation:** Uses `canari-llm` to create deterministic fake secrets (API keys, AWS access keys, email addresses) that look authentic.
2. **Injection:** Embeds tokens into agent system prompts via `inject_into_prompt()`. The LLM sees them as legitimate secrets in its context.
3. **Scanning:** The `CanaryScanner` in the EgressGate checks every LLM output for exact token matches. Any match is a **zero false-positive** signal of successful prompt injection -- there is no legitimate reason for the LLM to output a canary token.
4. **Alerting:** Canary fires trigger `CRITICAL` alerts via webhook to intelligent-defender and PagerDuty.
5. **Rotation:** Tokens rotate every 30 days (configurable per profile via `canary_rotation_days`).
6. **Forensics:** All token activity stored in local SQLite (canari-llm) and forwarded to DynamoDB in production.

### 6.6 Policy Engine

The `PolicyEngine` aggregates scores from all scanners and evaluates them against the agent's `SecurityProfile`:

- **Any canary fire:** Automatic `ESCALATE` regardless of other scores (confidence 1.0)
- **CRITICAL regex match:** Automatic `BLOCK`
- **ML confidence above threshold:** `BLOCK` or `ESCALATE` depending on profile
- **Multiple MEDIUM detections:** Weighted aggregation can trigger `WARN` or `BLOCK`
- **Below all thresholds:** `ALLOW`

Actions: `ALLOW` (pass through), `WARN` (log + continue), `BLOCK` (reject with sanitized response), `ESCALATE` (alert SOC + human review).

---

## 7. Key Differentiators

### 7.1 Zero False-Positive Canary Detection

Canary tokens are the only prompt injection detection technique with a mathematically zero false-positive rate. If a canary token appears in agent output, the agent has been compromised -- there is no benign explanation. This makes canary fires the highest-confidence signal in the entire security pipeline and the primary trigger for automated containment.

### 7.2 AI Guardrails Baked In from Day 1

Both honeypot-orchestration and intelligent-defender include AI security guardrails as foundational components, not afterthoughts. honeypot-orchestration's `SecurityGuardrails` class was implemented before any deployment node -- it enforces input validation, authorization gates, rate limiting, output sanitization, credential isolation, and tamper-evident audit logging from the first line of code.

This reflects the Naptic design principle: "Automation without security is dangerous."

### 7.3 Security-as-Code

Agent security configurations are not runtime knobs -- they are YAML files checked into version control and reviewed in pull requests:

- **Per-agent security profiles** define scanner thresholds, tool whitelists, canary configurations, and rate limits
- **NeMo Guardrails Colang rules** (planned) define conversational rails as code
- **Tool parameter constraints** are declarative, not imperative
- **GitHub Actions CI/CD gates** scan prompt changes with Garak and the Prompt Scanner API on every PR

Changes to security posture go through the same code review process as application changes.

### 7.4 Determinism and Auditability

StateGraph was chosen over autonomous agent patterns specifically because security operations demand reproducibility. Every state transition in every agent is:

- **Typed** -- TypedDict fields with explicit types prevent silent data corruption
- **Checkpointed** -- LangGraph records every node's input and output state
- **Auditable** -- honeypot-orchestration's `AuditEntry` includes tamper-evident SHA-256 fingerprints; intelligent-defender logs every alert score calculation; prompt-shield logs every scan result
- **Deterministic** -- given the same input state, the same nodes execute in the same order with the same routing decisions

This makes forensic reconstruction of any security incident straightforward: replay the graph with the checkpoint state.

### 7.5 Closed-Loop Intelligence

Unlike standalone detection or response tools, the three-agent pipeline creates a self-reinforcing intelligence cycle. Attacks detected by prompt-shield generate threat indicators that improve intelligent-defender's CTI correlation, which drives honeypot placement that captures attacker TTPs, which feeds back into prompt-shield's scanning profiles. Each iteration sharpens the defensive posture.

---

## Appendix A: Repository Map

| System | Repository | Key Files |
|--------|-----------|-----------|
| prompt-shield | `NapticStacks/prompt-shield` | `src/prompt_shield/pipeline.py`, `scanners/regex_scanner.py`, `middleware/ingress.py`, `middleware/egress.py`, `middleware/langgraph.py`, `canary/manager.py`, `policy/engine.py`, `policy/profiles.py`, `alerts/schemas.py` |
| honeypot-orchestration | `NapticStacks/honeypot-orchestration` | `src/honeypot_orchestration/graph.py`, `state.py`, `guardrails.py`, `nodes/placement_analyzer.py`, `nodes/aws_deployer.py`, `nodes/o365_deployer.py`, `nodes/gws_deployer.py`, `nodes/monitor.py`, `nodes/alert_respond.py`, `utils/appacuity.py` |
| intelligent-defender | `NapticStacks/intelligent-defender` | `src/intelligent_defender/graph.py`, `state.py`, `nodes/log_ingestion.py`, `nodes/threat_correlator.py`, `nodes/alert_triager.py`, `nodes/responder.py`, `nodes/reporter.py`, `nodes/deception_coordinator.py`, `integrations/honeypot_client.py`, `integrations/cloudwatch.py`, `integrations/guardduty.py`, `integrations/bitsight.py` |

## Appendix B: Recommended Tool Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Input Scanning | Guardrails AI | ML classifier + custom validators |
| Input Scanning | Custom RegexScanner | 8 known-signature patterns (implemented) |
| System Hardening | NeMo Guardrails | Colang conversational rails (planned) |
| Canary Detection | canari-llm | Zero false-positive breach detection |
| CI/CD Scanning | NVIDIA Garak | 350+ LLM vulnerability probes |
| Output Monitoring | Custom EgressGate | Tool call validation + PII scanning |
| Observability | OpenTelemetry + Prometheus + Grafana | Tracing, metrics, dashboards |
| SOC Integration | intelligent-defender + Slack + PagerDuty | Automated triage + human notification |

## Appendix C: Design Principles

1. **"Automation without security is dangerous."** Every agent gets shield coverage. No exceptions.
2. **Zero-trust agents.** Treat every LLM as a potentially compromised endpoint.
3. **Defense in depth.** No single layer is sufficient. Stack ML classifiers, canary tokens, tool validation, and behavioral monitoring.
4. **Least privilege always.** Tool call whitelists enforced by shield, not by the agent itself.
5. **Detection over prevention.** Perfect prevention is impossible. Optimize for fast detection and response.
6. **Observable by default.** Every shield decision is logged, traced, and metriced.
7. **Security as code.** Profiles, whitelists, and rails are version-controlled and PR-reviewed.
