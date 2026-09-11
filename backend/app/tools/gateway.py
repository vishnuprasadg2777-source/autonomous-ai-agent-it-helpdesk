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


def execute_tool(
    tool_name: str,
    parameters: dict[str, Any] | None = None,
) -> ToolResult:
    """
    Execute an action through the controlled IT tool gateway.

    This prototype uses deterministic mock IT tools.
    No real operating-system, university, company, or
    production infrastructure is modified.
    """

    parameters = parameters or {}

    # =====================================================
    # DEFAULT DENY
    # =====================================================

    if tool_name not in ALLOWED_TOOLS:
        return ToolResult(
            tool=tool_name,
            success=False,
            message=(
                "Tool execution denied because the requested "
                "tool is not registered in the controlled gateway."
            ),
            state_changes={},
            output={
                "status": "blocked",
                "reason": "unregistered_tool",
            },
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
        software_name = parameters.get(
            "software",
            "approved_software",
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
        resource = parameters.get(
            "resource",
            "requested_application",
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

    return ToolResult(
        tool=tool_name,
        success=False,
        message="Tool execution failed closed.",
        state_changes={},
        output={
            "status": "blocked",
            "reason": "unhandled_tool",
        },
    )


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