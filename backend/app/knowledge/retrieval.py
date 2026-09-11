from dataclasses import dataclass


@dataclass
class KnowledgeSource:
    id: str
    title: str
    category: str
    content: str
    relevance: float


KNOWLEDGE_BASE = [
    KnowledgeSource(
        id="KB-021",
        title="VPN Connectivity Troubleshooting",
        category="Network / VPN",
        content=(
            "When a user cannot connect to the company VPN, first verify "
            "the VPN client state, network connectivity, authentication "
            "status, and VPN gateway availability. If the client is "
            "disconnected or unresponsive, a controlled VPN client restart "
            "may be considered subject to applicable policy."
        ),
        relevance=0.96,
    ),
    KnowledgeSource(
        id="KB-014",
        title="VPN Client Connection Procedure",
        category="Network / Client",
        content=(
            "Verify that the approved VPN client is installed and running. "
            "Check the connection state and confirm that the user is "
            "authenticated. If the client is not connected, follow the "
            "approved connection procedure before escalating."
        ),
        relevance=0.91,
    ),
    KnowledgeSource(
        id="KB-008",
        title="Remote Access Service Requirements",
        category="Access / Network",
        content=(
            "Remote access requires an operational endpoint, valid user "
            "authentication, network connectivity, and availability of "
            "the VPN gateway. Administrative privileges should not be "
            "granted as a workaround for standard VPN connectivity issues."
        ),
        relevance=0.84,
    ),
    KnowledgeSource(
        id="KB-031",
        title="Password Reset Procedure",
        category="Identity",
        content=(
            "Password reset requests should verify the user's identity "
            "and follow the approved identity-management procedure."
        ),
        relevance=0.88,
    ),
    KnowledgeSource(
        id="KB-042",
        title="Software Installation Procedure",
        category="Software",
        content=(
            "Software installation requests should verify the requested "
            "application, endpoint eligibility, licensing requirements, "
            "and applicable approval policy."
        ),
        relevance=0.86,
    ),
    KnowledgeSource(
        id="KB-055",
        title="Access Request Procedure",
        category="Access",
        content=(
            "Access requests should identify the requested resource, "
            "requester's role, authorization requirements, and required "
            "approval before privileged access is granted."
        ),
        relevance=0.83,
    ),
]


def retrieve_knowledge(
    query: str,
    category: str | None = None,
    limit: int = 3,
) -> list[KnowledgeSource]:
    """
    Retrieve relevant knowledge sources for an IT request.

    This is the initial deterministic retrieval layer.
    It provides the same interface that can later be backed by
    embeddings and vector search without changing the agent API.
    """

    text = query.strip().lower()

    if not text:
        return []

    keyword_groups = {
        "Network": [
            "vpn",
            "network",
            "connection",
            "connect",
            "remote access",
            "internet",
        ],
        "Identity": [
            "password",
            "login",
            "authentication",
            "account",
        ],
        "Software": [
            "software",
            "application",
            "install",
            "installation",
        ],
        "Access": [
            "access",
            "permission",
            "privilege",
            "resource",
        ],
    }

    scores: list[tuple[KnowledgeSource, float]] = []

    for source in KNOWLEDGE_BASE:
        score = source.relevance * 0.35

        searchable_text = (
            f"{source.title} "
            f"{source.category} "
            f"{source.content}"
        ).lower()

        if category and category.lower() in source.category.lower():
            score += 0.35

        for group, keywords in keyword_groups.items():
            if category and group.lower() != category.lower():
                continue

            for keyword in keywords:
                if keyword in text and keyword in searchable_text:
                    score += 0.12

        for word in text.split():
            if len(word) >= 4 and word in searchable_text:
                score += 0.02

        score = min(score, 0.99)

        scores.append((source, score))

    scores.sort(
        key=lambda item: item[1],
        reverse=True,
    )

    results: list[KnowledgeSource] = []

    for source, score in scores[:limit]:
        results.append(
            KnowledgeSource(
                id=source.id,
                title=source.title,
                category=source.category,
                content=source.content,
                relevance=round(score, 2),
            )
        )

    return results