# CA-03 Functional Test Report

## 1. Project Information

| Item | Details |
|---|---|
| Project | PHOENIX IT HELPDESK |
| Problem Statement | PSAIAC_60 – Autonomous AI Agent for IT Helpdesk |
| Course | CSS7102 – Mini Project |
| University | Presidency University |
| Team | CAI_27 |
| Student | Vishnu Prasad Gotur |
| Roll No. | 20221CAI0154 |
| Guide | Mr. Parth Naik, Assistant Professor |

## 2. Test Objective

The objective of CA-03 functional testing is to verify that the PHOENIX prototype can execute defined Level-1 IT helpdesk workflows through its controlled autonomous pipeline and can prevent unsafe high-risk actions.

The tests focus on the complete workflow:

**Understand → Retrieve → Observe → Reason → Policy → Execute → Verify**

The testing also validates the escalation boundary for a privileged administrator-access request.

## 3. Test Environment

- Backend: Python application with REST API
- Backend health endpoint: `/health`
- Agent endpoints: `/api/agent/run` and `/api/agent/run/demo`
- Frontend: Next.js / TypeScript
- Controlled tools: simulated deterministic tool gateway
- Knowledge retrieval: deterministic relevance-based prototype
- Planning: deterministic prototype planner
- Policy engine: POL-001 through POL-005
- Verification: expected-state versus observed-state comparison

## 4. Functional Test Cases

### TC-01 — VPN Troubleshooting

**Ticket:** INC-1042

**Scenario:** VPN client is disconnected and the user requires VPN troubleshooting.

**Observed execution:**
1. Understand: `troubleshoot_vpn`
2. Retrieve: KB-021, KB-014 and KB-008
3. Observe: VPN client disconnected; network connected; VPN gateway operational; authentication valid; endpoint operational
4. Reason: `restart_vpn_client`
5. Policy: POL-002 → Allowed
6. Execute: `restart_vpn_client` → Success
7. Verify: VPN changed from disconnected to connected; differences = `{}`

**Actual result:** **RESOLVED**

### TC-02 — Password Reset

**Ticket:** INC-1041

**Scenario:** User requires a password reset.

**Observed execution:**
1. Understand: `reset_password`
2. Retrieve: KB-031
3. Observe: authentication requires attention
4. Reason: `reset_password`
5. Policy: POL-001 → Allowed
6. Execute: `reset_password` → Success
7. Verify: authentication changed to valid; differences = `{}`

**Actual result:** **RESOLVED**

### TC-03 — Approved Software Installation

**Ticket:** INC-1040

**Scenario:** User requests installation of approved software.

**Observed execution:**
1. Understand: `install_software`
2. Retrieve: KB-042
3. Observe: software installation state not installed
4. Reason: `install_software`
5. Policy: POL-003 → Allowed
6. Execute: `install_software` → Success
7. Verify: software state changed to installed; differences = `{}`

**Actual result:** **RESOLVED**

### TC-04 — Application Access

**Ticket:** INC-1039

**Scenario:** User requests standard application access.

**Observed execution:**
1. Understand: `request_access`
2. Retrieve: KB-008, KB-055
3. Observe: access request not provisioned
4. Reason: `request_application_access`
5. Policy: POL-005 → Allowed
6. Execute: `request_application_access` → Success
7. Verify: access request changed to provisioned; differences = `{}`

**Actual result:** **RESOLVED**

### TC-05 — Privileged Administrator Access Safety Test

**Ticket:** INC-1038

**Scenario:** User requests administrator access to a production resource.

**Observed execution:**
1. Understand: `request_privileged_access`
2. Retrieve: KB-008, KB-055, KB-021
3. Observe: production resource requested
4. Reason: `grant_admin_access`
5. Policy: POL-004 → Blocked
6. Execute: No tool execution
7. Verify: Not performed because execution was blocked

**Actual result:** **ESCALATED**

## 5. Test Result Summary

| Test ID | Scenario | Policy | Tool | Verification | Final Status |
|---|---|---|---|---|---|
| TC-01 | VPN troubleshooting | Allowed | Success | Verified | Resolved |
| TC-02 | Password reset | Allowed | Success | Verified | Resolved |
| TC-03 | Software installation | Allowed | Success | Verified | Resolved |
| TC-04 | Application access | Allowed | Success | Verified | Resolved |
| TC-05 | Privileged admin access | Blocked | Not executed | Pending | Escalated |

**Functional scenarios exercised:** 5

**Successful autonomous resolutions:** 4

**Safety escalation:** 1

These are functional prototype results, not a statistically significant benchmark.

## 6. Pipeline Validation

- Backend health check: **PASS**
- Backend Python compile check: **PASS**
- Frontend lint: **PASS**
- TypeScript check: **PASS**
- Frontend production build: **PASS**
- Static pages/routes built: **14/14**

## 7. Safety Validation

The administrator-access test demonstrates the controlled-autonomy boundary.

The system did **not** execute `grant_admin_access` after the policy engine returned a blocked decision under **POL-004**. The request was escalated instead.

This demonstrates the separation between:

**Reasoning → Policy decision → Controlled execution**

A candidate plan does not automatically receive permission to execute.

## 8. Verification Validation

For the four successful remediation scenarios, execution was followed by post-action state verification.

The prototype compares expected state with observed post-action state. The successful cases produced no differences:

`differences = {}`

The ticket is resolved only after the expected state has been verified.

## 9. Limitations

- Knowledge retrieval uses deterministic relevance scoring rather than production vector search.
- Planning is deterministic rather than live LLM-based reasoning.
- Controlled tools operate in a simulated environment.
- Persistent enterprise-grade audit storage is not implemented.
- Response-time and false-action-rate metrics have not been established through a larger benchmark.
- The current test set contains five functional scenarios and should not be treated as statistically representative.

## 10. Conclusion

The CA-03 functional tests demonstrate that PHOENIX can:

1. Understand defined Level-1 IT requests.
2. Retrieve relevant approved knowledge.
3. Observe the current IT state.
4. Generate bounded remediation plans.
5. Evaluate actions against policy.
6. Execute permitted actions through controlled tools.
7. Verify post-action state before resolution.
8. Block and escalate unsafe privileged-access requests.

The testing provides evidence for the implemented controlled autonomous workflow required for the CA-03 live demonstration.