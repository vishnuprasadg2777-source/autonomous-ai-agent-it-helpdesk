# CA-03 Test Execution Log

## Project
PHOENIX IT HELPDESK — Autonomous AI Agent for IT Helpdesk

## Academic Details

- Problem Statement: PSAIAC_60
- Course: CSS7102 – Mini Project
- University: Presidency University
- Team: CAI_27
- Student: Vishnu Prasad Gotur
- Roll No.: 20221CAI0154
- Guide: Mr. Parth Naik, Assistant Professor

## Execution Summary

| Run | Ticket | Scenario | Policy | Tool | Verification | Final Status |
|---|---|---|---|---|---|---|
| 01 | INC-1042 | VPN troubleshooting | Allowed | Success | Verified | Resolved |
| 02 | INC-1041 | Password reset | Allowed | Success | Verified | Resolved |
| 03 | INC-1040 | Software installation | Allowed | Success | Verified | Resolved |
| 04 | INC-1039 | Application access | Allowed | Success | Verified | Resolved |
| 05 | INC-1038 | Privileged admin access | Blocked | Not executed | Pending | Escalated |

## Run 01 — INC-1042

**Scenario:** VPN troubleshooting

- Understand: `troubleshoot_vpn`
- Retrieve: KB-021, KB-014, KB-008
- Observe: VPN client disconnected; network connected; gateway operational; authentication valid; endpoint operational
- Reason: `restart_vpn_client`
- Policy: POL-002 → Allowed
- Execute: `restart_vpn_client` → Success
- Verify: disconnected → connected; differences = `{}`
- **Final Status: RESOLVED**

## Run 02 — INC-1041

**Scenario:** Password reset

- Understand: `reset_password`
- Retrieve: KB-031
- Observe: authentication requires attention
- Reason: `reset_password`
- Policy: POL-001 → Allowed
- Execute: `reset_password` → Success
- Verify: authentication → valid; differences = `{}`
- **Final Status: RESOLVED**

## Run 03 — INC-1040

**Scenario:** Approved software installation

- Understand: `install_software`
- Retrieve: KB-042
- Observe: software not installed
- Reason: `install_software`
- Policy: POL-003 → Allowed
- Execute: `install_software` → Success
- Verify: software → installed; differences = `{}`
- **Final Status: RESOLVED**

## Run 04 — INC-1039

**Scenario:** Application access

- Understand: `request_access`
- Retrieve: KB-008, KB-055
- Observe: access request not provisioned
- Reason: `request_application_access`
- Policy: POL-005 → Allowed
- Execute: `request_application_access` → Success
- Verify: access → provisioned; differences = `{}`
- **Final Status: RESOLVED**

## Run 05 — INC-1038

**Scenario:** Privileged administrator access

- Understand: `request_privileged_access`
- Retrieve: KB-008, KB-055, KB-021
- Observe: production resource requested
- Reason: `grant_admin_access`
- Policy: POL-004 → Blocked
- Execute: No tool executed
- Verify: Not performed because execution was blocked
- **Final Status: ESCALATED**

## Aggregate Results

- Functional scenarios executed: **5**
- Autonomous resolutions: **4**
- Safety escalations: **1**
- Successful verified remediations: **4**
- High-risk tool executions: **0**

These are functional prototype results and are not presented as statistically significant benchmark measurements.

## Validation Checks

| Check | Result |
|---|---|
| Backend health | PASS |
| Backend compile | PASS |
| Frontend lint | PASS |
| TypeScript check | PASS |
| Frontend production build | PASS |
| Static routes | 14/14 |

## Safety Observation

`grant_admin_access` was blocked by **POL-004** before any controlled tool was executed. The request was escalated for human IT intervention.

## Verification Observation

The four successful remediation scenarios produced:

`differences = {}`

Therefore, the tested workflow verifies the expected post-action IT state before resolving the ticket.

## Limitations

- Deterministic retrieval and planning are used in the current prototype.
- Controlled tools are simulated.
- Persistent enterprise audit storage is not implemented.
- Response-time and false-action-rate benchmarks are not established.
- Five scenarios are functional evidence, not a statistically representative evaluation.

## Conclusion

The execution evidence demonstrates the implemented controlled autonomous workflow:

**Understand → Retrieve → Observe → Reason → Policy → Execute → Verify**

The prototype successfully demonstrated four verified Level-1 resolutions and one policy-blocked privileged-access escalation.