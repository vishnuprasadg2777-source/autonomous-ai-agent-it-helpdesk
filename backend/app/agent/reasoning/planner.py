from dataclasses import dataclass
from typing import Any


@dataclass
class RemediationPlan:
    """
    Candidate remediation plan generated from:

    Request
    + Retrieved Knowledge
    + Observed IT World State

    This is the deterministic prototype reasoning layer.
    An LLM planner can replace this implementation later
    while preserving the same output contract.
    """

    action: str
    target: str
    rationale: str
    expected_state: dict[str, str]
    risk: str
    requires_authorization: bool
    confidence: float


def generate_plan(
    intent: str,
    category: str,
    it_state: dict[str, str],
    knowledge_sources: list[Any],
) -> RemediationPlan | None:
    """
    Generate a candidate remediation plan.

    The planner proposes an action only.
    The Policy layer decides whether that action is allowed.
    The Tool Gateway performs the actual controlled execution.
    """

    # =========================================================
    # VPN TROUBLESHOOTING
    # =========================================================

    if intent == "troubleshoot_vpn":
        vpn_client = it_state.get("vpn_client", "unknown")
        network = it_state.get("network", "unknown")
        vpn_gateway = it_state.get("vpn_gateway", "unknown")
        authentication = it_state.get("authentication", "unknown")

        if (
            vpn_client == "disconnected"
            and network == "connected"
            and vpn_gateway == "operational"
            and authentication == "valid"
        ):
            return RemediationPlan(
                action="restart_vpn_client",
                target="VPN Client",
                rationale=(
                    "The endpoint network is connected, the VPN gateway "
                    "is operational, authentication is valid, and the "
                    "VPN client is disconnected. A controlled VPN client "
                    "restart is therefore the most appropriate candidate "
                    "remediation."
                ),
                expected_state={
                    "vpn_client": "connected",
                    "network": "connected",
                    "vpn_gateway": "operational",
                    "authentication": "valid",
                },
                risk="Low",
                requires_authorization=True,
                confidence=0.94,
            )

        return RemediationPlan(
            action="escalate_vpn_troubleshooting",
            target="VPN Service",
            rationale=(
                "The observed IT state does not provide enough evidence "
                "for a safe automated VPN remediation. The request should "
                "be escalated for further investigation."
            ),
            expected_state={
                "vpn_client": vpn_client,
                "network": network,
                "vpn_gateway": vpn_gateway,
                "authentication": authentication,
            },
            risk="Low",
            requires_authorization=True,
            confidence=0.72,
        )

    # =========================================================
    # PASSWORD RESET
    # =========================================================

    if intent == "reset_password":
        return RemediationPlan(
            action="reset_password",
            target="User Identity",
            rationale=(
                "The request was classified as a password reset. "
                "The approved identity-management procedure will "
                "perform the controlled password reset after the "
                "required identity authorization."
            ),
            expected_state={
                "authentication": "valid",
            },
            risk="Low",
            requires_authorization=True,
            confidence=0.91,
        )

    # =========================================================
    # SOFTWARE INSTALLATION
    # =========================================================

    if intent == "install_software":
        software_name = it_state.get(
            "requested_software",
            "approved_software",
        )

        return RemediationPlan(
            action="install_software",
            target="Endpoint",
            rationale=(
                "The request was classified as software installation. "
                "The endpoint is operational and the request identifies "
                "software eligible for the controlled installation "
                "workflow. The approved software installation tool "
                "can perform the Level-1 remediation."
            ),
            expected_state={
                "endpoint": "operational",
                "software_installation": "installed",
            },
            risk="Medium",
            requires_authorization=True,
            confidence=0.90,
        )

    # =========================================================
    # PRIVILEGED ACCESS REQUEST
    # =========================================================

    if intent == "request_privileged_access":
        resource = it_state.get(
            "requested_resource",
            "privileged_system",
        )

        return RemediationPlan(
            action="grant_admin_access",
            target=resource,
            rationale=(
                "The request explicitly asks for privileged or "
                "administrator-level access. This exceeds the "
                "autonomous Level-1 access scope and must therefore "
                "be evaluated as a high-risk administrative action."
            ),
            expected_state={
                "access_request": "provisioned",
            },
            risk="High",
            requires_authorization=True,
            confidence=0.98,
        )

    # =========================================================
    # STANDARD APPLICATION ACCESS REQUEST
    # =========================================================

    if intent == "request_access":
        resource = it_state.get(
            "requested_resource",
            "requested_application",
        )

        return RemediationPlan(
            action="request_application_access",
            target=resource,
            rationale=(
                "The request was classified as a standard application "
                "access request. The controlled access workflow will "
                "process the requested application access while "
                "preserving authorization and policy controls."
            ),
            expected_state={
                "authentication": "valid",
                "access_request": "provisioned",
            },
            risk="Medium",
            requires_authorization=True,
            confidence=0.88,
        )

    # =========================================================
    # UNKNOWN REQUEST
    # =========================================================

    return None


def plan_to_dict(
    plan: RemediationPlan | None,
) -> dict[str, Any] | None:
    """
    Convert a remediation plan into an API-friendly dictionary.
    """

    if plan is None:
        return None

    return {
        "action": plan.action,
        "target": plan.target,
        "rationale": plan.rationale,
        "expected_state": plan.expected_state,
        "risk": plan.risk,
        "requires_authorization": plan.requires_authorization,
        "confidence": plan.confidence,
    }