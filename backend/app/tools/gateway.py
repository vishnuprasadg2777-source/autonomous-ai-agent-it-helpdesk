from dataclasses import dataclass
from typing import Any


@dataclass
class ToolResult:
    tool: str
    success: bool
    message: str
    state_changes: dict[str, str]
    output: dict[str, Any]


# =========================================================
# CONTROLLED TOOL REGISTRY
# =========================================================

ALLOWED_TOOLS = {
    "get_vpn_status",
    "restart_vpn_client",
    "reset_password",
    "install_software",
    "request_application_access",
}


# Privileged actions are intentionally NOT registered.
# They must be blocked by policy and must never execute here.
BLOCKED_TOOLS = {
    "grant_access",
    "grant_admin_access",
    "disable_security_controls",
    "delete_records",
}


def _blocked_result(
    tool_name: str,
    reason: str,
    message: str,
) -> ToolResult:
    """Create a standard fail-closed tool result."""

    return ToolResult(
        tool=tool_name,
        success=False,
        message=message,
        state_changes={},
        output={
            "status": "blocked",
            "reason": reason,
        },
    )


def _parameter_text(
    parameters: dict[str, Any],
    key: str,
) -> str:
    """Return a clean parameter value or an empty string."""

    value = parameters.get(key)

    if value is None:
        return ""

    return str(value).strip()


# =========================================================
# CONTROLLED TOOL GATEWAY
# =========================================================

def execute_tool(
    tool_name: str,
    parameters: dict[str, Any] | None = None,
) -> ToolResult:
    """
    Execute an action through the controlled IT tool gateway.

    This prototype uses deterministic mock IT tools.
    No real operating-system, university, company, or
    production infrastructure is modified.

    Safety principles:
    1. Only registered tools may execute.
    2. Privileged tools are never registered.
    3. Missing required parameters fail closed.
    4. Every successful tool returns explicit state changes.
    5. Unknown/unhandled tools fail closed.
    """

    tool_name = (tool_name or "").strip()
    parameters = parameters or {}

    # =====================================================
    # EXPLICIT PRIVILEGED DENY
    # =====================================================

    if tool_name in BLOCKED_TOOLS:
        return _blocked_result(
            tool_name=tool_name,
            reason="privileged_or_destructive_tool",
            message=(
                "Tool execution denied because the requested "
                "operation is privileged or destructive and is "
                "not available to the autonomous Level-1 agent."
            ),
        )

    # =====================================================
    # DEFAULT DENY
    # =====================================================

    if tool_name not in ALLOWED_TOOLS:
        return _blocked_result(
            tool_name=tool_name,
            reason="unregistered_tool",
            message=(
                "Tool execution denied because the requested "
                "tool is not registered in the controlled gateway."
            ),
        )

    # =====================================================
    # VPN STATUS
    # =====================================================

    if tool_name == "get_vpn_status":
        return ToolResult(
            tool=tool_name,
            success=True,
            message="VPN client status retrieved successfully.",
            state_changes={},
            output={
                "vpn_client": "disconnected",
                "network": "connected",
                "vpn_gateway": "operational",
                "authentication": "valid",
            },
        )

    # =====================================================
    # VPN RESTART
    # =====================================================

    if tool_name == "restart_vpn_client":
        return ToolResult(
            tool=tool_name,
            success=True,
            message=(
                "Controlled VPN client restart completed successfully."
            ),
            state_changes={
                "vpn_client": "connected",
            },
            output={
                "previous_state": "disconnected",
                "current_state": "connected",
                "action": "restart_vpn_client",
            },
        )

    # =====================================================
    # PASSWORD RESET
    # =====================================================

    if tool_name == "reset_password":
        return ToolResult(
            tool=tool_name,
            success=True,
            message=(
                "Password reset workflow completed through "
                "the controlled identity tool."
            ),
            state_changes={
                "authentication": "valid",
            },
            output={
                "action": "reset_password",
                "identity_verified": True,
            },
        )

    # =====================================================
    # SOFTWARE INSTALLATION
    # =====================================================

    if tool_name == "install_software":
        software_name = _parameter_text(
            parameters,
            "software",
        )

        if not software_name:
            return _blocked_result(
                tool_name=tool_name,
                reason="missing_software_parameter",
                message=(
                    "Software installation was blocked because "
                    "no software name was provided."
                ),
            )

        return ToolResult(
            tool=tool_name,
            success=True,
            message=(
                f"Controlled software installation completed for "
                f"{software_name}."
            ),
            state_changes={
                "software_installation": "installed",
            },
            output={
                "action": "install_software",
                "software": software_name,
                "installation_status": "installed",
                "endpoint_status": "operational",
            },
        )

    # =====================================================
    # STANDARD APPLICATION ACCESS
    # =====================================================

    if tool_name == "request_application_access":
        resource = _parameter_text(
            parameters,
            "resource",
        )

        if not resource:
            return _blocked_result(
                tool_name=tool_name,
                reason="missing_resource_parameter",
                message=(
                    "Application access was blocked because "
                    "no application or resource was specified."
                ),
            )

        return ToolResult(
            tool=tool_name,
            success=True,
            message=(
                f"Controlled application access workflow completed "
                f"for {resource}."
            ),
            state_changes={
                "access_request": "provisioned",
            },
            output={
                "action": "request_application_access",
                "resource": resource,
                "access_status": "provisioned",
                "authorization_verified": True,
            },
        )

    # =====================================================
    # FAIL CLOSED
    # =====================================================

    return _blocked_result(
        tool_name=tool_name,
        reason="unhandled_tool",
        message="Tool execution failed closed.",
    )


# =========================================================
# API SERIALIZATION
# =========================================================

def tool_result_to_dict(
    result: ToolResult,
) -> dict[str, Any]:
    return {
        "tool": result.tool,
        "success": result.success,
        "message": result.message,
        "state_changes": result.state_changes,
        "output": result.output,
    }