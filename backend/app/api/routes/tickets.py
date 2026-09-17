from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.persistence.repository import (
    get_repositories,
)


router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"],
)


TicketStatus = Literal[
    "open",
    "in_progress",
    "verifying",
    "waiting",
    "resolved",
    "escalated",
]


class Ticket(BaseModel):
    id: str
    title: str
    category: str
    status: TicketStatus
    assignee: str
    updated: str


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


def _ticket_to_api(ticket) -> Ticket:
    """
    Convert the persistence-layer ticket record into the
    existing API response shape expected by the frontend.
    """

    return Ticket(
        id=ticket.id,
        title=ticket.title,
        category=ticket.category,
        status=ticket.status,
        assignee=ticket.assignee,
        updated=ticket.updated_at,
    )


@router.get(
    "",
    response_model=list[Ticket],
)
def get_tickets() -> list[Ticket]:
    """
    Return tickets from the configured persistence repository.
    """

    repository = get_repositories()

    return [
        _ticket_to_api(ticket)
        for ticket in repository.list_tickets()
    ]


@router.get(
    "/{ticket_id}",
    response_model=Ticket,
)
def get_ticket(ticket_id: str) -> Ticket:
    """
    Return a single persisted ticket.
    """

    repository = get_repositories()
    ticket = repository.get_ticket(ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail=f"Ticket {ticket_id} not found",
        )

    return _ticket_to_api(ticket)


@router.patch(
    "/{ticket_id}/status",
    response_model=Ticket,
)
def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusUpdate,
) -> Ticket:
    """
    Persist a ticket status transition.

    The repository validates whether the requested transition
    is allowed. Invalid transitions are rejected instead of
    silently changing ticket state.
    """

    repository = get_repositories()

    # Read the current ticket before changing it so that
    # the audit record contains the real previous status.
    existing_ticket = repository.get_ticket(ticket_id)

    if existing_ticket is None:
        raise HTTPException(
            status_code=404,
            detail=f"Ticket {ticket_id} not found",
        )

    previous_status = existing_ticket.status

    # Keep the operation idempotent.
    # If the ticket already has the requested status,
    # return the current ticket without creating a duplicate
    # status-change audit event.
    if previous_status == payload.status:
        return _ticket_to_api(existing_ticket)

    updated_ticket = repository.transition(
        ticket_id=ticket_id,
        status=payload.status,
    )

    if updated_ticket is None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Invalid ticket status transition: "
                f"{previous_status} -> {payload.status}"
            ),
        )

    # The repository generates and persists the authoritative
    # UTC timestamp in updated_at.
    repository.append(
        event_type="ticket_status_changed",
        ticket_id=ticket_id,
        payload={
            "from_status": previous_status,
            "to_status": updated_ticket.status,
            "assignee": updated_ticket.assignee,
            "timestamp": updated_ticket.updated_at,
        },
    )

    return _ticket_to_api(updated_ticket)