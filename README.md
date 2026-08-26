# Autonomous AI Agent for IT Helpdesk

## Project Information

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

## Project Overview

The project proposes an autonomous AI agent for handling repetitive Level-1 IT helpdesk requests.

The proposed system focuses on suitable routine requests such as:

- Password resets
- Software installation requests
- Access requests
- VPN troubleshooting

The system is intended to combine:

- Enterprise knowledge retrieval
- IT state / World Model
- LLM reasoning and planning
- Candidate plan evaluation
- Policy and authorization checks
- Risk control
- Controlled workflow/tool execution
- Observation and verification
- Human escalation

The objective is to move beyond a conventional chatbot and investigate a controlled autonomous workflow for suitable IT helpdesk requests.

---

## Problem Statement

**PSAIAC_60**

> IT teams spend 40% of time on repetitive L1 tickets. Industry needs an autonomous AI agent that resolves password resets, software installs, and access requests without human involvement.

---

## AI Component

The project incorporates an AI-based autonomous agent for understanding IT helpdesk requests, retrieving relevant enterprise knowledge, reasoning about possible resolutions, selecting suitable workflows, executing controlled actions, and verifying the resulting IT state.

The LLM is used for natural-language understanding, reasoning and planning, while policy, authorization and controlled tool layers provide constraints around execution.

---

# Review 2 – CA-02

This repository contains the materials prepared for **CSS7102 Mini Project Review 2 (CA-02)**.

Review 2 focuses on the **literature and model design of the proposed work**.

## Review 2 Deliverables

- Abstract
- Objectives
- Literature survey
- Research gap
- Existing methods and drawbacks
- Proposed methodology
- Proposed system architecture
- Module description
- Hardware and software details
- Feasibility
- Initial use cases
- Project timeline / Gantt chart
- IEEE-style references
- Review-2 presentation

---

## Final Literature Direction

The Review 2 literature survey consists of the following ten selected papers:

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

These papers provide the literature foundation across:

- IT service-desk processes
- Knowledge management
- ITSM workflows
- Autonomous and adaptive agents
- Privacy and tool-use security
- Goal-directed agents
- LLM reasoning
- Causal World Models
- Agentic information gathering
- Enterprise/workflow automation

---

## Research Gap

The reviewed research provides important capabilities across IT service management, knowledge management, autonomous agents, reasoning, privacy, tool use, causal world models, information gathering and enterprise workflows.

However, these capabilities are not combined into a single controlled Level-1 IT helpdesk workflow in the proposed form.

The proposed research therefore investigates the integration of:

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

The proposed contribution is primarily architectural and integrative, rather than claiming that the individual technologies themselves are new.

Proposed System Architecture

The proposed system is organized around the following major components:
User / Helpdesk UI
        ↓
Request Processing
        ↓
Agent Controller
        ↓
Enterprise Knowledge / RAG
        +
IT State / World Model
        ↓
LLM Reasoning & Planning
        ↓
Candidate Plan Evaluation
        ↓
Policy + Authorization + Risk
        ↓
Skill / Workflow Manager
        ↓
Controlled Tool Gateway
        ↓
IT Service / Controlled Environment
        ↓
Observation
        ↓
Verification
        ↓
Resolve / Re-plan / Human Escalation
The architecture is designed so that the LLM does not receive unrestricted access to enterprise infrastructure.
Proposed Methodology

The proposed workflow is:
1. Receive IT Helpdesk Request
        ↓
2. Determine Priority / Severity
        ↓
3. Retrieve Relevant Enterprise Knowledge
        ↓
4. Inspect Relevant IT State / World Model
        ↓
5. Generate Reasoning and Candidate Plans
        ↓
6. Evaluate Candidate Plans
        ↓
7. Perform Policy, Authorization and Risk Checks
        ↓
8. Select an Approved Skill / Workflow
        ↓
9. Execute Through Controlled Tools
        ↓
10. Observe the Result
        ↓
11. Compare Expected vs Actual State
        ↓
12. Resolve / Re-plan / Escalate
Initial Use Cases

The initial project scope includes controlled Level-1 IT helpdesk scenarios such as:

1. VPN troubleshooting
2. Password reset
3. Software installation / approval
4. Access request

The initial prototype will use controlled or simulated IT tools rather than directly modifying production enterprise infrastructure.

⸻

Evaluation Direction

The proposed system will later be evaluated against simpler configurations.

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
Planned Evaluation Areas

* Intent / classification accuracy
* Knowledge retrieval relevance
* Plan accuracy
* Tool-selection accuracy
* Policy compliance
* Workflow execution success
* Verified resolution rate
* Escalation accuracy
* Human intervention rate
* Response time

No experimental performance results are claimed until implementation and testing are completed.

⸻

Hardware and Software

Hardware

* Modern multi-core processor
* Minimum 8 GB RAM
* 16 GB RAM recommended
* 20–30 GB minimum free storage
* 50 GB+ recommended
* Stable internet connection
* GPU optional when using an API-based LLM

Software

* Python
* FastAPI
* React / Next.js
* PostgreSQL
* Vector database / retrieval framework such as FAISS or Chroma
* LLM API or suitable local model
* Embedding model
* Git / GitHub
* Docker
* Pytest

⸻

Project Status

Current Stage: Review 2 (CA-02)

The current stage focuses on:

* Finalizing the literature survey
* Establishing the research gap
* Designing the proposed model
* Finalizing the system architecture
* Defining the system modules
* Defining the implementation roadmap
* Defining the evaluation methodology

Implementation will proceed incrementally after the model-design stage.

⸻

Development Roadmap
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

Repository Structure
01_CA1_Review/
├── PPT/
├── Problem_Statement/
├── Literature_Survey/
└── Documentation/

02_CA2_Review/
├── PPT/
├── Literature_Survey/
├── Research_Gap/
├── Proposed_Methodology/
├── System_Architecture/
├── Gantt_Chart/
└── Documentation/

03_CA3_Review/
├── PPT/
├── Source_Code/
├── Implementation/
├── Testing/
└── Documentation/

04_CA4_Review/
├── PPT/
├── Source_Code/
├── Implementation/
├── Testing/
└── Documentation/

src/
data/
tests/
docs/

Project Documentation

The repository will be progressively updated throughout the project with:

* Source code
* Research papers and literature analysis
* Architecture diagrams
* Documentation
* Datasets / controlled test data
* Testing materials
* Evaluation results
* Presentations
* Review-specific documentation

⸻

Safety and Controlled Autonomy

The proposed system is designed around controlled autonomous execution rather than unrestricted infrastructure access.

The LLM does not independently receive unrestricted permission to modify enterprise systems.

Policy, authorization, risk controls, controlled tools, verification, audit logging, and human escalation are included as part of the proposed architecture.

High-risk, unauthorized, ambiguous, or unsuccessful cases can be escalated to human IT support.

⸻

Research Contribution

The proposed work investigates an integrated architecture that combines:
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
The research contribution is primarily the integration and evaluation of these capabilities within a controlled autonomous IT helpdesk workflow.

⸻

Future Scope

Potential future extensions include:

* ServiceNow / Jira integration
* Enterprise identity and SSO integration
* Additional IT helpdesk workflows
* Larger IT World Models
* Advanced agent memory
* Multi-agent coordination
* Stronger enterprise security and monitoring
* Additional tool integrations
* Production pilot deployment

⸻

Project Progress

The repository will be updated after each project review.

Review 1

Completed:

* Project definition
* Problem statement
* Objectives
* Initial literature survey
* Initial research gap
* Proposed solution
* AI component
* SDG mapping
* Technology stack
* Hardware and software requirements
* Initial project timeline
* Review 1 presentation

Review 2

Current:

* Final literature survey
* Research gap refinement
* Proposed methodology
* System architecture
* Module design
* Hardware and software details
* Gantt chart
* Evaluation direction
* Review 2 presentation

Review 3

Planned:

* Algorithm details
* Source-code implementation
* Core agent modules
* Partial working implementation
* Testing
* Progress report

Review 4

Planned:

* Extended implementation
* Integration
* Testing and evaluation
* Completed major modules
* Updated documentation
* Final demonstration preparation

Final Viva

Planned:

* Complete implementation
* Final report
* Final presentation
* Live demonstration
* Evaluation results
* Final documentation
