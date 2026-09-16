from dataclasses import dataclass
import re


@dataclass
class UnderstandingResult:
    intent: str
    category: str
    priority: str
    entities: dict[str, str]
    confidence: float


def understand_request(request: str) -> UnderstandingResult:
    text = request.lower().strip()

    # ---------------------------------------------------------
    # Priority detection
    # ---------------------------------------------------------
    if any(
        word in text
        for word in [
            "critical",
            "urgent",
            "immediately",
            "down",
            "outage",
        ]
    ):
        priority = "high"
    elif any(
        phrase in text
        for phrase in [
            "low priority",
            "when possible",
            "not urgent",
        ]
    ):
        priority = "low"
    else:
        priority = "medium"

    # ---------------------------------------------------------
    # Entity extraction
    # ---------------------------------------------------------
    entities: dict[str, str] = {}

    # ---------------------------------------------------------
    # Software extraction
    # ---------------------------------------------------------
    software_patterns = [
        # Example:
        # install Microsoft Teams
        # install Microsoft Teams on my computer
        r"\binstall\s+(?:the\s+)?(.+?)(?=\s+(?:on|onto)\s+(?:my|the)\s+(?:computer|device|laptop|pc)\b|[.,!?]|$)",

        # Example:
        # download Microsoft Teams
        # download Microsoft Teams on my computer
        r"\bdownload\s+(?:and\s+install\s+)?(?:the\s+)?(.+?)(?=\s+(?:on|onto)\s+(?:my|the)\s+(?:computer|device|laptop|pc)\b|[.,!?]|$)",

        # Example:
        # install Microsoft Teams software
        r"\binstall\s+(?:the\s+)?(.+?)\s+(?:software|application)\b",

        # Example:
        # software called Microsoft Teams
        r"\bsoftware\s+(?:called|named)\s+(.+?)(?=[.,!?]|$)",

        # Example:
        # application called Microsoft Teams
        r"\bapplication\s+(?:called|named)\s+(.+?)(?=[.,!?]|$)",
    ]

    excluded_software_names = {
        "the",
        "a",
        "an",
        "on",
        "onto",
        "in",
        "for",
        "my",
        "computer",
        "device",
        "laptop",
        "pc",
        "the computer",
        "my computer",
        "the device",
        "my device",
        "the laptop",
        "my laptop",
        "the pc",
        "my pc",
        "approved",
        "software",
        "application",
        "and",
        "install",
        "download",
    }

    for pattern in software_patterns:
        match = re.search(pattern, text)

        if match:
            candidate = match.group(1).strip().rstrip(".,!?")

            # Normalize whitespace.
            candidate = re.sub(r"\s+", " ", candidate)

            # Remove common trailing context that may have been captured.
            candidate = re.sub(
                r"\s+(?:on|onto)\s+(?:my|the)\s+"
                r"(?:computer|device|laptop|pc)$",
                "",
                candidate,
                flags=re.IGNORECASE,
            )

            candidate = re.sub(
                r"\s+(?:on|onto)\s+(?:my|the)$",
                "",
                candidate,
                flags=re.IGNORECASE,
            )

            # Remove generic trailing software/application words.
            candidate = re.sub(
                r"\s+(?:software|application|program)$",
                "",
                candidate,
                flags=re.IGNORECASE,
            )

            candidate = candidate.strip()

            if candidate.lower() not in excluded_software_names:
                if candidate:
                    # Convert to readable title case.
                    entities["software"] = candidate.title()
                    break

    # Preserve approval context without inventing a software name.
    if (
        "software" in text
        and "approved" in text
        and "software" not in entities
    ):
        entities["software"] = "approved_software"

    # ---------------------------------------------------------
    # Access resource extraction
    # ---------------------------------------------------------
    access_patterns = [
        r"access\s+(?:to|for)\s+(?:the\s+)?([a-zA-Z0-9][a-zA-Z0-9._+-]{1,40})",
        r"permission\s+(?:to|for)\s+(?:the\s+)?([a-zA-Z0-9][a-zA-Z0-9._+-]{1,40})",
    ]

    for pattern in access_patterns:
        match = re.search(pattern, text)

        if match:
            candidate = match.group(1).strip().rstrip(".,!?")

            if candidate not in {
                "the",
                "a",
                "an",
                "requested",
                "application",
                "system",
                "resource",
            }:
                entities["resource"] = candidate
                break

    # Generic standard application access request.
    if (
        "access" in text
        and "resource" not in entities
        and (
            "application" in text
            or "requested application" in text
            or "request access" in text
        )
    ):
        entities["resource"] = "requested_application"

    # ---------------------------------------------------------
    # Privileged / administrator access detection
    #
    # This must be checked before the generic access intent.
    # Privileged access is intentionally mapped to a separate
    # intent so the planner can propose grant_admin_access and
    # the Policy layer can enforce POL-004.
    # ---------------------------------------------------------
    privileged_access_phrases = [
        "administrator access",
        "admin access",
        "administrative access",
        "administrator privileges",
        "admin privileges",
        "administrative privileges",
        "administrator permission",
        "admin permission",
        "root access",
        "root privileges",
        "superuser access",
        "superuser privileges",
        "elevated privileges",
        "elevated access",
        "privileged access",
        "privileged privileges",
        "grant admin",
        "grant administrator",
        "give me admin",
        "give me administrator",
        "make me administrator",
        "make me admin",
    ]

    is_privileged_access = any(
        phrase in text
        for phrase in privileged_access_phrases
    )

    if is_privileged_access:
        if "resource" not in entities:
            entities["resource"] = "privileged_system"

        return UnderstandingResult(
            intent="request_privileged_access",
            category="Access",
            priority="high",
            entities=entities,
            confidence=0.98,
        )

    # ---------------------------------------------------------
    # VPN troubleshooting
    # ---------------------------------------------------------
    vpn_keywords = [
        "vpn",
        "virtual private network",
        "remote access",
    ]

    if any(keyword in text for keyword in vpn_keywords):
        return UnderstandingResult(
            intent="troubleshoot_vpn",
            category="Network",
            priority=priority,
            entities=entities,
            confidence=0.96,
        )

    # ---------------------------------------------------------
    # Password reset
    # ---------------------------------------------------------
    password_keywords = [
        "password reset",
        "reset my password",
        "reset password",
        "forgot my password",
        "forgot password",
        "change my password",
        "password expired",
        "cannot remember my password",
        "can't remember my password",
        "unable to remember my password",
    ]

    if any(keyword in text for keyword in password_keywords):
        return UnderstandingResult(
            intent="reset_password",
            category="Identity",
            priority=priority,
            entities=entities,
            confidence=0.96,
        )

    # ---------------------------------------------------------
    # Software installation
    # ---------------------------------------------------------
    software_keywords = [
        "install software",
        "install the software",
        "software installation",
        "install an application",
        "install application",
        "application installation",
        "need software installed",
        "software installed",
        "application installed",
        "approved software",
        "approved application",
        "download and install",
        "download software",
        "download application",
        "need to install",
        "want to install",
        "please install",
        "can you install",
        "could you install",
    ]

    # Natural-language installation detection.
    is_install_request = (
        re.search(r"\binstall\b", text) is not None
        or re.search(r"\binstallation\b", text) is not None
        or re.search(r"\bdownload\s+and\s+install\b", text) is not None
    )

    if (
        any(keyword in text for keyword in software_keywords)
        or is_install_request
    ):
        return UnderstandingResult(
            intent="install_software",
            category="Software",
            priority=priority,
            entities=entities,
            confidence=0.94,
        )

    # ---------------------------------------------------------
    # Standard access request
    # ---------------------------------------------------------
    access_keywords = [
        "access",
        "permission",
        "permissions",
        "grant access",
        "give me access",
        "need access",
        "request access",
        "access request",
        "privilege",
        "privileges",
    ]

    if any(keyword in text for keyword in access_keywords):
        return UnderstandingResult(
            intent="request_access",
            category="Access",
            priority=priority,
            entities=entities,
            confidence=0.90,
        )

    # ---------------------------------------------------------
    # General IT fallback
    # ---------------------------------------------------------
    return UnderstandingResult(
        intent="unknown",
        category="General IT",
        priority=priority,
        entities=entities,
        confidence=0.55,
    )