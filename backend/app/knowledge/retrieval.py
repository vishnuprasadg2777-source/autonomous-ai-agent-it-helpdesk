import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


@dataclass
class KnowledgeSource:
    id: str
    title: str
    category: str
    content: str
    relevance: float
    source: str = "PHOENIX local knowledge base"
    metadata: dict[str, str] = field(default_factory=dict)


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


class RetrievalBackendUnavailable(RuntimeError):
    """Raised when the optional semantic retrieval backend is unavailable."""


class KnowledgeRetriever(Protocol):
    def retrieve(
        self,
        query: str,
        category: str | None = None,
        limit: int = 3,
    ) -> list[KnowledgeSource]:
        ...


class DeterministicKeywordRetriever:
    """Dependency-light keyword retriever used as the safety fallback."""

    name = "deterministic-keyword"

    def retrieve(
        self,
        query: str,
        category: str | None = None,
        limit: int = 3,
    ) -> list[KnowledgeSource]:

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
                    source=source.source,
                    metadata={
                        **source.metadata,
                        "retrieval_backend": self.name,
                    },
                )
            )

        return results


class ChromaBGERetriever:
    """
    Real semantic retrieval using:

        BAAI/bge-small-en-v1.5
                  ↓
             embeddings
                  ↓
               ChromaDB
                  ↓
          cosine similarity

    The Chroma database is persisted locally under backend/.data/chroma.
    """

    name = "bge-small-en-v1.5 + chromadb"

    def __init__(self) -> None:
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer
        except Exception as exc:
            raise RetrievalBackendUnavailable(
                f"Semantic retrieval dependencies are unavailable: {exc}"
            ) from exc

        self._chromadb = chromadb

        self._embedding_model_name = os.getenv(
            "PHOENIX_EMBEDDING_MODEL",
            "BAAI/bge-small-en-v1.5",
        )

        self._model = SentenceTransformer(
            self._embedding_model_name
        )

        project_root = Path(__file__).resolve().parents[3]

        default_path = project_root / ".data" / "chroma"

        chroma_path = Path(
            os.getenv(
                "PHOENIX_CHROMA_PATH",
                str(default_path),
            )
        )

        chroma_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._client = chromadb.PersistentClient(
            path=str(chroma_path)
        )

        self._collection = self._client.get_or_create_collection(
            name=os.getenv(
                "PHOENIX_CHROMA_COLLECTION",
                "phoenix_knowledge",
            ),
            metadata={
                "description": "PHOENIX IT Helpdesk knowledge base",
                "embedding_model": self._embedding_model_name,
                "distance_metric": "cosine",
            },
        )

        self._ensure_seeded()

    def _ensure_seeded(self) -> None:
        """Seed ChromaDB from the canonical PHOENIX knowledge base."""

        if self._collection.count() >= len(KNOWLEDGE_BASE):
            return

        documents = [
            source.content
            for source in KNOWLEDGE_BASE
        ]

        embeddings = self._model.encode(
            documents,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        ids = [
            source.id
            for source in KNOWLEDGE_BASE
        ]

        metadatas = [
            {
                "title": source.title,
                "category": source.category,
                "source": source.source,
                "base_relevance": str(source.relevance),
            }
            for source in KNOWLEDGE_BASE
        ]

        self._collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    @staticmethod
    def _category_matches(
        source_category: str,
        requested_category: str,
    ) -> bool:
        """
        Match broad PHOENIX categories against hierarchical categories.

        Examples:

            Network
                matches Network / VPN
                matches Network / Client

            Access
                matches Access

            Identity
                matches Identity
        """

        requested = requested_category.strip().lower()
        actual = source_category.strip().lower()

        if not requested:
            return True

        if actual == requested:
            return True

        return actual.startswith(
            f"{requested} /"
        )

    def retrieve(
        self,
        query: str,
        category: str | None = None,
        limit: int = 3,
    ) -> list[KnowledgeSource]:

        text = query.strip()

        if not text:
            return []

        safe_limit = max(
            1,
            min(
                limit,
                len(KNOWLEDGE_BASE),
            ),
        )

        query_embedding = self._model.encode(
            [text],
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        # Always perform semantic retrieval first.
        #
        # Category filtering is intentionally performed locally after
        # retrieval because PHOENIX uses hierarchical categories such as
        # "Network / VPN" and "Network / Client".
        results = self._collection.query(
            query_embeddings=query_embedding,
            n_results=len(KNOWLEDGE_BASE),
            include=[
                "documents",
                "metadatas",
                "distances",
            ],
        )

        documents = results.get(
            "documents",
            [[]],
        )[0]

        metadatas = results.get(
            "metadatas",
            [[]],
        )[0]

        distances = results.get(
            "distances",
            [[]],
        )[0]

        returned_ids = results.get(
            "ids",
            [[]],
        )[0]

        if not documents:
            return []

        source_by_id = {
            source.id: source
            for source in KNOWLEDGE_BASE
        }

        retrieved: list[KnowledgeSource] = []

        for index, document in enumerate(documents):
            metadata = (
                metadatas[index]
                if index < len(metadatas)
                else {}
            )

            source_id = (
                returned_ids[index]
                if index < len(returned_ids)
                else ""
            )

            canonical = source_by_id.get(
                source_id
            )

            title = str(
                metadata.get(
                    "title",
                    canonical.title
                    if canonical
                    else source_id,
                )
            )

            source_category = str(
                metadata.get(
                    "category",
                    canonical.category
                    if canonical
                    else "General IT",
                )
            )

            source_name = str(
                metadata.get(
                    "source",
                    canonical.source
                    if canonical
                    else "PHOENIX local knowledge base",
                )
            )

            if category and not self._category_matches(
                source_category,
                category,
            ):
                continue

            distance = (
                float(distances[index])
                if index < len(distances)
                else 1.0
            )

            # Chroma cosine distance is lower for closer matches.
            # Convert it to the 0-1 relevance representation used
            # throughout PHOENIX.
            similarity = max(
                0.0,
                min(
                    1.0,
                    1.0 - distance,
                ),
            )

            relevance = round(
                min(
                    0.99,
                    similarity,
                ),
                2,
            )

            retrieved.append(
                KnowledgeSource(
                    id=source_id,
                    title=title,
                    category=source_category,
                    content=document,
                    relevance=relevance,
                    source=source_name,
                    metadata={
                        "retrieval_backend": self.name,
                        "embedding_model": self._embedding_model_name,
                        "vector_database": "ChromaDB",
                        "distance": f"{distance:.6f}",
                    },
                )
            )

            if len(retrieved) >= safe_limit:
                break

        return retrieved


def _configured_retriever() -> KnowledgeRetriever:
    """
    Select the configured retrieval backend.

    Default:
        Real BGE + ChromaDB semantic retrieval.

    Optional:
        PHOENIX_RETRIEVAL_BACKEND=keyword
        forces the deterministic fallback.
    """

    backend = os.getenv(
        "PHOENIX_RETRIEVAL_BACKEND",
        "embedding",
    ).strip().lower()

    if backend in {
        "keyword",
        "deterministic",
        "deterministic-keyword",
    }:
        return DeterministicKeywordRetriever()

    if backend in {
        "embedding",
        "vector",
        "chromadb",
        "bge",
        "bge-chromadb",
    }:
        return ChromaBGERetriever()

    raise RetrievalBackendUnavailable(
        f"Unknown retrieval backend: {backend}"
    )


def retrieve_knowledge(
    query: str,
    category: str | None = None,
    limit: int = 3,
) -> list[KnowledgeSource]:
    """
    Retrieve PHOENIX knowledge.

    The default path is real semantic retrieval using
    BAAI/bge-small-en-v1.5 and ChromaDB.

    If the semantic backend is unavailable, PHOENIX safely falls back
    to the deterministic keyword retriever so the autonomous agent
    remains operational.
    """

    try:
        return _configured_retriever().retrieve(
            query,
            category,
            limit,
        )

    except RetrievalBackendUnavailable as exc:
        fallback_results = (
            DeterministicKeywordRetriever().retrieve(
                query,
                category,
                limit,
            )
        )

        for source in fallback_results:
            source.metadata["fallback_reason"] = str(exc)

        return fallback_results

    except Exception as exc:
        # Fail safe: retrieval failure must never prevent the helpdesk
        # agent from operating with its deterministic knowledge layer.
        fallback_results = (
            DeterministicKeywordRetriever().retrieve(
                query,
                category,
                limit,
            )
        )

        for source in fallback_results:
            source.metadata["fallback_reason"] = str(exc)

        return fallback_results