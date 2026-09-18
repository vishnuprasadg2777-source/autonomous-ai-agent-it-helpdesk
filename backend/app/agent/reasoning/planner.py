from typing import Any

from backend.app.agent.reasoning.llm_planner import generate_llm_plan


class RemediationPlan:
    def __init__(
        self,
        action: str,
        target: str,
        rationale: str,
        expected_state: dict[str, str],
        risk: str,
        requires_authorization: bool,
        confidence: float,
    ):
        self.action = action
        self.target = target
        self.rationale = rationale
        self.expected_state = expected_state
        self.risk = risk
        self.requires_authorization = requires_authorization
        self.confidence = confidence


SUPPORTED_ACTIONS = {
    "restart_vpn_client",
    "escalate_vpn_troubleshooting",
    "reset_password",
    "install_software",
    "request_application_access",
    "grant_admin_access",
}


def plan_to_dict(plan: RemediationPlan) -> dict[str, Any]:
    return {
        "action": plan.action,
        "target": plan.target,
        "rationale": plan.rationale,
        "expected_state": plan.expected_state,
        "risk": plan.risk,
        "requires_authorization": plan.requires_authorization,
        "confidence": plan.confidence,
    }


def _expected_state_for_action(
    action: str | None,
    it_state: dict[str, str],
) -> dict[str, str]:
    """
    Generate the expected post-action state locally.

    The LLM never controls this mapping. This prevents a malformed
    or hallucinated LLM response from inventing an unsafe verification
    target.
    """

    if action == "restart_vpn_client":
        return {
            "vpn_client": "connected",
            "network": "connected",
            "vpn_gateway": "operational",
            "authentication": "valid",
        }

    if action == "reset_password":
        return {
            "authentication": "valid",
        }

    if action == "install_software":
        return {
            "endpoint": "operational",
            "software_installation": "installed",
        }

    if action == "request_application_access":
        return {
            "authentication": "valid",
            "access_request": "provisioned",
        }

    if action == "grant_admin_access":
        return {
            "authentication": "valid",
            "access_request": "provisioned",
        }

    if action == "escalate_vpn_troubleshooting":
        return {
            "vpn_client": it_state.get(
                "vpn_client",
                "unknown",
            ),
        }

    return {}


def _normalize_risk(value: Any, default: str) -> str:
    """
    Accept only known risk levels from the LLM.
    """

    if isinstance(value, str):
        normalized = value.strip().title()

        if normalized in {"Low", "Medium", "High"}:
            return normalized

    return default


def _normalize_confidence(
    value: Any,
    default: float,
) -> float:
    """
    Keep confidence inside the valid 0..1 range.
    """

    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return default

    return max(0.0, min(1.0, confidence))


def _normalize_authorization(
    value: Any,
    default: bool,
) -> bool:
    """
    Normalize an LLM authorization flag without allowing arbitrary
    values to propagate into policy evaluation.
    """

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized in {
            "true",
            "yes",
            "required",
            "authorization_required",
        }:
            return True

        if normalized in {
            "false",
            "no",
            "not_required",
            "none",
        }:
            return False

    return default


def _intent_to_action(
    intent: str,
    it_state: dict[str, str],
) -> tuple[str | None, str, str, str, bool, float]:
    """
    Deterministically map the understood intent to the only action
    family that is valid for that intent.

    Returns:
        action,
        target,
        rationale,
        risk,
        requires_authorization,
        confidence
    """

    # ---------------------------------------------------------
    # VPN
    # ---------------------------------------------------------

    if intent == "troubleshoot_vpn":
        target = "VPN Client"

        vpn_safe_conditions = (
            it_state.get("vpn_client") == "disconnected"
            and it_state.get("network") == "connected"
            and it_state.get("vpn_gateway") == "operational"
            and it_state.get("authentication") == "valid"
        )

        if vpn_safe_conditions:
            return (
                "restart_vpn_client",
                target,
                (
                    "The endpoint network is connected, the VPN gateway "
                    "is operational, authentication is valid, and the VPN "
                    "client is disconnected. A controlled VPN client "
                    "restart is therefore the appropriate candidate "
                    "remediation."
                ),
                "Low",
                True,
                0.94,
            )

        return (
            "escalate_vpn_troubleshooting",
            target,
            (
                "The observed VPN environment does not satisfy all "
                "conditions required for safe automated VPN client "
                "restart. Human IT troubleshooting is required."
            ),
            "Low",
            True,
            0.90,
        )

    # ---------------------------------------------------------
    # Password
    # ---------------------------------------------------------

    if intent == "reset_password":
        return (
            "reset_password",
            "User Account",
            (
                "The request is a standard password-reset operation "
                "supported by the controlled helpdesk workflow."
            ),
            "Low",
            True,
            0.92,
        )

    # ---------------------------------------------------------
    # Software
    # ---------------------------------------------------------

    if intent == "install_software":
        return (
            "install_software",
            it_state.get(
                "requested_software",
                "Requested Software",
            ),
            (
                "The request identifies software installation as the "
                "required operation. Installation must proceed through "
                "the controlled tool gateway and applicable policy."
            ),
            "Low",
            True,
            0.90,
        )

    # ---------------------------------------------------------
    # Privileged access
    # ---------------------------------------------------------

    if intent == "request_privileged_access":
        return (
            "grant_admin_access",
            it_state.get(
                "requested_resource",
                "Privileged Resource",
            ),
            (
                "The request requires privileged administrative access. "
                "The action is proposed only for policy evaluation and "
                "must not bypass authorization or security controls."
            ),
            "High",
            True,
            0.95,
        )

    # ---------------------------------------------------------
    # Standard application/resource access
    # ---------------------------------------------------------

    if intent in {
        "request_access",
        "request_application_access",
    }:
        return (
            "request_application_access",
            it_state.get(
                "requested_resource",
                "Requested Application",
            ),
            (
                "The request requires standard application or resource "
                "access. The access operation must be evaluated by the "
                "policy engine before controlled execution."
            ),
            "Medium",
            True,
            0.90,
        )

    # ---------------------------------------------------------
    # Unknown
    # ---------------------------------------------------------

    return (
        None,
        "IT Environment",
        "",
        "Medium",
        True,
        0.0,
    )


def _plan_from_llm(
    llm_plan: dict[str, Any],
    *,
    expected_action: str,
    expected_target: str,
    deterministic_rationale: str,
    deterministic_risk: str,
    deterministic_authorization: bool,
    deterministic_confidence: float,
    it_state: dict[str, str],
) -> RemediationPlan | None:
    """
    Accept useful LLM reasoning only after validating it against the
    deterministic intent-to-action decision.

    The LLM cannot change the action selected for the understood intent.
    """

    llm_action = llm_plan.get("action")

    # Never accept an action different from the action dictated by
    # the understood intent.
    if llm_action != expected_action:
        return None

    if llm_action not in SUPPORTED_ACTIONS:
        return None

    expected_state = _expected_state_for_action(
        expected_action,
        it_state,
    )

    if not expected_state:
        return None

    target = llm_plan.get("target")

    if not isinstance(target, str) or not target.strip():
        target = expected_target

    rationale = llm_plan.get("rationale")

    if not isinstance(rationale, str) or not rationale.strip():
        rationale = deterministic_rationale

    # Risk and authorization remain bounded by the deterministic
    # action policy. The LLM can suggest values, but it cannot lower
    # the safety requirements of a known action.
    llm_risk = _normalize_risk(
        llm_plan.get("risk"),
        deterministic_risk,
    )

    risk_order = {
        "Low": 1,
        "Medium": 2,
        "High": 3,
    }

    if risk_order[llm_risk] < risk_order[deterministic_risk]:
        risk = deterministic_risk
    else:
        risk = llm_risk

    authorization = _normalize_authorization(
        llm_plan.get("requires_authorization"),
        deterministic_authorization,
    )

    # If deterministic policy requires authorization, the LLM can
    # never turn that requirement off.
    requires_authorization = (
        deterministic_authorization or authorization
    )

    confidence = _normalize_confidence(
        llm_plan.get("confidence"),
        deterministic_confidence,
    )

    # Do not let an LLM claim a confidence higher than the
    # deterministic confidence for the supported action.
    confidence = min(
        confidence,
        deterministic_confidence,
    )

    return RemediationPlan(
        action=expected_action,
        target=target,
        rationale=rationale,
        expected_state=expected_state,
        risk=risk,
        requires_authorization=requires_authorization,
        confidence=confidence,
    )


def generate_plan(
    intent: str,
    category: str,
    it_state: dict[str, str],
    knowledge_sources: list[Any],
) -> RemediationPlan | None:
    """
    Generate a validated remediation plan.

    Architecture:

        Understanding
              ↓
        deterministic intent/action boundary
              ↓
        optional LLM reasoning
              ↓
        validated plan
              ↓
        Policy
              ↓
        Tool Gateway
              ↓
        Verification

    The request text determines the intent before this function is
    called. The ticket ID is never used to choose an action.

    The LLM is advisory inside the reasoning stage. It cannot replace
    the deterministic safety boundary or invent unsupported actions.
    """

    # ---------------------------------------------------------
    # 1. Determine the only valid action for this intent.
    # ---------------------------------------------------------

    (
        expected_action,
        expected_target,
        deterministic_rationale,
        deterministic_risk,
        deterministic_authorization,
        deterministic_confidence,
    ) = _intent_to_action(
        intent,
        it_state,
    )

    # Unknown / unsupported intent.
    if expected_action is None:
        return None

    # ---------------------------------------------------------
    # 2. Try LLM reasoning.
    # ---------------------------------------------------------

    llm_plan = generate_llm_plan(
        intent=intent,
        category=category,
        it_state=it_state,
        knowledge_sources=knowledge_sources,
    )

    if llm_plan is not None:
        candidate = _plan_from_llm(
            llm_plan,
            expected_action=expected_action,
            expected_target=expected_target,
            deterministic_rationale=deterministic_rationale,
            deterministic_risk=deterministic_risk,
            deterministic_authorization=deterministic_authorization,
            deterministic_confidence=deterministic_confidence,
            it_state=it_state,
        )

        if candidate is not None:
            return candidate

    # ---------------------------------------------------------
    # 3. Deterministic fallback.
    # ---------------------------------------------------------

    expected_state = _expected_state_for_action(
        expected_action,
        it_state,
    )

    if not expected_state:
        return None

    return RemediationPlan(
        action=expected_action,
        target=expected_target,
        rationale=deterministic_rationale,
        expected_state=expected_state,
        risk=deterministic_risk,
        requires_authorization=deterministic_authorization,
        confidence=deterministic_confidence,
    )