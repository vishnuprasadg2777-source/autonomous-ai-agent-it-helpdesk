# Review 2 Presentation
## Autonomous AI Agent for IT Helpdesk
### Slide 1 – Title
**Autonomous AI Agent for IT Helpdesk**
CSS7102 – Mini Project  
Review 2 (CA-02)
**Team:** CAI_28
**Guide:** Mr. Parth Naik
Vishnu Prasad Gotur — 20221CAI0154  
Shivaraj — 20231CAI0139
---
## Slide 2 – Problem Statement
### PSAIAC_60
> IT teams spend 40% of time on repetitive L1 tickets. Industry needs an autonomous AI agent that resolves password resets, software installs, and access requests without human involvement.
### Problem
Traditional helpdesk workflows require human intervention for many repetitive Level-1 requests.
The proposed system investigates controlled autonomous resolution of suitable repetitive IT support requests.
---
## Slide 3 – Objectives
- Understand natural-language IT helpdesk requests.
- Retrieve relevant enterprise knowledge using RAG.
- Represent relevant IT state using a World Model.
- Perform LLM reasoning and planning.
- Evaluate candidate resolution plans.
- Apply policy, authorization and risk controls.
- Execute approved workflows through controlled tools.
- Verify expected versus actual IT state.
- Resolve, re-plan or escalate requests.
---
## Slide 4 – Existing Methods and Drawbacks
### Existing approaches
- Traditional IT service-desk processes
- Knowledge-management systems
- Machine-learning-based helpdesk approaches
- LLM-based assistants
- Tool-using AI agents
### Limitations
- Limited autonomous multi-step resolution
- Knowledge may not be grounded in enterprise context
- Reasoning and execution may be separated
- Tool access introduces security and authorization risks
- Successful tool execution does not guarantee successful resolution
- Human escalation and verification need to be explicitly controlled
---
## Slide 5 – Literature Survey
### Final 10 Papers
1. IT Service Desk Model Literature Review: Benefits and Challenges
2. Identifying Knowledge Management Challenges in a Service Desk: A Case Study
3. Analysis of COBIT 5 Process “DSS02 - Manage Service Requests and Incidents” for the Service Desk Using Process Mining
4. Self-Adaptive Large Language Model (LLM)-Based Multiagent Systems
5. PrivacyAsst: Safeguarding User Privacy in Tool-Using Large Language Model Agents
6. SIMA 2: A Generalist Embodied Agent for Virtual Worlds
7. Evolving Deeper LLM Thinking
8. Robust Agents Learn Causal World Models
9. BrowseComp: A Benchmark for Browsing Agents
10. How Agents Are Transforming Work
---
## Slide 6 – Literature Areas
The selected literature covers:
- IT service-desk processes
- Service-desk knowledge management
- ITSM workflows
- Autonomous and adaptive agents
- Privacy and secure tool use
- Goal-directed agent behaviour
- Advanced LLM reasoning
- Causal World Models
- Agentic information gathering
- Enterprise workflow automation
---
## Slide 7 – Research Gap
The literature provides complementary capabilities but does not provide the complete proposed controlled Level-1 IT helpdesk workflow.
### Proposed integration
```text
Priority / Severity
        ↓
Enterprise Knowledge Retrieval (RAG)
        ↓
IT State / World Model
        ↓
LLM Reasoning & Planning
        ↓
Candidate Plan Evaluation
        ↓
Policy + Authorization + Risk Check
        ↓
Skill / Workflow Selection
        ↓
Controlled Tool Execution
        ↓
Observe Result
        ↓
Verify Expected vs Actual State
        ↓
Resolve / Re-plan / Escalate

⸻

Slide 8 – Proposed Architecture

User / Employee
       ↓
Helpdesk UI / API
       ↓
Request Processing
       ↓
Priority / Severity
       ↓
 ┌───────────────┬─────────────────┐
 ↓               ↓
Enterprise       IT State /
Knowledge/RAG    World Model
 └───────────────┬─────────────────┘
                 ↓
        LLM Reasoning & Planning
                 ↓
       Candidate Plan Evaluation
                 ↓
       Policy + Authorization
             + Risk
                 ↓
       Skill / Workflow Selection
                 ↓
        Controlled Tool Gateway
                 ↓
        IT Service Environment
                 ↓
          Observe Result
                 ↓
   Verify Expected vs Actual State
                 ↓
       Resolve / Re-plan /
             Escalate

⸻

Slide 9 – Core Modules

1. Request & Ticket Manager
2. Intent & Entity Layer
3. Enterprise Knowledge / RAG
4. IT State / World Model
5. Agent Orchestrator
6. Candidate Plan Evaluator
7. Policy / Authorization / Risk Layer
8. Skill / Workflow Manager
9. Controlled Tool Gateway
10. Verification & Escalation
11. Audit & Logging

⸻

Slide 10 – IT State / World Model

The World Model represents relevant IT state.

Possible entities

* User
* Account
* Device
* Application
* Service
* Permission
* Ticket
* Workflow

Example

Current State:
VPN = Disconnected
Proposed Action:
Restart VPN connection
Expected State:
VPN = Connected
Observed State:
VPN = Connected
Result:
Verified Resolution

The model supports reasoning about actions and expected effects.

⸻

Slide 11 – Reasoning and Planning

The agent receives:

* User request
* User context
* Retrieved enterprise knowledge
* Relevant IT state
* Available workflows
* Constraints

The LLM reasons about:

* Possible causes
* Required information
* Available actions
* Candidate resolution plans
* Expected outcomes

The proposed system evaluates candidate plans before execution.

⸻

Slide 12 – Policy and Controlled Execution

The LLM does not receive unrestricted infrastructure access.

LLM
 ↓
Reasoning / Plan
 ↓
Candidate Plan Evaluation
 ↓
Policy
 ↓
Authorization
 ↓
Risk Check
 ↓
Controlled Tool
 ↓
IT Environment

Possible outcomes

Approved → Execute

Denied → Audit / Escalate

High Risk / Ambiguous → Human Approval / Escalation

⸻

Slide 13 – Observation and Verification

The system does not assume that successful tool execution means successful resolution.

Expected State
      +
Observed State
      ↓
Verification

Match

Expected = Actual
       ↓
Resolve

Mismatch

Expected ≠ Actual
       ↓
Re-plan / Escalate

⸻

Slide 14 – Initial Use Cases

1. VPN Troubleshooting

Identify issue → retrieve knowledge → execute approved workflow → verify VPN state.

2. Password Reset

Authenticate/authorize → execute controlled reset workflow → verify completion.

3. Software Installation / Approval

Check policy and approval → select workflow → execute controlled installation → verify.

4. Access Request

Identify required access → verify authorization/approval → execute workflow → verify access state.

⸻

Slide 15 – Safety and Controlled Autonomy

The proposed architecture separates:

Reasoning

from

Execution Authority

The LLM proposes and reasons.

Deterministic controls determine what may execute.

Controlled tools execute approved actions.

The system observes and verifies the result.

Human escalation is available for unsafe, unauthorized, ambiguous or unsuccessful cases.

⸻

Slide 16 – Evaluation Methodology

Baseline 1

LLM Only

Baseline 2

LLM + RAG

Proposed System

LLM
+
RAG
+
IT State / World Model
+
Reasoning / Planning
+
Policy
+
Authorization
+
Controlled Tools
+
Verification

Metrics

* Intent accuracy
* Retrieval relevance
* Plan accuracy
* Tool-selection accuracy
* Policy compliance
* Workflow execution success
* Verified resolution rate
* Escalation accuracy
* Human intervention rate
* Response time

⸻

Slide 17 – Hardware and Software

Hardware

* Modern multi-core processor
* Minimum 8 GB RAM
* 16 GB recommended
* 20–30 GB minimum free storage
* Stable internet
* GPU optional for API-based LLM use

Software

* Python
* FastAPI
* React / Next.js
* PostgreSQL
* FAISS / Chroma
* LLM API or suitable local model
* Embeddings
* Git / GitHub
* Docker
* Pytest

⸻

Slide 18 – Implementation Roadmap

Project Foundation
        ↓
ITSM Ticket Module
        ↓
Enterprise Knowledge Base / RAG
        ↓
LLM Reasoning & Planning
        ↓
IT State / World Model
        ↓
Policy + Authorization + Risk
        ↓
Controlled Tools / Workflows
        ↓
Observation + Verification
        ↓
End-to-End Agent
        ↓
Testing & Evaluation

⸻

Slide 19 – Gantt / Project Timeline

Review 2

* Literature survey
* Research gap
* Proposed methodology
* Architecture
* Module design
* Feasibility
* Project planning

Review 3

* Algorithm details
* Core implementation
* RAG
* Reasoning/planning
* World Model
* Controlled tools
* Initial testing

Review 4

* Extended implementation
* Integration
* Testing
* Evaluation
* Performance analysis

Final

* Complete system
* Final report
* Demonstration
* Viva

⸻

Slide 20 – Expected Contribution

The project investigates the integration of:

Enterprise Knowledge
        +
IT State / World Model
        +
LLM Reasoning
        +
Planning
        +
Policy / Authorization
        +
Controlled Tool Execution
        +
Verification
        +
Human Escalation

The contribution is primarily architectural and integrative within the Level-1 IT helpdesk domain.

⸻

Slide 21 – Conclusion

The proposed Autonomous AI Agent for IT Helpdesk moves beyond simple conversational assistance toward controlled autonomous workflow execution.

The system combines:

* Enterprise knowledge
* IT state modelling
* LLM reasoning
* Planning
* Policy and authorization
* Controlled tools
* Verification
* Human escalation

The next stage is incremental implementation and experimental evaluation.
