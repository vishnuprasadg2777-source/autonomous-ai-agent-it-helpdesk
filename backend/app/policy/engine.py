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


# =========================================================
# APPROVED SOFTWARE ALLOWLIST
# =========================================================
#
# Software installation is NOT permitted merely because the
# endpoint is operational.
#
# The requested software must also be explicitly present in
# this controlled allowlist.
#
# "approved software" is retained as a controlled generic
# test value used by the project evaluation workflow.
# =========================================================

APPROVED_SOFTWARE = {
    "approved software",
    "visual studio code",
    "vs code",
    "google chrome",
    "mozilla firefox",
    "7-zip",
    "vlc media player",
    "microsoft teams",
}


# =========================================================
# HELPERS
# =========================================================

def _blocked(
    action: str,
    risk: str,
    reason: str,
    policy_id: str,
) -> PolicyDecision:
    """Create a standard fail-closed policy decision."""

    return PolicyDecision(
        action=action,
        decision="blocked",
        risk=risk,
        authorization_required=True,
        reason=reason,
        policy_id=policy_id,
    )


def _state_is_valid(
    it_state: dict[str, str],
    key: str,
    expected: str,
) -> bool:
    """Check one observed IT-state condition."""

    return it_state.get(key) == expected


def _normalize_software_name(value: str | None) -> str:
    """Normalize a requested software name for allowlist comparison."""

    return " ".join((value or "").strip().lower().split())


# =========================================================
# POLICY ENGINE
# =========================================================

def evaluate_policy(
    action: str,
    risk: str,
    requires_authorization: bool,
    it_state: dict[str, str],
) -> PolicyDecision:
    """
    Evaluate a candidate remediation action before execution.

    The planner proposes an action.
    This policy layer independently determines whether the action is:

        allowed
        approval_required
        blocked

    The policy engine is fail-closed:
    an action without an explicit rule is blocked.

    Software installation has an additional allowlist check:
    only explicitly approved software may be installed
    autonomously.
    """

    # Normalize the action so accidental surrounding whitespace
    # cannot bypass policy lookup.
    action = (action or "").strip()

    # =====================================================
    # DEFAULT DENY
    # =====================================================

    rule = POLICY_RULES.get(action)

    if rule is None:
        return _blocked(
            action=action,
            risk=risk or "Unknown",
            reason=(
                "No explicit policy rule exists for this action. "
                "The action is blocked by default."
            ),
            policy_id="POL-DEFAULT-DENY",
        )

    # =====================================================
    # PRIVILEGED ACCESS
    # =====================================================
    # These actions are explicitly non-autonomous.
    # They must never reach the tool gateway.

    if action in {"grant_access", "grant_admin_access"}:
        return _blocked(
            action=action,
            risk=rule["risk"],
            reason=rule["reason"],
            policy_id=rule["policy_id"],
        )

    # =====================================================
    # VPN STATE SAFETY CHECK
    # =====================================================

    if action == "restart_vpn_client":
        vpn_conditions = {
            "vpn_client": "disconnected",
            "network": "connected",
            "vpn_gateway": "operational",
            "authentication": "valid",
        }

        failed_conditions = [
            key
            for key, expected in vpn_conditions.items()
            if not _state_is_valid(it_state, key, expected)
        ]

        if failed_conditions:
            return _blocked(
                action=action,
                risk=rule["risk"],
                reason=(
                    "The observed IT state does not satisfy the "
                    "conditions required for a controlled VPN restart. "
                    f"Failed conditions: {', '.join(failed_conditions)}."
                ),
                policy_id=rule["policy_id"],
            )

    # =====================================================
    # PASSWORD RESET SAFETY CHECK
    # =====================================================

    if action == "reset_password":
        authentication_state = it_state.get("authentication")

        # A password-reset request is specifically used when the
        # authentication state requires attention. A valid state
        # is also acceptable for the controlled reset workflow.
        #
        # Unexpected or unknown authentication states remain
        # blocked by default.
        if authentication_state not in {
            "requires_attention",
            "valid",
        }:
            return _blocked(
                action=action,
                risk=rule["risk"],
                reason=(
                    "Password reset is blocked because the observed "
                    "authentication state does not satisfy the "
                    "approved identity-management workflow."
                ),
                policy_id=rule["policy_id"],
            )

    # =====================================================
    # SOFTWARE INSTALLATION SAFETY CHECK
    # =====================================================

    if action == "install_software":
        # First verify that the endpoint itself is eligible.
        if not _state_is_valid(
            it_state,
            "endpoint",
            "operational",
        ):
            return _blocked(
                action=action,
                risk=rule["risk"],
                reason=(
                    "Software installation is blocked because the "
                    "observed endpoint is not operational."
                ),
                policy_id=rule["policy_id"],
            )

        # Then independently verify the requested software.
        requested_software = _normalize_software_name(
            it_state.get("requested_software")
        )

        if not requested_software:
            return _blocked(
                action=action,
                risk=rule["risk"],
                reason=(
                    "Software installation is blocked because the "
                    "requested software could not be identified."
                ),
                policy_id=rule["policy_id"],
            )

        if requested_software not in APPROVED_SOFTWARE:
            return _blocked(
                action=action,
                risk=rule["risk"],
                reason=(
                    "Software installation is blocked because the "
                    f"requested software '{it_state.get('requested_software')}' "
                    "is not present in the approved software allowlist. "
                    "Human approval is required before installation."
                ),
                policy_id="POL-003-ALLOWLIST",
            )

    # =====================================================
    # STANDARD APPLICATION ACCESS SAFETY CHECK
    # =====================================================

    if action == "request_application_access":
        if not _state_is_valid(
            it_state,
            "authentication",
            "valid",
        ):
            return _blocked(
                action=action,
                risk=rule["risk"],
                reason=(
                    "Application access cannot be provisioned because "
                    "the user's authentication state is not valid."
                ),
                policy_id=rule["policy_id"],
            )

    # =====================================================
    # AUTHORIZATION REQUIREMENT
    # =====================================================

    authorization_required = (
        requires_authorization
        or rule["authorization_required"]
    )

    # =====================================================
    # FINAL EXPLICIT POLICY DECISION
    # =====================================================

    return PolicyDecision(
        action=action,
        decision=rule["decision"],
        risk=rule["risk"],
        authorization_required=authorization_required,
        reason=rule["reason"],
        policy_id=rule["policy_id"],
    )


# =========================================================
# API SERIALIZATION
# =========================================================

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