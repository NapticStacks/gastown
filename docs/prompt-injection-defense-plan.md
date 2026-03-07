# Prompt Injection Defense Plan: NapticStacks/prompt-shield

**Author:** Jordan May / Naptic Engineering
**Date:** 2026-03-06
**Status:** DRAFT
**Classification:** Internal - Security Architecture

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Detection Approaches](#2-detection-approaches)
3. [Recommended Architecture](#3-recommended-architecture)
4. [Tool/Framework Evaluation](#4-toolframework-evaluation)
5. [Implementation Roadmap](#5-implementation-roadmap)

---

## 1. Threat Model

### 1.1 Context: Naptic/Mayday Agent Landscape

Naptic deploys LangGraph-based agents on AWS Lambda via `agents-prod`. These agents interact with:

- **AWS Infrastructure** (EC2, IAM, S3, Lambda, CloudFormation)
- **O365 / Google Workspace** (email, calendar, documents)
- **HubSpot CRM** (contacts, deals, engagements)
- **Security tooling** (honeypot orchestration, intelligent-defender)

A successful prompt injection against any of these agents could lead to unauthorized infrastructure changes, data exfiltration, or lateral movement across connected systems.

### 1.2 Threat Categories

#### T1: Direct Prompt Injection

An attacker crafts input directly to an agent's chat interface to override system instructions.

- **Risk to Naptic:** mayday-agent exposed via customer-facing interfaces; attacker could override deception technology instructions to reveal honeypot infrastructure
- **Severity:** CRITICAL
- **OWASP Reference:** LLM01:2025 Prompt Injection (ranked #1)
- **MITRE ATLAS:** AML.T0051.000

#### T2: Indirect Prompt Injection

Malicious instructions embedded in external data sources (emails, documents, web pages, database records) that agents ingest during RAG or tool use.

- **Risk to Naptic:** Agents pulling data from O365/Google Workspace could ingest poisoned documents; CRM records could contain injection payloads in notes/comments fields
- **Severity:** CRITICAL
- **MITRE ATLAS:** AML.T0051.001

#### T3: AI-Induced Lateral Movement (AILM)

A new 2026 attack vector documented by Orca Security. Prompt injection planted in metadata, tags, or log fields propagates through AI agents that consume that data, enabling lateral movement without network access.

- **Risk to Naptic:** EC2 tags, CloudWatch logs, or CRM records poisoned with injection payloads could propagate through honeypot-orchestration and intelligent-defender agents. An attacker who compromises one agent's data source can potentially influence every agent that reads from shared data stores.
- **Severity:** CRITICAL
- **Key insight:** "What simplifies operations also simplifies attacks" -- Orca Security

#### T4: Tool Abuse via Injection

Attacker coerces an agent into calling tools it has access to (AWS APIs, email sending, database queries) with attacker-controlled parameters.

- **Risk to Naptic:** agents-prod agents have IAM roles with AWS API access. A successful injection could trigger infrastructure changes, exfiltrate secrets, or modify security configurations.
- **Severity:** CRITICAL

#### T5: Multi-Agent Propagation

In multi-agent systems (like gastown with 5-30+ polecats), a prompt injection in one agent's output becomes input to another agent, creating a chain reaction.

- **Risk to Naptic:** gastown polecats share a codebase; convoy coordination could propagate poisoned instructions across the entire fleet
- **Severity:** HIGH

#### T6: Multimodal Injection

Hidden instructions in images, PDFs, or other non-text modalities that accompany benign text content.

- **Risk to Naptic:** Agents processing customer-uploaded documents (PDF resumes, images, reports) could trigger hidden injection payloads
- **Severity:** MEDIUM

### 1.3 Attack Surface Map

```
                    EXTERNAL ATTACK SURFACE
                    =======================

    Customer Chat    Email/O365     Web Scraping    CRM Records
         |              |               |               |
         v              v               v               v
    +----+----+    +----+----+    +-----+-----+    +----+----+
    | Direct  |    | Indirect|    | Indirect  |    | Indirect|
    | Inject  |    | Inject  |    | Inject    |    | Inject  |
    +----+----+    +----+----+    +-----+-----+    +----+----+
         |              |               |               |
         v              v               v               v
    +----+--------------+---------------+---------------+----+
    |                  AGENT RUNTIME (Lambda)                 |
    |  +-----------+  +-----------+  +-----------+           |
    |  | mayday-   |  | honeypot- |  |intelligent|           |
    |  | agent     |  | orchestr. |  | defender  |           |
    |  +-----+-----+  +-----+-----+  +-----+-----+          |
    |        |              |               |                 |
    |        v              v               v                 |
    |  +-----+--------------+---------------+-----+          |
    |  |          TOOL LAYER (MCP/APIs)           |          |
    |  |  AWS APIs | O365 | GWS | HubSpot | CLI  |          |
    |  +----------------------------------------------+      |
    +--------------------------------------------------------+
                         |
                         v
              INTERNAL ATTACK SURFACE
              =======================
         AWS Infra    Secrets    Customer Data

    LATERAL MOVEMENT PATHS (AILM):
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Agent A output --> Agent B input --> Tool abuse
    Poisoned tag   --> Security agent --> False triage
    CRM injection  --> Sales agent    --> Email exfil
```

---

## 2. Detection Approaches

Ranked by effectiveness for Naptic's architecture:

### 2.1 Multi-Layer Defense Pattern (MOST EFFECTIVE)

No single technique stops prompt injection. The only viable strategy is defense-in-depth with multiple independent layers. OWASP explicitly states: "it is unclear if there are fool-proof methods of prevention for prompt injection."

**Architecture:**

```
    User Input
         |
         v
    +----+----+
    | Layer 1 |  INPUT SCANNING (pre-LLM)
    | Classif.|  - ML classifier (fine-tuned model)
    | + Rules |  - Regex/heuristic rules
    +----+----+  - Known payload signatures
         |
         v
    +----+----+
    | Layer 2 |  SYSTEM PROMPT HARDENING
    | Constrain|  - Role/capability constraints
    | Behavior|  - Output format enforcement
    +----+----+  - Instruction hierarchy
         |
         v
    +----+----+
    | Layer 3 |  CANARY TOKEN INJECTION
    | Honeypot|  - Synthetic decoy secrets in context
    | Tokens  |  - Zero false-positive breach detection
    +----+----+  - Immediate alert on extraction
         |
         v
    +----+----+
    | Layer 4 |  OUTPUT MONITORING (post-LLM)
    | Scan    |  - Tool call validation
    | Output  |  - Sensitive data leak detection
    +----+----+  - Behavioral anomaly scoring
         |
         v
    +----+----+
    | Layer 5 |  PRIVILEGE ENFORCEMENT
    | Least   |  - Per-tool IAM scoping
    | Priv.   |  - Human approval for high-risk ops
    +---------+  - Rate limiting per action type
```

### 2.2 Input Scanning (Pre-LLM Call)

**What it does:** Classifies incoming prompts/data before they reach the LLM.

**Techniques:**
- **ML-based classification:** Fine-tuned lightweight models (e.g., DeBERTa, DistilBERT) trained on prompt injection datasets to classify inputs as benign/malicious. Guardrails AI and NeMo Guardrails both support this pattern.
- **Heuristic rules:** Regex patterns matching known injection signatures ("ignore previous instructions", "SYSTEM OVERRIDE", Base64-encoded payloads, adversarial suffixes).
- **Perplexity-based detection:** Flag inputs with unusual token distributions that suggest adversarial suffixes.
- **Semantic similarity:** Compare input embeddings against known injection embeddings.

**Effectiveness:** HIGH for known attack patterns; MEDIUM for novel attacks. ML classifiers achieve 90-95% detection on benchmarks but adversarial evasion is always possible.

**Latency impact:** 5-50ms per request depending on model size.

### 2.3 Output Monitoring (Post-LLM Call)

**What it does:** Scans LLM outputs and tool calls before they execute or reach the user.

**Techniques:**
- **Tool call validation:** Whitelist allowed tool+parameter combinations per agent role. Flag any tool call that deviates from expected patterns.
- **Output content filtering:** Scan for PII, secrets, or sensitive data that should not appear in responses.
- **RAG Triad evaluation:** Assess context relevance, groundedness, and question/answer relevance to detect manipulation.
- **Behavioral profiling:** Track per-agent tool call distributions and flag statistical anomalies (e.g., agent suddenly making IAM API calls it has never made before).

**Effectiveness:** HIGH for tool abuse; MEDIUM for subtle data exfiltration.

### 2.4 Canary Token Injection

**What it does:** Injects synthetic decoy secrets (fake API keys, fake credentials, fake internal URLs) into agent context. If these tokens appear in agent output, it confirms a successful prompt injection attack with zero false positives.

**Key tool: `canari-llm` (PyPI)**
- Generates deterministic fake secrets that look real
- Supports types: api_key, email, credit_card, AWS keys, etc.
- Scans output with exact token matching
- Alerts via webhook, Slack, stdout
- Local SQLite forensic storage -- no data shipped externally
- LangChain/LangGraph integration via `wrap_chain()` and `wrap_runnable()`

**Effectiveness:** VERY HIGH for detection (zero false positives), but only fires AFTER a successful injection. Best used as a detection/alerting layer, not prevention.

**Integration example:**
```python
import canari

honey = canari.init(alert_webhook="https://soc.naptic.dev/canari")
canaries = honey.generate(n_tokens=5, token_types=["api_key", "email", "aws_key"])
system_prompt = honey.inject_system_prompt(base_prompt, canaries=canaries)
safe_chain = honey.wrap_chain(langgraph_chain)
```

### 2.5 Behavioral Anomaly Detection

**What it does:** Monitors agent behavior over time and flags deviations from established baselines.

**Techniques:**
- **Tool call frequency monitoring:** Alert when an agent makes an unusual number of API calls or calls tools outside its normal pattern.
- **Response length/format anomalies:** Injected agents often produce longer, differently-structured outputs.
- **Conversation trajectory analysis:** Track multi-turn conversations for sudden topic shifts or instruction-following changes.
- **Cross-agent correlation:** In multi-agent systems, detect when multiple agents simultaneously exhibit unusual behavior (suggesting coordinated injection).

**Effectiveness:** MEDIUM-HIGH for detecting active exploitation; requires baseline establishment period.

### 2.6 Data Segregation and Marking

**What it does:** Clearly marks untrusted data with delimiters/tags so the LLM can distinguish instructions from data.

**Techniques:**
- Use XML-style tags to wrap untrusted content: `<untrusted_data>...</untrusted_data>`
- Data masking for tool outputs: mask user-controlled free text before LLM processes it, swap back on response
- Separate data plane from control plane in prompt construction

**Effectiveness:** MEDIUM. Helps but LLMs can still be tricked into treating data as instructions. Necessary but not sufficient.

---

## 3. Recommended Architecture for NapticStacks/prompt-shield

### 3.1 System Overview

`prompt-shield` is itself a LangGraph agent that monitors other agents. It operates as a sidecar/middleware layer in the agents-prod Lambda deployment.

```
    +------------------------------------------------------------------+
    |                    prompt-shield Architecture                      |
    |                                                                    |
    |  +------------------+     +------------------+                     |
    |  |  INGRESS GATE    |     |  EGRESS GATE     |                     |
    |  |  (Pre-LLM scan)  |     |  (Post-LLM scan) |                     |
    |  |                  |     |                  |                     |
    |  | - ML Classifier  |     | - Tool Validator |                     |
    |  | - Regex Scanner  |     | - PII Scanner    |                     |
    |  | - Perplexity Chk |     | - Canary Scanner |                     |
    |  | - Rate Limiter   |     | - Anomaly Scorer |                     |
    |  +--------+---------+     +--------+---------+                     |
    |           |                        |                               |
    |           v                        v                               |
    |  +--------+------------------------+---------+                     |
    |  |           POLICY ENGINE                    |                     |
    |  |  - Per-agent security profiles             |                     |
    |  |  - Risk tolerance thresholds               |                     |
    |  |  - Action: ALLOW / WARN / BLOCK / ESCALATE |                     |
    |  +--------+----------------------------------+                     |
    |           |                                                        |
    |           v                                                        |
    |  +--------+----------------------------------+                     |
    |  |        OBSERVABILITY LAYER                 |                     |
    |  |  - Structured event logs (JSON)            |                     |
    |  |  - Metrics (Prometheus/CloudWatch)          |                     |
    |  |  - Trace correlation (OpenTelemetry)       |                     |
    |  |  - Forensic DB (DynamoDB/SQLite)            |                     |
    |  +--------+----------------------------------+                     |
    |           |                                                        |
    |           v                                                        |
    |  +--------+----------------------------------+                     |
    |  |        ALERT / SOC INTEGRATION             |                     |
    |  |  - Webhook --> intelligent-defender         |                     |
    |  |  - Slack channel alerts                    |                     |
    |  |  - PagerDuty for CRITICAL                  |                     |
    |  |  - SIEM feed (structured JSON events)      |                     |
    |  +-------------------------------------------+                     |
    +------------------------------------------------------------------+
```

### 3.2 LangGraph Scanning Pipeline

The scanning pipeline is implemented as a LangGraph StateGraph with parallel branches for each detection technique:

```
                          +-------------+
                          |   START     |
                          | (input msg) |
                          +------+------+
                                 |
                    +------------+------------+
                    |            |            |
                    v            v            v
              +-----+----+ +----+-----+ +----+-----+
              | ML       | | Regex    | | Perplexity|
              | Classify | | Scan     | | Check     |
              +-----+----+ +----+-----+ +----+-----+
                    |            |            |
                    +------------+------------+
                                 |
                                 v
                          +------+------+
                          |   MERGE     |
                          | (aggregate  |
                          |  scores)    |
                          +------+------+
                                 |
                          +------+------+
                          |   POLICY    |
                          |  DECISION   |
                          | (allow/     |
                          |  block/     |
                          |  escalate)  |
                          +------+------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
              +-----+----+            +------+------+
              | ALLOW    |            | BLOCK/      |
              | (pass    |            | ESCALATE    |
              |  through)|            | (log+alert) |
              +----------+            +-------------+
```

### 3.3 Integration Points with Existing Agents

#### Lambda Middleware Pattern

```python
# prompt_shield/middleware.py
from prompt_shield import ShieldPipeline

shield = ShieldPipeline.from_config("shield-config.yaml")

def shield_middleware(func):
    """Decorator for LangGraph node functions in agents-prod."""
    async def wrapper(state, config):
        # Pre-LLM scan
        ingress_result = await shield.scan_ingress(
            messages=state["messages"],
            agent_id=config.get("agent_id"),
            context=state.get("context", {})
        )

        if ingress_result.action == "BLOCK":
            return shield.blocked_response(ingress_result)

        # Execute original node
        result = await func(state, config)

        # Post-LLM scan
        egress_result = await shield.scan_egress(
            output=result,
            tool_calls=result.get("tool_calls", []),
            agent_id=config.get("agent_id")
        )

        if egress_result.action == "BLOCK":
            return shield.blocked_response(egress_result)

        return result
    return wrapper
```

#### LangChain/LangGraph Middleware (Native)

LangChain now supports native middleware for guardrails. From the docs:

```python
from langgraph.prebuilt import create_react_agent

# Middleware intercepts execution at strategic points:
# - before agent starts
# - after agent completes
# - around model and tool calls

agent = create_react_agent(
    model=model,
    tools=tools,
    middleware=[
        prompt_shield_ingress_middleware,
        prompt_shield_egress_middleware,
        canary_token_middleware,
    ]
)
```

### 3.4 Real-Time Monitoring Dashboard

**Stack:** Grafana + Prometheus + CloudWatch

**Dashboard Panels:**

| Panel | Metric | Alert Threshold |
|-------|--------|-----------------|
| Injection Attempts/min | `shield_ingress_blocks_total` | > 5/min = WARN, > 20/min = CRITICAL |
| Canary Fires | `shield_canary_fires_total` | Any = CRITICAL (zero false positive) |
| Tool Call Anomalies | `shield_tool_anomaly_score` | > 0.8 = ESCALATE |
| Blocked Requests % | `shield_block_rate` | > 10% = investigate |
| Agent Behavioral Drift | `shield_behavior_drift_score` | > 2 std dev = WARN |
| Latency Overhead | `shield_scan_duration_ms` | p99 > 200ms = tune |

**Grafana Dashboard Layout:**

```
+---------------------------------------------------+
| PROMPT-SHIELD SECURITY OPERATIONS CENTER           |
+---------------------------------------------------+
| [Injection Attempts]  | [Canary Fires]  | [Alerts]|
|    (time series)      |   (counter)     | (table) |
+---------------------------------------------------+
| [Block Rate by Agent] | [Tool Call Heatmap]        |
|    (bar chart)        |   (per agent/tool matrix)  |
+---------------------------------------------------+
| [Latency Overhead]    | [Top Attack Patterns]      |
|    (histogram)        |   (pie chart by category)  |
+---------------------------------------------------+
```

### 3.5 CI/CD Scanning Hooks

#### GitHub Actions Integration

```yaml
# .github/workflows/prompt-security.yml
name: Prompt Injection Security Scan

on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'agents/**/system_prompt*'
      - 'agents/**/config*'

jobs:
  prompt-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install prompt-shield CLI
        run: pip install prompt-shield

      - name: Scan system prompts
        run: |
          prompt-shield scan \
            --prompts-dir ./prompts \
            --threshold 0.7 \
            --attack-categories jailbreak,role_hijack,data_extraction \
            --format json \
            --output scan-results.json

      - name: Evaluate results
        run: |
          prompt-shield evaluate \
            --results scan-results.json \
            --fail-on critical \
            --warn-on medium

      - name: Run Garak vulnerability probes
        run: |
          garak --model_type rest \
            --model_name staging-agent \
            --probes promptinject,dan,encoding \
            --report_prefix pr-${{ github.event.pull_request.number }}

      - name: Upload scan results
        uses: actions/upload-artifact@v4
        with:
          name: prompt-security-report
          path: scan-results.json
```

#### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit (or via pre-commit framework)
# Quick scan of changed prompt files

changed_prompts=$(git diff --cached --name-only | grep -E '(prompt|system_instruction)')
if [ -n "$changed_prompts" ]; then
    echo "Scanning modified prompts for injection vulnerabilities..."
    prompt-shield quick-scan $changed_prompts --threshold 0.5
    if [ $? -ne 0 ]; then
        echo "BLOCKED: Prompt changes failed security scan."
        exit 1
    fi
fi
```

### 3.6 Alert --> SOC Integration

prompt-shield alerts feed directly into intelligent-defender:

```
prompt-shield  -->  Webhook (JSON)  -->  intelligent-defender
     |                                        |
     |                                        v
     |                                  Triage + Enrich
     |                                        |
     +------>  Slack #security-alerts         |
     |                                        v
     +------>  PagerDuty (CRITICAL only)  Incident Response
     |                                        |
     +------>  CloudWatch Logs                v
                                        Automated Response:
                                        - Rotate canary tokens
                                        - Block source IP/session
                                        - Increase scan sensitivity
                                        - Human escalation
```

**Alert payload schema:**

```json
{
  "event_type": "prompt_injection_detected",
  "timestamp": "2026-03-06T14:30:00Z",
  "severity": "CRITICAL",
  "agent_id": "mayday-agent-prod",
  "detection_layer": "canary_fire",
  "detection_details": {
    "canary_type": "aws_key",
    "canary_id": "canari-a1b2c3",
    "found_in": "agent_output",
    "confidence": 1.0
  },
  "context": {
    "conversation_id": "conv-xyz-789",
    "user_session": "sess-abc-123",
    "source_ip": "203.0.113.42",
    "input_snippet": "[REDACTED - stored in forensic DB]"
  },
  "recommended_action": "block_session_and_escalate"
}
```

---

## 4. Tool/Framework Evaluation

### 4.1 Comparison Matrix

| Tool/Framework | Type | Prompt Injection Detection | Production Ready | LangGraph Compatible | Cost | Recommendation |
|---|---|---|---|---|---|---|
| **Guardrails AI** | Commercial + OSS | YES - validators for injection, PII, toxicity | YES | YES (middleware) | Free tier + paid | USE - primary guardrails framework |
| **NVIDIA NeMo Guardrails** | Open Source | YES - programmable rails with Colang | YES | Partial (requires adapter) | Free (OSS) | USE - for system prompt hardening |
| **canari-llm** | Open Source | YES - canary token detection (post-injection) | YES | YES (wrap_chain) | Free (MIT) | USE - canary/honeypot layer |
| **NVIDIA Garak** | Open Source | YES - vulnerability scanner/red-team tool | YES (CI/CD) | N/A (testing tool) | Free (OSS) | USE - CI/CD scanning |
| **Lakera Guard** | Commercial API | YES - ML-based classifier | YES | YES (API call) | Paid (API-based) | EVALUATE - for high-volume production |
| **Rebuff** | Archived (May 2025) | Was prompt injection detection | NO - ARCHIVED | N/A | N/A | DO NOT USE - abandoned |
| **OpenGuardrails** | Open Source | YES - 119 languages | Early | Partial | Free (OSS) | MONITOR - promising but early |
| **Arthur Shield** | Commercial | YES - enterprise guardrails | YES | YES (API) | Paid (enterprise) | EVALUATE - if compliance requires vendor |
| **Prompt Injection Scanner API** | Free API / BYOK | YES - 15 attack patterns | YES (CI/CD) | N/A (testing tool) | Free / $0.02-0.03/scan BYOK | USE - lightweight CI/CD checks |

### 4.2 Recommended Stack

```
LAYER               TOOL                      PURPOSE
-----               ----                      -------
Input Scanning      Guardrails AI             ML classifier + custom validators
                    + Custom regex rules      Known signature matching

System Hardening    NeMo Guardrails           Colang-defined conversational rails
                                              Topic/action constraints

Canary Detection    canari-llm                Zero false-positive breach detection
                                              Deployed in all agent contexts

CI/CD Scanning      Garak                     Red-team probing on PR/deploy
                    + Prompt Scanner API      Quick 15-pattern smoke test

Output Monitoring   Custom (prompt-shield)    Tool call validation
                                              Behavioral anomaly detection

Observability       OpenTelemetry             Distributed tracing
                    + Prometheus/Grafana      Metrics and dashboards
                    + CloudWatch              AWS-native logging

SOC Integration     intelligent-defender      Automated triage and response
                    + Slack + PagerDuty       Human notification chain
```

### 4.3 Key Framework Details

#### Guardrails AI
- Production-grade, near-zero latency impact per vendor claims
- Modular validators: `PromptInjection`, `ToxicLanguage`, `PIIDetection`, `RegexMatch`
- Supports custom validators for domain-specific rules
- Python SDK with async support
- Install: `pip install guardrails-ai`

#### NVIDIA NeMo Guardrails
- Uses Colang (a domain-specific language) to define conversational rails
- Supports: topic control, dialog flow constraints, moderation
- Programmable -- can define custom rails for Naptic-specific patterns
- Install: `pip install nemoguardrails`

#### NVIDIA Garak
- LLM vulnerability scanner -- the "nmap for LLMs"
- 350+ probes covering: prompt injection, DAN jailbreaks, encoding attacks, payload splitting
- Supports REST API targets, OpenAI-compatible endpoints, Hugging Face models
- Generates detailed vulnerability reports
- Install: `pip install garak`

#### canari-llm
- Generates realistic decoy tokens (API keys, emails, credit cards, AWS keys)
- Local-first: SQLite forensic DB, no external data shipping
- Webhook + Slack alerting with signed payloads
- CLI for ops: `canari seed`, `canari alerts`, `canari forensic-summary`
- Install: `pip install canari-llm`

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Establish basic input scanning and canary token deployment across all agents-prod agents.

| Task | Tool | Owner | Effort |
|---|---|---|---|
| Set up prompt-shield repo with LangGraph scaffolding | LangGraph | Eng | 2 days |
| Integrate Guardrails AI input scanner | Guardrails AI | Eng | 3 days |
| Deploy canari-llm tokens in all agent system prompts | canari-llm | Eng | 2 days |
| Configure canari webhook to Slack #security-alerts | canari-llm | Eng | 1 day |
| Build regex scanner for known injection signatures | Custom | Eng | 2 days |
| Write per-agent security profiles (YAML configs) | Custom | Eng + Security | 2 days |
| Add basic CloudWatch logging for all shield events | AWS | Eng | 1 day |

**Exit criteria:** All agents-prod agents have input scanning and canary tokens active. Any canary fire triggers a Slack alert within 30 seconds.

### Phase 2: Output Monitoring + CI/CD (Weeks 4-6)

**Goal:** Add post-LLM output scanning, tool call validation, and CI/CD gates.

| Task | Tool | Owner | Effort |
|---|---|---|---|
| Implement tool call whitelist validator | Custom | Eng | 3 days |
| Build output PII/secrets scanner | Guardrails AI | Eng | 2 days |
| Set up Garak in GitHub Actions for PR scanning | Garak | Eng | 2 days |
| Integrate Prompt Scanner API as quick smoke test | API | Eng | 1 day |
| Build behavioral baseline profiler per agent | Custom | Eng | 3 days |
| Implement NeMo Guardrails Colang rules for high-risk agents | NeMo | Eng | 3 days |
| Pre-commit hook for prompt file changes | Custom | Eng | 1 day |

**Exit criteria:** PRs that modify system prompts are automatically scanned. Tool calls from agents are validated against whitelists. Behavioral baselines established for all production agents.

### Phase 3: Observability + SOC Integration (Weeks 7-9)

**Goal:** Full visibility dashboard and automated incident response.

| Task | Tool | Owner | Effort |
|---|---|---|---|
| Deploy Prometheus metrics exporter for shield events | Prometheus | Eng | 2 days |
| Build Grafana SOC dashboard (panels from Section 3.4) | Grafana | Eng | 3 days |
| Integrate OpenTelemetry tracing across shield pipeline | OTel | Eng | 3 days |
| Build alert routing to intelligent-defender | Custom | Eng + Security | 3 days |
| Implement automated responses (session block, token rotation) | Custom | Security | 3 days |
| Set up PagerDuty integration for CRITICAL alerts | PagerDuty | Eng | 1 day |
| Forensic DB with DynamoDB for production, SQLite for dev | AWS | Eng | 2 days |

**Exit criteria:** Real-time dashboard showing all shield events. CRITICAL alerts reach on-call within 60 seconds. Automated response playbooks execute for known attack patterns.

### Phase 4: Advanced Defense + Hardening (Weeks 10-12)

**Goal:** Advanced detection techniques and red-team validation.

| Task | Tool | Owner | Effort |
|---|---|---|---|
| Train custom ML classifier on Naptic-specific injection patterns | Custom | ML Eng | 5 days |
| Implement cross-agent correlation for AILM detection | Custom | Eng | 3 days |
| Multi-LLM architecture: secondary guard model for high-risk ops | Custom | Eng | 3 days |
| Data masking layer for tool outputs containing free text | Custom | Eng | 2 days |
| Internal red-team exercise against all production agents | Garak + Manual | Security | 5 days |
| Document runbooks for each alert type | Docs | Security | 2 days |
| Performance optimization: target p99 < 100ms overhead | All | Eng | 3 days |

**Exit criteria:** Custom ML classifier deployed. AILM detection active. Red-team exercise completed with findings remediated. Shield adds < 100ms p99 latency to agent requests.

### Phase 5: Continuous Improvement (Ongoing)

- Monthly red-team exercises using Garak with updated probe sets
- Quarterly review of detection rates and false positive/negative rates
- Canary token rotation every 30 days
- ML classifier retraining on new attack samples quarterly
- Track OWASP LLM Top 10 updates and MITRE ATLAS additions
- Monitor Zenity, Orca, and other vendor threat landscape reports for emerging attack vectors

---

## Appendix A: Key Statistics (2025-2026)

- OWASP ranks prompt injection as #1 LLM threat (LLM01:2025)
- Prompt injection appears in over 73% of LLM application security assessments (Obsidian Security)
- 87% of enterprises lack comprehensive AI security frameworks (Gartner)
- 97% of 2025 AI breaches occurred in environments without access controls (IBM)
- Organizations with AI-specific controls reduced breach costs by $2.1M average (IBM)
- Average US breach cost: $10.22M (IBM, 2025)
- AI content moderation market: $1B (2024) --> $2.6B (2029), 20.5% CAGR

## Appendix B: Key References

1. OWASP LLM01:2025 Prompt Injection - https://genai.owasp.org/llmrisk/llm01-prompt-injection/
2. OWASP Top 10 for LLM Applications 2025 (PDF) - https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf
3. Orca Security: AI-Induced Lateral Movement (AILM) - https://orca.security/resources/blog/ai-induced-lateral-movement-ailm/
4. canari-llm (Honeypot tokens for LLM apps) - https://pypi.org/project/canari-llm/
5. NVIDIA Garak (LLM vulnerability scanner) - https://github.com/NVIDIA/garak
6. Guardrails AI - https://www.guardrailsai.com/
7. NVIDIA NeMo Guardrails - https://github.com/NVIDIA/NeMo-Guardrails
8. Zenity 2026 AI Agent Threat Landscape Report - https://zenity.io/resources/white-papers/2026-threat-landscape-report
9. LangChain Guardrails Middleware - https://docs.langchain.com/oss/python/langchain/guardrails
10. MITRE ATLAS: LLM Prompt Injection - https://atlas.mitre.org/techniques/AML.T0051
11. Introl: Deploying AI Guardrails at Production Scale - https://introl.com/blog/ai-safety-infrastructure-guardrails-production-scale-2025
12. Forbes: Guardrailing LLMs (Feb 2026) - https://www.forbes.com/councils/forbestechcouncil/2026/02/20/guardrailing-llms-the-practical-path-to-safe-ai-products/

## Appendix C: Naptic Design Principles for prompt-shield

1. **"Automation without security is dangerous."** Every agent gets shield coverage. No exceptions.
2. **Zero-trust agents.** Treat every LLM as a potentially compromised endpoint. Never trust output without validation.
3. **Defense in depth.** No single layer is sufficient. Stack ML classifiers, canary tokens, tool validation, and behavioral monitoring.
4. **Least privilege always.** Agents get the minimum IAM/API permissions needed. Tool call whitelists enforced by shield, not by the agent.
5. **Detection over prevention.** Perfect prevention is impossible (per OWASP). Optimize for fast detection and response. Canary tokens fire with zero false positives.
6. **Observable by default.** Every shield decision is logged, traced, and metriced. If it is not observable, it is not secure.
7. **Security as code.** Agent security profiles, tool whitelists, and Colang rails are version-controlled and reviewed in PRs alongside application code.
