from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class ITState:
    """
    Represents the current observable state of the IT environment.

    This is a deterministic prototype World Model.
    It can later be connected to real ITSM, endpoint,
    identity, network, and monitoring APIs.
    """

    vpn_client: str = "disconnected"
    network: str = "connected"
    vpn_gateway: str = "operational"
    authentication: str = "valid"
    endpoint: str = "operational"

    # State used by controlled Level-1 workflows.
    software_installation: str = "not_installed"
    access_request: str = "not_provisioned"

    last_updated: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


DEFAULT_STATE = ITState()


def observe_it_state(category: str) -> ITState:
    """
    Observe the relevant portion of the current IT environment.

    The prototype currently uses deterministic state data.
    """

    if category.lower() == "network":
        return ITState(
            vpn_client="disconnected",
            network="connected",
            vpn_gateway="operational",
            authentication="valid",
            endpoint="operational",
        )

    if category.lower() == "identity":
        return ITState(
            vpn_client="unknown",
            network="connected",
            vpn_gateway="operational",
            authentication="requires_attention",
            endpoint="operational",
        )

    if category.lower() == "software":
        return ITState(
            vpn_client="unknown",
            network="connected",
            vpn_gateway="operational",
            authentication="valid",
            endpoint="operational",
            software_installation="not_installed",
        )

    if category.lower() == "access":
        return ITState(
            vpn_client="unknown",
            network="connected",
            vpn_gateway="operational",
            authentication="valid",
            endpoint="operational",
            access_request="not_provisioned",
        )

    return DEFAULT_STATE


def state_to_dict(state: ITState) -> dict[str, str]:
    """
    Convert the World Model state into an API-friendly dictionary.
    """

    return {
        "vpn_client": state.vpn_client,
        "network": state.network,
        "vpn_gateway": state.vpn_gateway,
        "authentication": state.authentication,
        "endpoint": state.endpoint,
        "software_installation": state.software_installation,
        "access_request": state.access_request,
        "last_updated": state.last_updated,
    }