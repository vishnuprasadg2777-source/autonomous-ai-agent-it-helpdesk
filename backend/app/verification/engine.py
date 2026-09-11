from dataclasses import dataclass
from typing import Any


VerificationStatus = str


@dataclass
class VerificationResult:
    status: VerificationStatus
    verified: bool
    message: str
    expected_state: dict[str, str]
    observed_state: dict[str, str]
    differences: dict[str, dict[str, str]]


def verify_state(
    expected_state: dict[str, str],
    observed_state: dict[str, str],
) -> VerificationResult:
    """
    Compare the expected IT state after an action with the
    observed IT state.

    This is a deterministic prototype verification engine.
    """

    differences: dict[str, dict[str, str]] = {}

    for key, expected_value in expected_state.items():
        observed_value = observed_state.get(key)

        if observed_value != expected_value:
            differences[key] = {
                "expected": expected_value,
                "observed": observed_value or "missing",
            }

    # =====================================================
    # VERIFIED
    # =====================================================

    if not differences:
        return VerificationResult(
            status="verified",
            verified=True,
            message=(
                "The observed IT state matches the expected state. "
                "The remediation has been successfully verified."
            ),
            expected_state=expected_state,
            observed_state=observed_state,
            differences={},
        )

    # =====================================================
    # VERIFICATION FAILED
    # =====================================================

    return VerificationResult(
        status="verification_failed",
        verified=False,
        message=(
            "The observed IT state does not match the expected "
            "post-remediation state. Further reasoning or human "
            "escalation is required."
        ),
        expected_state=expected_state,
        observed_state=observed_state,
        differences=differences,
    )


def verification_to_dict(
    result: VerificationResult,
) -> dict[str, Any]:
    return {
        "status": result.status,
        "verified": result.verified,
        "message": result.message,
        "expected_state": result.expected_state,
        "observed_state": result.observed_state,
        "differences": result.differences,
    }