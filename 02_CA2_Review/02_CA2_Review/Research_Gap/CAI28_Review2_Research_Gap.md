# Research Gap – Review 2

## Project

**Autonomous AI Agent for IT Helpdesk**

## Problem Statement

**PSAIAC_60**

IT teams spend 40% of time on repetitive L1 tickets. Industry needs an autonomous AI agent that resolves password resets, software installs, and access requests without human involvement.

## Identified Research Gap

The selected literature provides complementary research across IT service-desk processes, knowledge management, autonomous and adaptive agents, privacy and tool use, goal-directed agent behaviour, deeper LLM reasoning, causal world models, agentic information gathering, and enterprise workflow automation.

However, the reviewed work does not provide the complete proposed controlled Level-1 IT helpdesk workflow combining these capabilities into one architecture.

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
