"""SQLite-backed local persistence for tickets and audit evidence.

The default is deliberately local and dependency-free.  It gives the prototype
repeatable ticket and audit history without claiming an enterprise database.
"""

from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol


TICKET_STATUSES = {
    "open",
    "in_progress",
    "verifying",
    "waiting",
    "resolved",
    "escalated",
}

VALID_TRANSITIONS: dict[str, set[str]] = {
    "open": {"in_progress", "waiting", "escalated"},
    "in_progress": {"verifying", "waiting", "escalated", "open"},
    "verifying": {"resolved", "escalated", "open"},
    "waiting": {"in_progress", "escalated", "open"},
    # A new request can reopen a resolved or escalated demonstration ticket.
    # A resolved ticket can also be escalated when a new safety-sensitive
    # request is blocked by policy.
    "resolved": {"in_progress", "escalated"},
    "escalated": {"in_progress", "open"},
}


@dataclass(frozen=True)
class TicketRecord:
    id: str
    title: str
    category: str
    status: str
    assignee: str
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class AuditEvent:
    id: int
    timestamp: str
    ticket_id: str | None
    event_type: str
    payload: dict[str, Any]


class TicketRepository(Protocol):
    def list_tickets(self) -> list[TicketRecord]: ...

    def get_ticket(self, ticket_id: str) -> TicketRecord | None: ...

    def create_ticket(
        self, title: str, category: str, assignee: str = "Unassigned"
    ) -> TicketRecord: ...

    def transition(self, ticket_id: str, status: str) -> TicketRecord | None: ...


class AuditRepository(Protocol):
    def append(
        self,
        event_type: str,
        payload: dict[str, Any],
        ticket_id: str | None = None,
    ) -> AuditEvent: ...

    def list_events(self, limit: int = 100) -> list[AuditEvent]: ...


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed_tickets() -> list[TicketRecord]:
    timestamp = utc_now()
    return [
        TicketRecord(
            id="INC-1042",
            title="VPN connectivity issue",
            category="Network",
            status="resolved",
            assignee="AI Agent",
            created_at=timestamp,
            updated_at=timestamp,
        ),
        TicketRecord(
            id="INC-1041",
            title="Password reset",
            category="Identity",
            status="resolved",
            assignee="AI Agent",
            created_at=timestamp,
            updated_at=timestamp,
        ),
        TicketRecord(
            id="INC-1040",
            title="Software installation",
            category="Software",
            status="resolved",
            assignee="AI Agent",
            created_at=timestamp,
            updated_at=timestamp,
        ),
        TicketRecord(
            id="INC-1039",
            title="Access request",
            category="Access",
            status="resolved",
            assignee="AI Agent",
            created_at=timestamp,
            updated_at=timestamp,
        ),
    ]


class InMemoryRepository:
    """Test-friendly repository that follows the same contract as SQLite."""

    def __init__(self) -> None:
        self.tickets = {ticket.id: ticket for ticket in _seed_tickets()}
        self.events: list[AuditEvent] = []

    def list_tickets(self) -> list[TicketRecord]:
        return sorted(
            self.tickets.values(),
            key=lambda ticket: ticket.updated_at,
            reverse=True,
        )

    def get_ticket(self, ticket_id: str) -> TicketRecord | None:
        return self.tickets.get(ticket_id)

    def create_ticket(
        self,
        title: str,
        category: str,
        assignee: str = "Unassigned",
    ) -> TicketRecord:
        timestamp = utc_now()

        ticket = TicketRecord(
            id=f"INC-{1000 + len(self.tickets) + 1}",
            title=title,
            category=category,
            status="open",
            assignee=assignee,
            created_at=timestamp,
            updated_at=timestamp,
        )

        self.tickets[ticket.id] = ticket

        return ticket

    def transition(
        self,
        ticket_id: str,
        status: str,
    ) -> TicketRecord | None:
        ticket = self.tickets.get(ticket_id)

        if ticket is None:
            return None

        if status not in VALID_TRANSITIONS.get(ticket.status, set()):
            return None

        updated = TicketRecord(
            **{
                **asdict(ticket),
                "status": status,
                "assignee": "AI Agent",
                "updated_at": utc_now(),
            }
        )

        self.tickets[ticket_id] = updated

        return updated

    def append(
        self,
        event_type: str,
        payload: dict[str, Any],
        ticket_id: str | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            id=len(self.events) + 1,
            timestamp=utc_now(),
            ticket_id=ticket_id,
            event_type=event_type,
            payload=payload,
        )

        self.events.append(event)

        return event

    def list_events(self, limit: int = 100) -> list[AuditEvent]:
        return list(reversed(self.events[-limit:]))


class SQLiteRepository:
    """Small, local SQLite repository for reproducible demonstrations."""

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS tickets (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT NOT NULL,
                    assignee TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    ticket_id TEXT,
                    event_type TEXT NOT NULL,
                    payload_json TEXT NOT NULL
                );
                """
            )

            for ticket in _seed_tickets():
                connection.execute(
                    """
                    INSERT OR IGNORE INTO tickets
                    (id, title, category, status, assignee, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ticket.id,
                        ticket.title,
                        ticket.category,
                        ticket.status,
                        ticket.assignee,
                        ticket.created_at,
                        ticket.updated_at,
                    ),
                )

    @staticmethod
    def _ticket(row: sqlite3.Row) -> TicketRecord:
        return TicketRecord(**dict(row))

    def list_tickets(self) -> list[TicketRecord]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM tickets ORDER BY updated_at DESC, id DESC"
            ).fetchall()

        return [self._ticket(row) for row in rows]

    def get_ticket(
        self,
        ticket_id: str,
    ) -> TicketRecord | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?",
                (ticket_id,),
            ).fetchone()

        return self._ticket(row) if row else None

    def create_ticket(
        self,
        title: str,
        category: str,
        assignee: str = "Unassigned",
    ) -> TicketRecord:
        with self._connect() as connection:
            highest_id = connection.execute(
                """
                SELECT id
                FROM tickets
                WHERE id GLOB 'INC-[0-9]*'
                ORDER BY id DESC
                LIMIT 1
                """
            ).fetchone()

            next_number = (
                int(str(highest_id["id"]).split("-")[-1]) + 1
                if highest_id
                else 1001
            )

            timestamp = utc_now()

            ticket = TicketRecord(
                id=f"INC-{next_number}",
                title=title,
                category=category,
                status="open",
                assignee=assignee,
                created_at=timestamp,
                updated_at=timestamp,
            )

            connection.execute(
                """
                INSERT INTO tickets
                (id, title, category, status, assignee, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticket.id,
                    ticket.title,
                    ticket.category,
                    ticket.status,
                    ticket.assignee,
                    ticket.created_at,
                    ticket.updated_at,
                ),
            )

        return ticket

    def transition(
        self,
        ticket_id: str,
        status: str,
    ) -> TicketRecord | None:
        if status not in TICKET_STATUSES:
            return None

        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?",
                (ticket_id,),
            ).fetchone()

            if row is None:
                return None

            ticket = self._ticket(row)

            if status not in VALID_TRANSITIONS.get(
                ticket.status,
                set(),
            ):
                return None

            updated_at = utc_now()

            connection.execute(
                """
                UPDATE tickets
                SET status = ?, assignee = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    status,
                    "AI Agent",
                    updated_at,
                    ticket_id,
                ),
            )

        return TicketRecord(
            **{
                **asdict(ticket),
                "status": status,
                "assignee": "AI Agent",
                "updated_at": updated_at,
            }
        )

    def append(
        self,
        event_type: str,
        payload: dict[str, Any],
        ticket_id: str | None = None,
    ) -> AuditEvent:
        timestamp = utc_now()

        payload_json = json.dumps(
            payload,
            ensure_ascii=False,
            default=str,
        )

        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO audit_events
                (timestamp, ticket_id, event_type, payload_json)
                VALUES (?, ?, ?, ?)
                """,
                (
                    timestamp,
                    ticket_id,
                    event_type,
                    payload_json,
                ),
            )

            event_id = int(cursor.lastrowid)

        return AuditEvent(
            event_id,
            timestamp,
            ticket_id,
            event_type,
            payload,
        )

    def list_events(
        self,
        limit: int = 100,
    ) -> list[AuditEvent]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM audit_events
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [
            AuditEvent(
                id=int(row["id"]),
                timestamp=str(row["timestamp"]),
                ticket_id=row["ticket_id"],
                event_type=str(row["event_type"]),
                payload=json.loads(row["payload_json"]),
            )
            for row in rows
        ]


def _data_directory() -> Path:
    configured = os.getenv("PHOENIX_DATA_DIR")

    if configured:
        return Path(configured).expanduser().resolve()

    return Path(__file__).resolve().parents[2] / ".data"


@lru_cache(maxsize=1)
def get_repositories() -> InMemoryRepository | SQLiteRepository:
    if os.getenv(
        "PHOENIX_PERSISTENCE",
        "sqlite",
    ).lower() == "memory":
        return InMemoryRepository()

    return SQLiteRepository(
        _data_directory() / "phoenix.db"
    )


def reset_repositories() -> None:
    """Clear the process-local repository cache for isolated tests."""

    get_repositories.cache_clear()


def record_agent_run(
    request: str,
    response: dict[str, Any],
) -> None:
    """Store a structured, secret-free summary of an agent execution."""

    payload = {
        "request": request,
        "status": response.get("status"),
        "understanding": response.get("understanding"),
        "retrieved_knowledge": response.get("retrieved_knowledge"),
        "pre_action_it_state": response.get("it_state"),
        "plan": response.get("plan"),
        "policy": response.get("policy"),
        "tool": response.get("tool"),
        "verification": response.get("verification"),
        "trace": response.get("trace"),
    }

    get_repositories().append(
        event_type="agent_run",
        ticket_id=response.get("ticket_id"),
        payload=payload,
    )