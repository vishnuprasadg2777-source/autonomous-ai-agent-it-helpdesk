# System Architecture – Review 2
## Project
**Autonomous AI Agent for IT Helpdesk**
## 1. Architecture Overview
The proposed system is designed as a controlled autonomous IT-helpdesk architecture.
The architecture combines:
- Request understanding
- Priority and severity assessment
- Enterprise Knowledge Retrieval (RAG)
- IT State / World Model
- LLM reasoning and planning
- Candidate plan evaluation
- Policy, authorization and risk checking
- Skill / workflow selection
- Controlled tool execution
- Observation
- Verification
- Resolution, re-planning or human escalation
---
## 2. Overall Architecture
```text
                    ┌──────────────────────┐
                    │   User / Employee    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Helpdesk UI / API    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Request Processing    │
                    │ + Ticket Management   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Priority / Severity   │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
       ┌────────────────────┐      ┌────────────────────┐
       │ Enterprise         │      │ IT State /         │
       │ Knowledge / RAG    │      │ World Model        │
       └─────────┬──────────┘      └─────────┬──────────┘
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ LLM Reasoning &      │
                    │ Planning              │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Candidate Plan        │
                    │ Evaluation             │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Policy + Authorization│
                    │ + Risk Check          │
                    └──────────┬───────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                  DENIED              APPROVED
                     │                   │
                     ▼                   ▼
              ┌─────────────┐   ┌────────────────────┐
              │ Audit /     │   │ Skill / Workflow   │
              │ Escalation  │   │ Selection          │
              └─────────────┘   └─────────┬──────────┘
                                          │
                                          ▼
                               ┌────────────────────┐
                               │ Controlled Tool     │
                               │ Gateway             │
                               └─────────┬──────────┘
                                         │
                                         ▼
                               ┌────────────────────┐
                               │ IT Service /        │
                               │ Controlled          │
                               │ Environment         │
                               └─────────┬──────────┘
                                         │
                                         ▼
                               ┌────────────────────┐
                               │ Observe Result      │
                               └─────────┬──────────┘
                                         │
                                         ▼
                               ┌────────────────────┐
                               │ Verify Expected vs  │
                               │ Actual State        │
                               └─────────┬──────────┘
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                            MATCH                MISMATCH
                              │                     │
                              ▼                     ▼
                       ┌────────────┐       ┌──────────────┐
                       │ Resolve    │       │ Re-plan OR   │
                       │ Ticket     │       │ Escalate     │
                       └────────────┘       └──────────────┘

⸻

3. Core Architecture Layers

Layer 1 – User and Request Layer

The user submits an IT helpdesk request through the UI or API.

Responsibilities:

* Accept request
* Authenticate user
* Create ticket
* Capture request context
* Track ticket status

⸻

Layer 2 – Request Processing

This layer processes the incoming request.

Responsibilities:

* Identify request type
* Extract entities
* Determine relevant service
* Determine priority/severity
* Identify missing information

Example:

User:
"VPN is not connecting on my laptop."
Detected:
Request Type → VPN Troubleshooting
Service → VPN
Affected Device → User Laptop
Priority → Determined from context

⸻

Layer 3 – Enterprise Knowledge Retrieval

The RAG layer retrieves relevant enterprise information.

Possible knowledge sources:

* IT policies
* Troubleshooting guides
* Standard operating procedures
* Approved workflows
* Service documentation
* Access policies
* Escalation procedures

The retrieved information is provided as evidence to the reasoning layer.

⸻

Layer 4 – IT State / World Model

The World Model represents the relevant state of the IT environment.

Possible entities include:

User
Account
Device
Application
Service
Permission
Ticket
Workflow

Example state:

User: Vishnu
VPN Service: Available
User VPN Status: Disconnected
Device: Laptop-001
Account Status: Active

The World Model allows the agent to reason about actions and expected state changes.

⸻

4. State Transition Model

Current State
      │
      ▼
Proposed Action
      │
      ▼
Expected State
      │
      ▼
Controlled Execution
      │
      ▼
Observed State
      │
      ▼
Compare
      │
 ┌────┴────┐
 │         │
Match    Mismatch
 │         │
 ▼         ▼
Resolve   Re-plan /
          Escalate

Example:

Current:
VPN = Disconnected
Action:
Restart VPN connection
Expected:
VPN = Connected
Observed:
VPN = Connected
Result:
Verified Resolution

⸻

5. Reasoning and Planning Layer

The LLM receives:

* User request
* User context
* Retrieved enterprise knowledge
* Current IT state
* Available workflows
* Relevant constraints

The reasoning layer determines:

* Possible causes
* Required information
* Candidate actions
* Candidate resolution plans
* Expected outcomes

The LLM proposes plans but does not receive unrestricted execution authority.

⸻

6. Candidate Plan Evaluation

Multiple possible plans can be evaluated before execution.

Example:

Request:
VPN not connecting
Candidate Plan A:
Restart VPN client
Candidate Plan B:
Check account status
Candidate Plan C:
Reset VPN configuration

The system evaluates plans using:

* Relevance
* Knowledge evidence
* Current state
* Preconditions
* Expected outcome
* Authorization
* Risk
* Workflow availability

The safest appropriate authorized plan is selected.

⸻

7. Policy, Authorization and Risk Layer

This layer forms the primary execution control boundary.

It checks:

Is the user authorized?
        ↓
Is the action permitted?
        ↓
Is the tool permitted?
        ↓
Is required approval available?
        ↓
Is the risk acceptable?

Possible outcomes:

APPROVED
    ↓
Execute
DENIED
    ↓
Do Not Execute
    ↓
Audit / Escalate
HIGH RISK
    ↓
Human Approval / Escalation

⸻

8. Skill / Workflow Layer

Approved actions are mapped to predefined workflows.

Initial workflows:

VPN Troubleshooting
Password Reset
Software Installation / Approval
Access Request

A workflow can define:

* Required inputs
* Preconditions
* Allowed tools
* Execution sequence
* Expected state
* Verification conditions
* Escalation conditions

⸻

9. Controlled Tool Gateway

The agent does not directly access infrastructure.

Instead:

LLM
 ↓
Approved Plan
 ↓
Policy / Authorization
 ↓
Controlled Tool Gateway
 ↓
Tool / API
 ↓
IT Environment

The gateway provides a controlled interface between the agent and the IT environment.

The initial academic implementation will use simulated or controlled tools.

⸻

10. Observation Layer

After execution, the system records the result.

Possible observations:

* API response
* Tool status
* Service status
* Account status
* Device status
* Permission status
* Ticket state
* Error information

The result becomes evidence for verification.

⸻

11. Verification Layer

Verification compares the intended state with the observed state.

Expected State
      +
Observed State
      ↓
Verification

Successful result

Expected = Actual
       ↓
Verified
       ↓
Resolve

Failed result

Expected ≠ Actual
       ↓
Not Verified
       ↓
Re-plan OR Escalate

⸻

12. Resolution and Escalation

The system has three main outcomes.

Outcome 1 – Resolve

The expected state is achieved.

Outcome 2 – Re-plan

The expected state was not achieved, but another safe and authorized plan is available.

Outcome 3 – Human Escalation

Escalation occurs when:

* Action is unauthorized
* Action is high risk
* Required information is unavailable
* No approved workflow exists
* Tool execution fails
* Verification fails
* The agent cannot safely determine the next action

⸻

13. Audit and Monitoring

Important system events are recorded.

Examples:

Ticket Created
Knowledge Retrieved
Plan Generated
Plan Selected
Policy Checked
Authorization Checked
Tool Executed
Observation Recorded
Verification Completed
Ticket Resolved
Ticket Escalated

This supports traceability and later evaluation.

⸻

14. Initial Architecture Scope

The first implementation will use:

User
 ↓
Ticket API
 ↓
LLM
 ↓
RAG
 ↓
World Model
 ↓
Planning
 ↓
Policy
 ↓
Mock Tools
 ↓
Verification
 ↓
Resolution / Escalation

Production enterprise infrastructure will not be directly modified during the initial academic prototype.

⸻

15. Architecture-to-Literature Mapping

Architecture Component	Literature Basis
IT Service Desk	Papers 1–3
Knowledge Management	Paper 2
ITSM Workflow	Paper 3
Adaptive Agents	Paper 4
Privacy / Tool Security	Paper 5
Goal-Directed Agent Behaviour	Paper 6
Deeper Reasoning	Paper 7
Causal World Model	Paper 8
Agentic Information Gathering	Paper 9
Enterprise Workflow Automation	Paper 10

⸻

16. Proposed Architecture Principle

The central design principle is:

The LLM reasons and proposes; deterministic controls decide what may execute; tools execute approved actions; the system observes and verifies the result.

This separates intelligence from unrestricted operational authority and supports controlled autonomy for enterprise IT helpdesk workflows.
