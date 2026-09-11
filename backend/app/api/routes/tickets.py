from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"],
)


TicketStatus = Literal[
    "open",
    "verifying",
    "waiting",
    "resolved",
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


TICKETS: list[Ticket] = [
    Ticket(
        id="INC-1042",
        title="VPN connectivity issue",
        category="Network",
        status="resolved",
        assignee="AI Agent",
        updated="12 sec ago",
    ),
    Ticket(
        id="INC-1041",
        title="Password reset",
        category="Identity",
        status="resolved",
        assignee="AI Agent",
        updated="2 min ago",
    ),
    Ticket(
        id="INC-1040",
        title="Software installation",
        category="Software",
        status="resolved",
        assignee="AI Agent",
        updated="3 min ago",
    ),
    Ticket(
        id="INC-1039",
        title="Access request",
        category="Access",
        status="resolved",
        assignee="AI Agent",
        updated="5 min ago",
    ),
]


@router.get(
    "",
    response_model=list[Ticket],
)
def get_tickets() -> list[Ticket]:
    return TICKETS


@router.get(
    "/{ticket_id}",
    response_model=Ticket,
)
def get_ticket(ticket_id: str) -> Ticket:
    for ticket in TICKETS:
        if ticket.id == ticket_id:
            return ticket

    raise HTTPException(
        status_code=404,
        detail=f"Ticket {ticket_id} not found",
    )


@router.patch(
    "/{ticket_id}/status",
    response_model=Ticket,
)
def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusUpdate,
) -> Ticket:
    for ticket in TICKETS:
        if ticket.id == ticket_id:
            ticket.status = payload.status
            ticket.assignee = "AI Agent"
            ticket.updated = datetime.now(
                timezone.utc
            ).isoformat()

            return ticket

    raise HTTPException(
        status_code=404,
        detail=f"Ticket {ticket_id} not found",
    )