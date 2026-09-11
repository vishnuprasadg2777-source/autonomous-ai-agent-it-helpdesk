from dataclasses import dataclass
from typing import Literal


PolicyDecisionType = Literal[
    "allowed",
    "approval_required",
    "blocked",
]


@dataclass
class PolicyDecision:
    action: str
    decision: PolicyDecisionType
    risk: str
    authorization_required: bool
    reason: str
    policy_id: str


# =========================================================
# CONTROLLED POLICY RULES
# =========================================================

POLICY_RULES = {
    "restart_vpn_client": {
        "policy_id": "POL-002",
        "risk": "Low",
        "decision": "allowed",
        "authorization_required": True,
        "reason": (
            "VPN client restart is an approved Level-1 remediation "
            "when the observed network and VPN service state support "
            "the action."
        ),
    },
    "reset_password": {
        "policy_id": "POL-001",
        "risk": "Low",
        "decision": "allowed",
        "authorization_required": True,
        "reason": (
            "Password reset is permitted through the approved "
            "identity-management procedure after authorization."
        ),
    },
    "install_software": {
        "policy_id": "POL-003",
        "risk": "Medium",
        "decision": "allowed",
        "authorization_required": True,
        "reason": (
            "Installation of approved software on an eligible "
            "operational endpoint is permitted through the "
            "controlled Level-1 software workflow."
        ),
    },
    "request_application_access": {
        "policy_id": "POL-005",
        "risk": "Medium",
        "decision": "allowed",
        "authorization_required": True,
        "reason": (
            "Standard application access requests may be processed "
            "through the controlled Level-1 access workflow when "
            "authorization requirements are satisfied."
        ),
    },
    "grant_access": {
        "policy_id": "POL-004",
        "risk": "High",
        "decision": "blocked",
        "authorization_required": True,
        "reason": (
            "Direct privileged access changes cannot be autonomously "
            "granted by the Level-1 agent."
        ),
    },
    "grant_admin_access": {
        "policy_id": "POL-004",
        "risk": "High",
        "decision": "blocked",
        "authorization_required": True,
        "reason": (
            "Administrative access must be handled by an authorized "
            "IT administrator."
        ),
    },
}


def evaluate_policy(
    action: str,
    risk: str,
    requires_authorization: bool,
    it_state: dict[str, str],
) -> PolicyDecision:
    """
    Evaluate a candidate remediation action before execution.

    The planner proposes an action.
    This policy layer determines whether the action is:

    - allowed
    - approval_required
    - blocked

    Unknown actions are denied by default.
    """

    rule = POLICY_RULES.get(action)

    # =====================================================
    # DEFAULT DENY
    # =====================================================

    if rule is None:
        return PolicyDecision(
            action=action,
            decision="blocked",
            risk=risk,
            authorization_required=True,
            reason=(
                "No explicit policy rule exists for this action. "
                "The action is blocked by default."
            ),
            policy_id="POL-DEFAULT-DENY",
        )

    # =====================================================
    # VPN STATE SAFETY CHECK
    # =====================================================

    if action == "restart_vpn_client":
        if (
            it_state.get("vpn_client") != "disconnected"
            or it_state.get("network") != "connected"
            or it_state.get("vpn_gateway") != "operational"
            or it_state.get("authentication") != "valid"
        ):
            return PolicyDecision(
                action=action,
                decision="blocked",
                risk=rule["risk"],
                authorization_required=True,
                reason=(
                    "The observed IT state does not satisfy the "
                    "conditions required for a controlled VPN restart."
                ),
                policy_id=rule["policy_id"],
            )

    # =====================================================
    # SOFTWARE SAFETY CHECK
    # =====================================================

    if action == "install_software":
        if it_state.get("endpoint") != "operational":
            return PolicyDecision(
                action=action,
                decision="blocked",
                risk=rule["risk"],
                authorization_required=True,
                reason=(
                    "Software installation is blocked because the "
                    "observed endpoint is not operational."
                ),
                policy_id=rule["policy_id"],
            )

    # =====================================================
    # STANDARD ACCESS SAFETY CHECK
    # =====================================================

    if action == "request_application_access":
        if it_state.get("authentication") != "valid":
            return PolicyDecision(
                action=action,
                decision="blocked",
                risk=rule["risk"],
                authorization_required=True,
                reason=(
                    "Application access cannot be provisioned because "
                    "the user's authentication state is not valid."
                ),
                policy_id=rule["policy_id"],
            )

    # =====================================================
    # FINAL POLICY DECISION
    # =====================================================

    return PolicyDecision(
        action=action,
        decision=rule["decision"],
        risk=rule["risk"],
        authorization_required=(
            requires_authorization
            or rule["authorization_required"]
        ),
        reason=rule["reason"],
        policy_id=rule["policy_id"],
    )


def policy_to_dict(
    decision: PolicyDecision,
) -> dict[str, object]:
    """
    Convert a policy decision into an API-friendly dictionary.
    """

    return {
        "action": decision.action,
        "decision": decision.decision,
        "risk": decision.risk,
        "authorization_required": decision.authorization_required,
        "reason": decision.reason,
        "policy_id": decision.policy_id,
    }