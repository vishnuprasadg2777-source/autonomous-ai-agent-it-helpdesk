# Proposed Methodology – Review 2
## Project
**Autonomous AI Agent for IT Helpdesk**
## 1. Proposed Approach
The proposed system is an autonomous AI agent designed to handle suitable repetitive Level-1 IT helpdesk requests.
The methodology combines enterprise knowledge retrieval, IT state/world modelling, LLM reasoning and planning, candidate-plan evaluation, policy and authorization checks, controlled workflow execution, observation, verification, and human escalation.
## 2. Proposed Workflow
```text
IT Helpdesk Request
        ↓
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
┌───────────────────────────────┐
│ Expected State Achieved?      │
└───────────────────────────────┘
        ↓ YES             ↓ NO
     Resolve        Re-plan / Escalate

3. Stage 1 – Request Understanding

The system receives a natural-language IT helpdesk request.

The request is processed to identify relevant information such as:

* Request type
* User context
* Affected service
* Relevant entities
* Priority
* Severity
* Required information

The request is then routed to the appropriate workflow.

4. Stage 2 – Priority and Severity

The system determines the priority and severity of the request using the available request information and IT service context.

This helps determine:

* Urgency
* Potential impact
* Whether automation is appropriate
* Whether escalation may be required

5. Stage 3 – Enterprise Knowledge Retrieval

The system retrieves relevant enterprise knowledge using Retrieval-Augmented Generation (RAG).

The knowledge layer can contain:

* IT troubleshooting procedures
* Approved workflows
* Enterprise policies
* Access procedures
* Software installation procedures
* Service documentation
* Escalation guidelines

The retrieved information provides evidence for subsequent reasoning and planning.

6. Stage 4 – IT State / World Model

The system maintains a representation of the relevant IT environment state.

The World Model may represent entities such as:

* Users
* Accounts
* Devices
* Applications
* Services
* Permissions
* Tickets
* Current service states

The model allows the agent to reason about the relationship between an action and its expected effect on the IT environment.

Example:

Current State:
VPN = Disconnected
Proposed Action:
Restart VPN service
Expected State:
VPN = Connected
Observed State:
VPN = Connected

The observed state can then be used to verify whether the requested outcome was achieved.

7. Stage 5 – LLM Reasoning and Planning

The LLM receives the relevant request context, retrieved knowledge, and IT state.

It reasons about:

* Possible causes
* Required information
* Available actions
* Possible resolution plans
* Expected outcomes
* Constraints

The system generates one or more candidate plans where appropriate.

8. Stage 6 – Candidate Plan Evaluation

Candidate plans are evaluated before execution.

The evaluation considers:

* Relevance to the request
* Retrieved evidence
* Current IT state
* Expected outcome
* Workflow constraints
* Authorization requirements
* Risk

The selected plan must satisfy the defined constraints before execution.

9. Stage 7 – Policy, Authorization and Risk Check

The proposed action is checked before execution.

The control layer determines whether:

* The user is authorized
* The requested action is permitted
* The selected tool is permitted
* Required approval exists
* The action exceeds defined risk limits

Possible outcomes:

Approved
   ↓
Controlled Execution
OR
Denied
   ↓
Audit / Escalation
OR
High Risk / Ambiguous
   ↓
Human Approval / Escalation

The LLM does not receive unrestricted access to enterprise infrastructure.

10. Stage 8 – Skill / Workflow Selection

After approval, the system selects an appropriate predefined skill or workflow.

Examples:

VPN Troubleshooting
Password Reset
Software Installation
Access Request

Each workflow can define:

* Required inputs
* Allowed tools
* Execution sequence
* Preconditions
* Expected outcome
* Verification conditions
* Escalation conditions

11. Stage 9 – Controlled Tool Execution

Approved workflows interact with the IT environment through controlled tools or APIs.

The initial academic prototype will use controlled or simulated tools rather than directly modifying production enterprise infrastructure.

This provides a safe environment for development and evaluation.

12. Stage 10 – Observation

After a tool executes, the system observes the result.

The result may include:

* Tool response
* Updated service state
* Updated user/account state
* Updated ticket state
* Error information
* Execution status

The system does not simply assume that successful tool execution means successful resolution.

13. Stage 11 – Verification

The observed state is compared with the expected state.

Expected State
      +
Observed State
      ↓
Verification

If the expected state is achieved:

Verify
  ↓
Resolve Ticket
  ↓
Record Audit Event

If the expected state is not achieved:

Verify
  ↓
Failure / Mismatch
  ↓
Re-plan OR Escalate

14. Stage 12 – Resolution and Escalation

The system can finish through one of three outcomes:

Resolution

The expected state is achieved and the ticket can be resolved.

Re-planning

The expected state is not achieved, but another safe and authorized plan may be available.

Human Escalation

The request is escalated when:

* The action is unauthorized
* The action is high risk
* Required information is missing
* Available workflows cannot resolve the issue
* Verification fails
* The system cannot safely determine the next action

15. Proposed Safety Boundary

The proposed architecture separates reasoning from unrestricted execution.

LLM
 ↓
Reasoning / Plan
 ↓
Plan Evaluation
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

This allows the LLM to provide reasoning and planning while deterministic controls restrict what can actually be executed.

16. Initial Use Cases

The initial implementation will focus on:

1. VPN troubleshooting
2. Password reset
3. Software installation / approval
4. Access request

These workflows will initially operate in a controlled or simulated environment.

17. Proposed Evaluation

The proposed architecture will be evaluated against simpler approaches.

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

Planned evaluation areas include:

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

18. Implementation Strategy

The implementation will proceed incrementally:

Project Foundation
        ↓
ITSM Ticket Module
        ↓
Knowledge Base / RAG
        ↓
LLM Reasoning
        ↓
Planning
        ↓
IT State / World Model
        ↓
Policy / Authorization
        ↓
Controlled Tools
        ↓
Observation
        ↓
Verification
        ↓
End-to-End Agent
        ↓
Testing and Evaluation

19. Expected Outcome

The proposed methodology aims to produce a controlled autonomous IT-helpdesk prototype capable of handling selected Level-1 requests through a complete reasoning-to-action workflow while maintaining authorization, policy constraints, verification, and human escalation.
