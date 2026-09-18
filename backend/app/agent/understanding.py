from dataclasses import dataclass
import re


@dataclass
class UnderstandingResult:
    intent: str
    category: str
    priority: str
    entities: dict[str, str]
    confidence: float


def _contains_any(text: str, phrases: list[str]) -> bool:
    return any(phrase in text for phrase in phrases)


def _extract_priority(text: str) -> str:
    high_priority = [
        "critical",
        "urgent",
        "immediately",
        "as soon as possible",
        "right now",
        "emergency",
        "outage",
        "everything is down",
        "system is down",
        "service is down",
    ]

    low_priority = [
        "low priority",
        "when possible",
        "when convenient",
        "not urgent",
        "no rush",
        "whenever possible",
    ]

    if _contains_any(text, high_priority):
        return "high"

    if _contains_any(text, low_priority):
        return "low"

    return "medium"


def _clean_entity(value: str) -> str:
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    value = value.strip(" .,!?;:'\"")

    return value


def _extract_software(text: str) -> str | None:
    """
    Extract software/application names from natural-language requests.

    Examples:
        install Microsoft Teams
        please install Google Chrome
        I need Zoom installed
        download and install VS Code
        can you install the SAP client on my laptop
    """

    patterns = [
        # install/download + application name
        r"\b(?:install|download\s+and\s+install|download)\s+"
        r"(?:the\s+)?(.+?)"
        r"(?=\s+(?:on|onto)\s+(?:my|the)\s+"
        r"(?:computer|device|laptop|pc|machine)\b|[.,!?;]|$)",

        # application/software called/named X
        r"\b(?:software|application|program|app)\s+"
        r"(?:called|named)\s+(.+?)(?=[.,!?;]|$)",

        # I need/want X installed
        r"\b(?:need|want|require)\s+"
        r"(.+?)\s+(?:software|application|program|app)"
        r"\s+(?:installed|installation)\b",

        # X installed on my computer
        r"\b(?:need|want|require)\s+"
        r"(.+?)\s+installed\s+(?:on|onto)\s+"
        r"(?:my|the)\s+(?:computer|device|laptop|pc|machine)\b",
    ]

    generic_words = {
        "the",
        "a",
        "an",
        "software",
        "application",
        "program",
        "app",
        "and",
        "install",
        "download",
        "please",
        "it",
        "this",
        "that",
        "approved",
        "requested",
        "computer",
        "device",
        "laptop",
        "pc",
        "machine",
        "my",
        "the computer",
        "my computer",
        "the device",
        "my device",
        "the laptop",
        "my laptop",
        "the pc",
        "my pc",
    }

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if not match:
            continue

        candidate = _clean_entity(match.group(1))

        candidate = re.sub(
            r"\s+(?:on|onto)\s+(?:my|the)\s+"
            r"(?:computer|device|laptop|pc|machine)$",
            "",
            candidate,
            flags=re.IGNORECASE,
        )

        candidate = re.sub(
            r"\s+(?:software|application|program|app)$",
            "",
            candidate,
            flags=re.IGNORECASE,
        )

        candidate = _clean_entity(candidate)

        if not candidate:
            continue

        if candidate.lower() in generic_words:
            continue

        return candidate.title()

    return None


def _extract_access_resource(text: str) -> str | None:
    """
    Extract the resource/application/system for an access request.

    Examples:
        I need access to Salesforce
        give me permission for SAP
        request access to the finance portal
        I need access to the HR application
    """

    patterns = [
        r"\baccess\s+(?:to|for)\s+(?:the\s+)?"
        r"(.+?)(?=[.,!?;]|$)",

        r"\bpermission\s+(?:to|for)\s+(?:the\s+)?"
        r"(.+?)(?=[.,!?;]|$)",

        r"\bpermissions?\s+(?:to|for)\s+(?:the\s+)?"
        r"(.+?)(?=[.,!?;]|$)",
    ]

    excluded = {
        "the",
        "a",
        "an",
        "requested",
        "request",
        "application",
        "system",
        "resource",
        "this",
        "that",
        "it",
    }

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if not match:
            continue

        candidate = _clean_entity(match.group(1))

        # Remove trailing request language.
        candidate = re.sub(
            r"\s+(?:please|for me|as soon as possible)$",
            "",
            candidate,
            flags=re.IGNORECASE,
        )

        candidate = _clean_entity(candidate)

        if candidate.lower() not in excluded and candidate:
            return candidate

    return None


def _is_privileged_request(text: str) -> bool:
    """
    Detect requests for elevated/administrative privileges.

    These requests must be classified separately from ordinary
    application/resource access so the policy layer can enforce
    privileged-access controls.
    """

    privileged_phrases = [
        "administrator access",
        "administrator privileges",
        "administrator permission",
        "administrator rights",
        "administrative access",
        "administrative privileges",
        "administrative permission",
        "administrative rights",
        "admin access",
        "admin privileges",
        "admin permission",
        "admin rights",
        "root access",
        "root privileges",
        "root permission",
        "root rights",
        "superuser access",
        "superuser privileges",
        "superuser permission",
        "superuser rights",
        "elevated access",
        "elevated privileges",
        "elevated permission",
        "elevated rights",
        "privileged access",
        "privileged privileges",
        "privileged permission",
        "privileged rights",
        "grant admin",
        "grant administrator",
        "give me admin",
        "give me administrator",
        "give administrator",
        "give admin",
        "make me administrator",
        "make me admin",
        "make me an administrator",
        "make me an admin",
        "disable security controls",
        "disable security",
        "bypass security",
        "bypass authentication",
        "bypass access control",
        "disable antivirus",
        "disable the antivirus",
        "disable endpoint protection",
        "disable the endpoint protection",
        "disable firewall",
        "disable the firewall",
        "disable the login authentication",
        "disable login authentication",
        "disable the login authentication requirement",
        "disable login authentication requirement",
        "disable authentication",
        "disable the authentication",
        "disable authentication requirement",
        "disable the authentication requirement",
        "disable login verification",
        "disable the login verification",
        "remove authentication",
        "remove the authentication",
        "remove authentication requirement",
        "remove the authentication requirement",
        "turn off authentication",
        "turn off the authentication",
        "turn off login authentication",
        "turn off the login authentication",
        "without authentication",
        "without verification",
        "bypass login",
        "bypass login verification",
    ]

    return _contains_any(text, privileged_phrases)


def _is_vpn_request(text: str) -> bool:
    vpn_terms = [
        "vpn",
        "virtual private network",
        "remote access",
        "remote connection",
        "cannot connect remotely",
        "can't connect remotely",
        "unable to connect remotely",
    ]

    return _contains_any(text, vpn_terms)


def _is_password_request(text: str) -> bool:
    password_terms = [
        "password",
        "forgot my password",
        "forgot password",
        "forgotten password",
        "password reset",
        "reset password",
        "reset my password",
        "change my password",
        "password expired",
        "password has expired",
        "password is expired",
        "cannot remember my password",
        "can't remember my password",
        "unable to remember my password",
        "locked out of my account",
        "account locked",
        "login password",
    ]

    return _contains_any(text, password_terms)


def _is_software_install_request(text: str) -> bool:
    installation_terms = [
        "install",
        "installation",
        "download and install",
        "software installation",
        "application installation",
        "get this software installed",
        "get the software installed",
        "get this application installed",
        "get the application installed",
    ]

    return _contains_any(text, installation_terms)


def _is_access_request(text: str) -> bool:
    access_terms = [
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
        "rights",
    ]

    return _contains_any(text, access_terms)


def _build_entities(text: str) -> dict[str, str]:
    entities: dict[str, str] = {}

    software = _extract_software(text)

    if software:
        entities["software"] = software

    resource = _extract_access_resource(text)

    if resource:
        entities["resource"] = resource

    return entities


def understand_request(request: str) -> UnderstandingResult:
    """
    Convert the user's natural-language request into a structured
    understanding used by retrieval, reasoning and policy.

    The ticket ID is deliberately not considered here. The request
    text is the source of the intent and entities.
    """

    text = request.lower().strip()

    if not text:
        return UnderstandingResult(
            intent="unknown",
            category="General IT",
            priority="medium",
            entities={},
            confidence=0.10,
        )

    priority = _extract_priority(text)
    entities = _build_entities(text)

    # ---------------------------------------------------------
    # 1. Privileged/security-sensitive requests
    #
    # This is deliberately checked first so:
    # "give me admin access to Salesforce"
    # does NOT become ordinary application access.
    # ---------------------------------------------------------

    if _is_privileged_request(text):
        entities.setdefault("resource", "privileged_system")

        return UnderstandingResult(
            intent="request_privileged_access",
            category="Access",
            priority="high",
            entities=entities,
            confidence=0.98,
        )

    # ---------------------------------------------------------
    # 2. VPN / remote connectivity
    # ---------------------------------------------------------

    if _is_vpn_request(text):
        return UnderstandingResult(
            intent="troubleshoot_vpn",
            category="Network",
            priority=priority,
            entities=entities,
            confidence=0.96,
        )

    # ---------------------------------------------------------
    # 3. Password / account recovery
    # ---------------------------------------------------------

    if _is_password_request(text):
        return UnderstandingResult(
            intent="reset_password",
            category="Identity",
            priority=priority,
            entities=entities,
            confidence=0.96,
        )

    # ---------------------------------------------------------
    # 4. Software/application installation
    # ---------------------------------------------------------

    if _is_software_install_request(text):
        if "software" not in entities and (
            "approved software" in text
            or "approved application" in text
        ):
            entities["software"] = "approved_software"

        return UnderstandingResult(
            intent="install_software",
            category="Software",
            priority=priority,
            entities=entities,
            confidence=0.94,
        )

    # ---------------------------------------------------------
    # 5. Standard access request
    # ---------------------------------------------------------

    if _is_access_request(text):
        entities.setdefault("resource", "requested_resource")

        return UnderstandingResult(
            intent="request_access",
            category="Access",
            priority=priority,
            entities=entities,
            confidence=0.90,
        )

    # ---------------------------------------------------------
    # 6. General IT fallback
    # ---------------------------------------------------------

    return UnderstandingResult(
        intent="unknown",
        category="General IT",
        priority=priority,
        entities=entities,
        confidence=0.55,
    )