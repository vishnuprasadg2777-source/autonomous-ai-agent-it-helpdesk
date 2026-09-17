"""ITSM integration boundary.

PHOENIX uses the local simulation by default.  The ServiceNow and Jira classes
intentionally fail with a clear configuration error until real credentials and
field mappings are supplied; they do not simulate a live enterprise connection.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class IntegrationStatus:
    provider: str
    mode: str
    configured: bool
    message: str


class ITSMAdapter(Protocol):
    def status(self) -> IntegrationStatus: ...


class LocalSimulationITSMAdapter:
    def status(self) -> IntegrationStatus:
        return IntegrationStatus(
            provider="local",
            mode="simulated",
            configured=True,
            message="Local SQLite ticket workflow is active for the PHOENIX demo.",
        )


class ServiceNowAdapter:
    def status(self) -> IntegrationStatus:
        configured = bool(
            os.getenv("SERVICENOW_INSTANCE_URL") and os.getenv("SERVICENOW_API_TOKEN")
        )
        return IntegrationStatus(
            provider="servicenow",
            mode="optional",
            configured=configured,
            message=(
                "Connection settings are present but no live operations are implemented."
                if configured
                else "Requires SERVICENOW_INSTANCE_URL, SERVICENOW_API_TOKEN, and field mappings."
            ),
        )


class JiraAdapter:
    def status(self) -> IntegrationStatus:
        configured = bool(os.getenv("JIRA_BASE_URL") and os.getenv("JIRA_API_TOKEN"))
        return IntegrationStatus(
            provider="jira",
            mode="optional",
            configured=configured,
            message=(
                "Connection settings are present but no live operations are implemented."
                if configured
                else "Requires JIRA_BASE_URL, JIRA_API_TOKEN, and project/field mappings."
            ),
        )


def get_itsm_adapter() -> ITSMAdapter:
    provider = os.getenv("PHOENIX_ITSM_PROVIDER", "local").lower()
    if provider == "servicenow":
        return ServiceNowAdapter()
    if provider == "jira":
        return JiraAdapter()
    return LocalSimulationITSMAdapter()
