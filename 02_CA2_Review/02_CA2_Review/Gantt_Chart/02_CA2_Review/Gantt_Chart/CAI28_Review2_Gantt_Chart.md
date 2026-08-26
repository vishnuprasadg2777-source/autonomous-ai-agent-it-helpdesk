# Review 2 – Main Documentation
## Autonomous AI Agent for IT Helpdesk
### Project Information
| Field | Details |
|---|---|
| Course | CSS7102 – Mini Project |
| Review | Review 2 (CA-02) |
| Project Title | Autonomous AI Agent for IT Helpdesk |
| Problem Statement | PSAIAC_60 |
| Team | CAI_28 |
| Project Guide | Mr. Parth Naik |
| Program Project Coordinator | Ms. Suma N G |
| School Project Coordinator | Dr. Sampath A K |
| HoD | Zafar Ali Khan |
## Team Members
- Vishnu Prasad Gotur — 20221CAI0154
- Shivaraj — 20231CAI0139
---
# 1. Abstract
The project proposes an autonomous AI agent for handling repetitive Level-1 IT helpdesk requests.
The proposed system focuses on suitable routine requests such as password resets, software installation requests, access requests, and VPN troubleshooting.
The system combines enterprise knowledge retrieval, IT state/world modelling, LLM reasoning and planning, candidate-plan evaluation, policy and authorization checks, controlled workflow execution, observation, verification, and human escalation.
The objective is to investigate a controlled autonomous workflow capable of resolving suitable Level-1 IT helpdesk requests while maintaining authorization, risk controls, verification, and human escalation.
---
# 2. Problem Statement
**PSAIAC_60**
> IT teams spend 40% of time on repetitive L1 tickets. Industry needs an autonomous AI agent that resolves password resets, software installs, and access requests without human involvement.
---
# 3. Objectives
The proposed project aims to:
1. Understand and classify natural-language Level-1 IT helpdesk requests.
2. Retrieve relevant enterprise knowledge using Retrieval-Augmented Generation (RAG).
3. Represent relevant IT state using an IT State / World Model.
4. Use LLM reasoning and planning to generate suitable resolution plans.
5. Evaluate candidate plans before execution.
6. Apply policy, authorization, and risk checks before actions are executed.
7. Select appropriate skills and workflows for approved requests.
8. Execute actions through controlled tools or APIs.
9. Observe and verify the resulting IT state.
10. Resolve, re-plan, or escalate the request depending on the verification result.
---
# 4. Existing Methods and Drawbacks
Existing IT helpdesk systems commonly depend on predefined service processes, knowledge bases, ticketing systems, and human support staff.
Machine-learning approaches can support classification and prediction but do not necessarily provide autonomous multi-step resolution.
Knowledge-management approaches improve access to service-desk information but do not independently reason and execute authorized actions.
LLM-based agents provide reasoning, planning, and tool-use capabilities but introduce challenges involving authorization, privacy, risk, hallucination, tool execution, and verification.
Therefore, a controlled architecture is required in which the LLM can reason and propose actions while policy and authorization mechanisms restrict actual execution.
---
# 5. Literature Survey
The Review 2 literature survey consists of the following final ten papers:
1. **IT Service Desk Model Literature Review: Benefits and Challenges**
2. **Identifying Knowledge Management Challenges in a Service Desk: A Case Study**
3. **Analysis of COBIT 5 Process “DSS02 - Manage Service Requests and Incidents” for the Service Desk Using Process Mining**
4. **Self-Adaptive Large Language Model (LLM)-Based Multiagent Systems**
5. **PrivacyAsst: Safeguarding User Privacy in Tool-Using Large Language Model Agents**
6. **SIMA 2: A Generalist Embodied Agent for Virtual Worlds**
7. **Evolving Deeper LLM Thinking**
8. **Robust Agents Learn Causal World Models**
9. **BrowseComp: A Benchmark for Browsing Agents**
10. **How Agents Are Transforming Work**
The detailed critical literature survey is maintained separately in:
```text
02_CA2_Review/Literature_Survey/
CAI28_Review2_Exact_Literature_Survey.docx

⸻

6. Research Gap

The reviewed literature provides complementary research across:

* IT service-desk processes
* Knowledge management
* ITSM workflows
* Autonomous and adaptive LLM agents
* Privacy and tool use
* Goal-directed agent behaviour
* Advanced reasoning
* Causal World Models
* Agentic information gathering
* Enterprise workflow automation

However, these capabilities are not combined into the complete controlled Level-1 IT helpdesk workflow proposed in this project.

The proposed research investigates the integration of:

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

The proposed contribution is primarily architectural and integrative.

⸻

7. Proposed Methodology

Step 1 – Request Understanding

The system receives a natural-language IT helpdesk request and identifies the request type, affected service, relevant entities, user context, and required information.

Step 2 – Priority / Severity

The system determines the relevant priority and severity based on the request and available IT service context.

Step 3 – Enterprise Knowledge Retrieval

Relevant enterprise knowledge is retrieved using RAG.

Possible knowledge sources include:

* IT policies
* Troubleshooting procedures
* Standard operating procedures
* Service documentation
* Approved workflows
* Escalation guidelines

Step 4 – IT State / World Model

The system represents relevant IT state including users, accounts, devices, applications, services, permissions, tickets, and workflows.

Step 5 – LLM Reasoning and Planning

The LLM receives the request, retrieved knowledge, and relevant IT state and generates possible reasoning paths and candidate resolution plans.

Step 6 – Candidate Plan Evaluation

Candidate plans are evaluated using evidence, current state, expected outcome, workflow constraints, authorization requirements, and risk.

Step 7 – Policy, Authorization and Risk

Before execution, the selected action is checked for authorization, policy compliance, required approval, and risk.

Step 8 – Skill / Workflow Selection

An approved request is mapped to an appropriate workflow.

Initial workflows include:

* VPN Troubleshooting
* Password Reset
* Software Installation / Approval
* Access Request

Step 9 – Controlled Tool Execution

Approved workflows interact with the IT environment through controlled tools or APIs.

Step 10 – Observation

The system observes the tool response and resulting IT state.

Step 11 – Verification

The system compares the expected state with the observed state.

Expected State
      +
Observed State
      ↓
Verification

Step 12 – Resolution / Re-planning / Escalation

If the expected state is achieved, the request can be resolved.

If the expected state is not achieved, the system may re-plan if a safe and authorized alternative exists or escalate to a human.

⸻

8. Proposed System Architecture

                    User / Employee
                           ↓
                    Helpdesk UI / API
                           ↓
                    Request Processing
                           ↓
                    Priority / Severity
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
     Enterprise Knowledge       IT State / World Model
             / RAG
              └────────────┬────────────┘
                           ↓
                 LLM Reasoning & Planning
                           ↓
                 Candidate Plan Evaluation
                           ↓
              Policy + Authorization + Risk
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
                  ┌────────┴────────┐
                  ↓                 ↓
               Resolve        Re-plan / Escalate

The LLM does not receive unrestricted access to enterprise infrastructure.

⸻

9. Core Modules

9.1 Request and Ticket Manager

Handles:

* Ticket creation
* User context
* Request information
* Ticket status
* Ticket history

9.2 Intent and Entity Layer

Identifies:

* Request type
* Service
* User
* Device
* Application
* Relevant entities

9.3 Enterprise Knowledge / RAG

Retrieves relevant policies, procedures, documentation, and troubleshooting information.

9.4 IT State / World Model

Represents the relevant state of the IT environment.

9.5 Agent Orchestrator

Coordinates reasoning, planning, knowledge retrieval, state information, and workflow selection.

9.6 Candidate Plan Evaluator

Evaluates possible plans before execution.

9.7 Policy / Authorization / Risk Layer

Controls whether an action is permitted.

9.8 Skill / Workflow Manager

Maps approved requests to predefined workflows.

9.9 Controlled Tool Gateway

Provides a controlled interface between the agent and IT tools or APIs.

9.10 Verification and Escalation

Checks whether the expected outcome was achieved and determines whether to resolve, re-plan, or escalate.

9.11 Audit and Logging

Records important system decisions and actions for traceability.

⸻

10. Initial Use Cases

The initial project scope includes:

1. VPN Troubleshooting

Identify VPN issues, retrieve troubleshooting knowledge, perform permitted actions, and verify the resulting VPN state.

2. Password Reset

Process an authorized password-reset request through a controlled workflow and verify completion.

3. Software Installation / Approval

Determine whether the requested software installation is permitted and route it through the appropriate approved workflow.

4. Access Request

Determine the required access, verify authorization and approval, and execute the permitted workflow.

The initial prototype will use controlled or simulated IT tools.

⸻

11. Safety and Controlled Autonomy

The architecture separates reasoning from unrestricted execution.

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
 ↓
Observation
 ↓
Verification

The system can deny or escalate actions that are:

* Unauthorized
* High risk
* Ambiguous
* Unsupported
* Not sufficiently verified

⸻

12. Evaluation Methodology

The proposed system will later be compared against simpler configurations.

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

Planned Metrics

* Intent / classification accuracy
* Retrieval relevance
* Plan accuracy
* Tool-selection accuracy
* Policy compliance
* Workflow execution success
* Verified resolution rate
* Escalation accuracy
* Human intervention rate
* Response time

No experimental results are claimed at the Review 2 stage.

⸻

13. Hardware Requirements

* Modern multi-core processor
* Minimum 8 GB RAM
* 16 GB RAM recommended
* 20–30 GB minimum free storage
* 50 GB+ recommended
* Stable internet connection
* GPU optional when using an API-based LLM

⸻

14. Software Requirements

* Python
* FastAPI
* React / Next.js
* PostgreSQL
* FAISS / Chroma or another retrieval/vector database
* LLM API or suitable local model
* Embedding model
* Git / GitHub
* Docker
* Pytest

⸻

15. Feasibility

Technical Feasibility

The system can be developed using established AI, web, database, retrieval, and API technologies.

Economic Feasibility

The academic prototype can initially use open-source software, controlled environments, and limited API resources.

Operational Feasibility

The system is designed for suitable Level-1 workflows and supports human escalation for cases that cannot be safely resolved.

Security Feasibility

Policy, authorization, risk controls, controlled tools, verification, and audit logging form the proposed execution boundary.

Implementation Feasibility

The system can be developed incrementally, allowing each component to be independently tested before end-to-end integration.

⸻

16. Project Timeline

The development roadmap is:

Review 2
Literature + Model Design
        ↓
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
        ↓
Review 3
        ↓
Review 4
        ↓
Final Implementation & Viva

The detailed Gantt chart is maintained separately in:

02_CA2_Review/Gantt_Chart/
CAI28_Review2_Gantt_Chart.md

⸻

17. Expected Contribution

The project investigates an integrated autonomous IT-helpdesk architecture combining:

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

The primary contribution is the integration and evaluation of these capabilities within a controlled Level-1 IT helpdesk workflow.

⸻

18. Limitations

The initial prototype will have the following limitations:

* Limited Level-1 use cases
* Controlled or simulated IT tools
* Limited IT-state representation
* Probabilistic LLM behaviour
* Limited enterprise integrations
* No direct production infrastructure modification during the initial prototype

⸻

19. Future Scope

Potential future extensions include:

* ServiceNow / Jira integration
* Enterprise identity and SSO integration
* Additional IT workflows
* Larger IT World Models
* Advanced agent memory
* Multi-agent coordination
* Stronger enterprise security and monitoring
* Additional enterprise tool integrations
* Production pilot deployment

⸻

20. Review 2 Status

Current Stage: Review 2 (CA-02)

The current stage focuses on:

* Final literature survey
* Research gap
* Proposed methodology
* System architecture
* Module design
* Feasibility
* Gantt chart
* Evaluation methodology
* Review 2 presentation

Implementation will proceed incrementally after the model-design stage.

⸻

21. Review 2 Repository Contents

02_CA2_Review/
│
├── PPT/
│   └── CAI28_Review2_Presentation.pptx
│
├── Literature_Survey/
│   └── CAI28_Review2_Exact_Literature_Survey.docx
│
├── Research_Gap/
│   └── CAI28_Review2_Research_Gap.md
│
├── Proposed_Methodology/
│   └── CAI28_Review2_Proposed_Methodology.md
│
├── System_Architecture/
│   └── CAI28_Review2_System_Architecture.md
│
├── Gantt_Chart/
│   └── CAI28_Review2_Gantt_Chart.md
│
└── Documentation/
    └── CAI28_Review2_Main_Documentation.md

⸻

22. Conclusion

The proposed Autonomous AI Agent for IT Helpdesk investigates controlled autonomous resolution of suitable Level-1 IT support requests.

The architecture combines enterprise knowledge retrieval, IT state/world modelling, LLM reasoning and planning, candidate-plan evaluation, policy and authorization, controlled tool execution, observation, verification, and human escalation.

The Review 2 work establishes the literature foundation, research gap, proposed methodology, architecture, modules, feasibility, and implementation roadmap required for the subsequent development and evaluation stages.


