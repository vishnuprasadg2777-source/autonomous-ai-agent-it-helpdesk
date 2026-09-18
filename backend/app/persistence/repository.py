"""
PHOENIX IT HELPDESK
Persistence Layer

Supported persistence backends:

    PostgreSQL
        Production-style relational persistence.

    SQLite
        Local fallback for demonstrations and environments where
        PostgreSQL is unavailable.

    InMemory
        Test-only repository.

The repository contract remains stable so the rest of PHOENIX does
not need to know which persistence backend is active.
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
    "open": {
        "in_progress",
        "waiting",
        "escalated",
    },
    "in_progress": {
        "verifying",
        "waiting",
        "escalated",
        "open",
    },
    "verifying": {
        "resolved",
        "escalated",
        "open",
    },
    "waiting": {
        "in_progress",
        "escalated",
        "open",
    },
    "resolved": {
        "in_progress",
        "escalated",
    },
    "escalated": {
        "in_progress",
        "open",
    },
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

    def get_ticket(
        self,
        ticket_id: str,
    ) -> TicketRecord | None: ...

    def create_ticket(
        self,
        title: str,
        category: str,
        assignee: str = "Unassigned",
    ) -> TicketRecord: ...

    def transition(
        self,
        ticket_id: str,
        status: str,
    ) -> TicketRecord | None: ...


class AuditRepository(Protocol):
    def append(
        self,
        event_type: str,
        payload: dict[str, Any],
        ticket_id: str | None = None,
    ) -> AuditEvent: ...

    def list_events(
        self,
        limit: int = 100,
    ) -> list[AuditEvent]: ...


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
    """Test-friendly repository."""

    def __init__(self) -> None:
        self.tickets = {
            ticket.id: ticket
            for ticket in _seed_tickets()
        }

        self.events: list[AuditEvent] = []

    def list_tickets(self) -> list[TicketRecord]:
        return sorted(
            self.tickets.values(),
            key=lambda ticket: ticket.updated_at,
            reverse=True,
        )

    def get_ticket(
        self,
        ticket_id: str,
    ) -> TicketRecord | None:
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

        if status not in VALID_TRANSITIONS.get(
            ticket.status,
            set(),
        ):
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

    def list_events(
        self,
        limit: int = 100,
    ) -> list[AuditEvent]:

        return list(
            reversed(
                self.events[-limit:]
            )
        )


class SQLiteRepository:
    """Local SQLite persistence fallback."""

    def __init__(
        self,
        database_path: Path,
    ) -> None:

        self.database_path = database_path

        self.database_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            self.database_path
        )

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
                    (
                        id,
                        title,
                        category,
                        status,
                        assignee,
                        created_at,
                        updated_at
                    )
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
    def _ticket(
        row: sqlite3.Row,
    ) -> TicketRecord:

        return TicketRecord(
            **dict(row)
        )

    def list_tickets(
        self,
    ) -> list[TicketRecord]:

        with self._connect() as connection:

            rows = connection.execute(
                """
                SELECT *
                FROM tickets
                ORDER BY updated_at DESC, id DESC
                """
            ).fetchall()

        return [
            self._ticket(row)
            for row in rows
        ]

    def get_ticket(
        self,
        ticket_id: str,
    ) -> TicketRecord | None:

        with self._connect() as connection:

            row = connection.execute(
                """
                SELECT *
                FROM tickets
                WHERE id = ?
                """,
                (ticket_id,),
            ).fetchone()

        return (
            self._ticket(row)
            if row
            else None
        )

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
                int(
                    str(
                        highest_id["id"]
                    ).split("-")[-1]
                )
                + 1
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
                (
                    id,
                    title,
                    category,
                    status,
                    assignee,
                    created_at,
                    updated_at
                )
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
                """
                SELECT *
                FROM tickets
                WHERE id = ?
                """,
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
                SET
                    status = ?,
                    assignee = ?,
                    updated_at = ?
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
                (
                    timestamp,
                    ticket_id,
                    event_type,
                    payload_json
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    timestamp,
                    ticket_id,
                    event_type,
                    payload_json,
                ),
            )

            event_id = int(
                cursor.lastrowid
            )

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
                payload=json.loads(
                    row["payload_json"]
                ),
            )
            for row in rows
        ]


class PostgreSQLRepository:
    """
    PostgreSQL persistence backend.

    Connection string is read from:

        PHOENIX_DATABASE_URL

    Example:

        postgresql://vishnu@localhost:5432/phoenix_helpdesk
    """

    def __init__(
        self,
        database_url: str,
    ) -> None:

        try:
            import psycopg
        except Exception as exc:
            raise RuntimeError(
                f"PostgreSQL driver unavailable: {exc}"
            ) from exc

        self.database_url = database_url
        self._psycopg = psycopg

        self._initialize()

    def _connect(self):
        return self._psycopg.connect(
            self.database_url
        )

    def _initialize(self) -> None:

        with self._connect() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS tickets (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        category TEXT NOT NULL,
                        status TEXT NOT NULL,
                        assignee TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                    """
                )

                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS audit_events (
                        id BIGSERIAL PRIMARY KEY,
                        timestamp TEXT NOT NULL,
                        ticket_id TEXT,
                        event_type TEXT NOT NULL,
                        payload_json JSONB NOT NULL
                    )
                    """
                )

                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS
                    idx_tickets_updated_at
                    ON tickets(updated_at DESC)
                    """
                )

                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS
                    idx_audit_events_timestamp
                    ON audit_events(timestamp DESC)
                    """
                )

                for ticket in _seed_tickets():

                    cursor.execute(
                        """
                        INSERT INTO tickets
                        (
                            id,
                            title,
                            category,
                            status,
                            assignee,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        ON CONFLICT (id) DO NOTHING
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
    def _ticket(
        row: tuple[Any, ...],
    ) -> TicketRecord:

        return TicketRecord(
            id=str(row[0]),
            title=str(row[1]),
            category=str(row[2]),
            status=str(row[3]),
            assignee=str(row[4]),
            created_at=str(row[5]),
            updated_at=str(row[6]),
        )

    def list_tickets(
        self,
    ) -> list[TicketRecord]:

        with self._connect() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        title,
                        category,
                        status,
                        assignee,
                        created_at,
                        updated_at
                    FROM tickets
                    ORDER BY updated_at DESC, id DESC
                    """
                )

                rows = cursor.fetchall()

        return [
            self._ticket(row)
            for row in rows
        ]

    def get_ticket(
        self,
        ticket_id: str,
    ) -> TicketRecord | None:

        with self._connect() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        title,
                        category,
                        status,
                        assignee,
                        created_at,
                        updated_at
                    FROM tickets
                    WHERE id = %s
                    """,
                    (ticket_id,),
                )

                row = cursor.fetchone()

        return (
            self._ticket(row)
            if row
            else None
        )

    def create_ticket(
        self,
        title: str,
        category: str,
        assignee: str = "Unassigned",
    ) -> TicketRecord:

        timestamp = utc_now()

        with self._connect() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id
                    FROM tickets
                    WHERE id LIKE 'INC-%%'
                    ORDER BY
                        CAST(
                            SUBSTRING(
                                id FROM 5
                            ) AS INTEGER
                        ) DESC
                    LIMIT 1
                    """
                )

                row = cursor.fetchone()

                next_number = (
                    int(
                        str(row[0]).split("-")[-1]
                    ) + 1
                    if row
                    else 1001
                )

                ticket = TicketRecord(
                    id=f"INC-{next_number}",
                    title=title,
                    category=category,
                    status="open",
                    assignee=assignee,
                    created_at=timestamp,
                    updated_at=timestamp,
                )

                cursor.execute(
                    """
                    INSERT INTO tickets
                    (
                        id,
                        title,
                        category,
                        status,
                        assignee,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
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

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        title,
                        category,
                        status,
                        assignee,
                        created_at,
                        updated_at
                    FROM tickets
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (ticket_id,),
                )

                row = cursor.fetchone()

                if row is None:
                    return None

                ticket = self._ticket(row)

                if status not in VALID_TRANSITIONS.get(
                    ticket.status,
                    set(),
                ):
                    return None

                updated_at = utc_now()

                cursor.execute(
                    """
                    UPDATE tickets
                    SET
                        status = %s,
                        assignee = %s,
                        updated_at = %s
                    WHERE id = %s
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

        with self._connect() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO audit_events
                    (
                        timestamp,
                        ticket_id,
                        event_type,
                        payload_json
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s::jsonb
                    )
                    RETURNING id
                    """,
                    (
                        timestamp,
                        ticket_id,
                        event_type,
                        json.dumps(
                            payload,
                            ensure_ascii=False,
                            default=str,
                        ),
                    ),
                )

                event_id = int(
                    cursor.fetchone()[0]
                )

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

        safe_limit = max(
            1,
            min(
                int(limit),
                1000,
            ),
        )

        with self._connect() as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        timestamp,
                        ticket_id,
                        event_type,
                        payload_json
                    FROM audit_events
                    ORDER BY id DESC
                    LIMIT %s
                    """,
                    (safe_limit,),
                )

                rows = cursor.fetchall()

        events: list[AuditEvent] = []

        for row in rows:

            payload = row[4]

            if isinstance(payload, str):
                payload = json.loads(payload)

            events.append(
                AuditEvent(
                    id=int(row[0]),
                    timestamp=str(row[1]),
                    ticket_id=row[2],
                    event_type=str(row[3]),
                    payload=payload,
                )
            )

        return events


def _data_directory() -> Path:

    configured = os.getenv(
        "PHOENIX_DATA_DIR"
    )

    if configured:
        return Path(
            configured
        ).expanduser().resolve()

    return (
        Path(__file__).resolve().parents[2]
        / ".data"
    )


def _database_url() -> str:
    return os.getenv(
        "PHOENIX_DATABASE_URL",
        "postgresql://vishnu@127.0.0.1:5432/phoenix_helpdesk",
    )


@lru_cache(maxsize=1)
def get_repositories():
    """
    Select the persistence backend.

    Default:
        PostgreSQL.

    Explicit alternatives:

        PHOENIX_PERSISTENCE=sqlite
        PHOENIX_PERSISTENCE=memory
    """

    persistence = os.getenv(
        "PHOENIX_PERSISTENCE",
        "postgresql",
    ).strip().lower()

    if persistence == "memory":
        return InMemoryRepository()

    if persistence == "sqlite":
        return SQLiteRepository(
            _data_directory()
            / "phoenix.db"
        )

    if persistence in {
        "postgresql",
        "postgres",
        "postgresql-db",
    }:
        return PostgreSQLRepository(
            _database_url()
        )

    raise RuntimeError(
        f"Unknown persistence backend: {persistence}"
    )


def reset_repositories() -> None:
    """Clear the process-local repository cache."""

    get_repositories.cache_clear()


def record_agent_run(
    request: str,
    response: dict[str, Any],
) -> None:
    """Store secret-free structured agent execution evidence."""

    payload = {
        "request": request,
        "status": response.get("status"),
        "understanding": response.get(
            "understanding"
        ),
        "retrieved_knowledge": response.get(
            "retrieved_knowledge"
        ),
        "pre_action_it_state": response.get(
            "it_state"
        ),
        "plan": response.get(
            "plan"
        ),
        "policy": response.get(
            "policy"
        ),
        "tool": response.get(
            "tool"
        ),
        "verification": response.get(
            "verification"
        ),
        "trace": response.get(
            "trace"
        ),
    }

    get_repositories().append(
        event_type="agent_run",
        ticket_id=response.get(
            "ticket_id"
        ),
        payload=payload,
    )