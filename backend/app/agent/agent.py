from datetime import datetime, timezone
from typing import Any, Literal

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.agent.reasoning.planner import (
    generate_plan,
    plan_to_dict,
)
from backend.app.agent.understanding import understand_request
from backend.app.knowledge.retrieval import retrieve_knowledge
from backend.app.policy.engine import (
    evaluate_policy,
    policy_to_dict,
)
from backend.app.state.world_model import (
    observe_it_state,
    state_to_dict,
)
from backend.app.tools.gateway import (
    execute_tool,
    tool_result_to_dict,
)
from backend.app.verification.engine import (
    verify_state,
    verification_to_dict,
)


router = APIRouter(
    prefix="/api/agent",
    tags=["AI Agent"],
)


AgentStatus = Literal[
    "understanding",
    "retrieving",
    "observing",
    "planning",
    "evaluating_policy",
    "executing",
    "verifying",
    "resolved",
    "escalated",
]


class AgentRequest(BaseModel):
    request: str = Field(..., min_length=1)
    ticket_id: str | None = None


class AgentStage(BaseModel):
    id: str
    label: str
    status: Literal["completed", "running", "pending", "blocked"]
    description: str
    duration: str | None = None


class AgentResponse(BaseModel):
    ticket_id: str
    status: AgentStatus
    message: str
    stages: list[AgentStage]
    understanding: dict[str, Any] | None = None
    retrieved_knowledge: list[dict[str, Any]] = []
    it_state: dict[str, Any] | None = None
    plan: dict[str, Any] | None = None
    policy: dict[str, Any] | None = None
    tool: dict[str, Any] | None = None
    verification: dict[str, Any] | None = None


STAGE_DEFINITIONS = [
    (
        "understand",
        "Request understanding",
        "Identify the user's intent, category, priority and relevant entities.",
    ),
    (
        "retrieve",
        "Knowledge retrieval",
        "Retrieve relevant IT helpdesk procedures from the knowledge base.",
    ),
    (
        "observe",
        "IT state observation",
        "Observe the current state of the relevant IT environment.",
    ),
    (
        "reason",
        "Reasoning & planning",
        "Generate a candidate remediation plan from the request, knowledge and observed state.",
    ),
    (
        "policy",
        "Policy evaluation",
        "Evaluate authorization, risk and policy compliance before taking action.",
    ),
    (
        "execute",
        "Controlled execution",
        "Execute an approved action through the controlled tool gateway.",
    ),
    (
        "verify",
        "Verification",
        "Compare the observed post-action state with the expected state.",
    ),
]


def make_stages(
    current_stage: str,
    completed_stages: set[str] | None = None,
    blocked_stage: str | None = None,
) -> list[AgentStage]:
    completed_stages = completed_stages or set()

    stages: list[AgentStage] = []

    for stage_id, label, description in STAGE_DEFINITIONS:
        if stage_id in completed_stages:
            status = "completed"
        elif stage_id == blocked_stage:
            status = "blocked"
        elif stage_id == current_stage:
            status = "running"
        else:
            status = "pending"

        stages.append(
            AgentStage(
                id=stage_id,
                label=label,
                status=status,
                description=description,
            )
        )

    return stages


def update_ticket_status(
    ticket_id: str | None,
    status: Literal["open", "verifying", "waiting", "resolved"],
) -> bool:
    """
    Persist a ticket status change through the Ticket API.

    The ticket API is the source of truth for:
    - ticket status
    - exact update timestamp

    This avoids relying on a separate in-memory copy
    of the ticket list.
    """

    if not ticket_id or ticket_id == "INC-DEMO":
        return True

    url = (
        "http://127.0.0.1:8000"
        f"/api/tickets/{ticket_id}/status"
    )

    try:
        response = httpx.patch(
            url,
            json={"status": status},
            timeout=5.0,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPError:
        return False


@router.post("/run", response_model=AgentResponse)
def run_agent(payload: AgentRequest) -> AgentResponse:
    ticket_id = payload.ticket_id or "INC-DEMO"

    # =====================================================
    # 1. REQUEST UNDERSTANDING
    # =====================================================

    understanding = understand_request(payload.request)

    understanding_dict = {
        "intent": understanding.intent,
        "category": understanding.category,
        "priority": understanding.priority,
        "entities": understanding.entities,
        "confidence": understanding.confidence,
    }

    # =====================================================
    # 2. KNOWLEDGE RETRIEVAL
    # =====================================================

    knowledge_sources = retrieve_knowledge(
        payload.request,
        category=understanding.category,
        limit=3,
    )

    retrieved_knowledge = [
        {
            "id": source.id,
            "title": source.title,
            "category": source.category,
            "content": source.content,
            "relevance": source.relevance,
        }
        for source in knowledge_sources
    ]

    # =====================================================
    # 3. IT STATE OBSERVATION
    # =====================================================

    it_state = observe_it_state(understanding.category)
    it_state_dict = state_to_dict(it_state)

    # -----------------------------------------------------
    # Inject request-specific entities into the World Model.
    #
    # This allows the planner and controlled tools to know
    # which software or resource the user requested without
    # changing the underlying deterministic environment.
    # -----------------------------------------------------

    software_name = understanding.entities.get("software")

    if software_name:
        it_state_dict["requested_software"] = software_name

    resource_name = understanding.entities.get("resource")

    if resource_name:
        it_state_dict["requested_resource"] = resource_name

    # =====================================================
    # 4. REASONING & PLANNING
    # =====================================================

    plan = generate_plan(
        intent=understanding.intent,
        category=understanding.category,
        it_state=it_state_dict,
        knowledge_sources=knowledge_sources,
    )

    if plan is None:
        update_ticket_status(ticket_id, "open")

        return AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                "The agent could not generate a safe remediation plan. "
                "The request has been escalated."
            ),
            stages=make_stages(
                current_stage="reason",
                completed_stages={
                    "understand",
                    "retrieve",
                    "observe",
                },
                blocked_stage="reason",
            ),
            understanding=understanding_dict,
            retrieved_knowledge=retrieved_knowledge,
            it_state=it_state_dict,
        )

    plan_dict = plan_to_dict(plan)

    # =====================================================
    # 5. POLICY / AUTHORIZATION / RISK
    # =====================================================

    policy = evaluate_policy(
        action=plan.action,
        risk=plan.risk,
        requires_authorization=plan.requires_authorization,
        it_state=it_state_dict,
    )

    policy_dict = policy_to_dict(policy)

    if policy.decision == "blocked":
        update_ticket_status(ticket_id, "open")

        return AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                f"The planned action '{plan.action}' was blocked by policy. "
                "Human IT intervention is required."
            ),
            stages=make_stages(
                current_stage="policy",
                completed_stages={
                    "understand",
                    "retrieve",
                    "observe",
                    "reason",
                },
                blocked_stage="policy",
            ),
            understanding=understanding_dict,
            retrieved_knowledge=retrieved_knowledge,
            it_state=it_state_dict,
            plan=plan_dict,
            policy=policy_dict,
        )

    if policy.decision == "approval_required":
        update_ticket_status(ticket_id, "waiting")

        return AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                f"The planned action '{plan.action}' requires IT "
                "administrator approval before execution."
            ),
            stages=make_stages(
                current_stage="policy",
                completed_stages={
                    "understand",
                    "retrieve",
                    "observe",
                    "reason",
                },
                blocked_stage="policy",
            ),
            understanding=understanding_dict,
            retrieved_knowledge=retrieved_knowledge,
            it_state=it_state_dict,
            plan=plan_dict,
            policy=policy_dict,
        )

    # =====================================================
    # 6. CONTROLLED TOOL EXECUTION
    # =====================================================

    update_ticket_status(ticket_id, "verifying")

    tool_result = execute_tool(
        plan.action,
        parameters=understanding.entities,
    )

    tool_dict = tool_result_to_dict(tool_result)

    if not tool_result.success:
        update_ticket_status(ticket_id, "open")

        return AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                "The approved action could not be completed through the "
                "controlled tool gateway. Human intervention is required."
            ),
            stages=make_stages(
                current_stage="execute",
                completed_stages={
                    "understand",
                    "retrieve",
                    "observe",
                    "reason",
                    "policy",
                },
                blocked_stage="execute",
            ),
            understanding=understanding_dict,
            retrieved_knowledge=retrieved_knowledge,
            it_state=it_state_dict,
            plan=plan_dict,
            policy=policy_dict,
            tool=tool_dict,
        )

    # =====================================================
    # 7. UPDATE WORLD MODEL AFTER TOOL EXECUTION
    # =====================================================

    observed_state = dict(it_state_dict)
    observed_state.update(tool_result.state_changes)

    observed_state["last_updated"] = datetime.now(
        timezone.utc
    ).isoformat()

    # =====================================================
    # 8. VERIFICATION
    # =====================================================

    verification = verify_state(
        expected_state=plan.expected_state,
        observed_state=observed_state,
    )

    verification_dict = verification_to_dict(verification)

    if not verification.verified:
        update_ticket_status(ticket_id, "open")

        return AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                "The remediation was executed, but verification did not "
                "confirm the expected IT state. The request has been escalated."
            ),
            stages=make_stages(
                current_stage="verify",
                completed_stages={
                    "understand",
                    "retrieve",
                    "observe",
                    "reason",
                    "policy",
                    "execute",
                },
                blocked_stage="verify",
            ),
            understanding=understanding_dict,
            retrieved_knowledge=retrieved_knowledge,
            it_state=it_state_dict,
            plan=plan_dict,
            policy=policy_dict,
            tool=tool_dict,
            verification=verification_dict,
        )

    # =====================================================
    # 9. RESOLUTION
    # =====================================================

    ticket_updated = update_ticket_status(
        ticket_id,
        "resolved",
    )

    if not ticket_updated:
        return AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                "The remediation and verification succeeded, but the "
                "ticket status could not be persisted. Human IT "
                "intervention is required to confirm the ticket state."
            ),
            stages=make_stages(
                current_stage="verify",
                completed_stages={
                    "understand",
                    "retrieve",
                    "observe",
                    "reason",
                    "policy",
                    "execute",
                    "verify",
                },
                blocked_stage="verify",
            ),
            understanding=understanding_dict,
            retrieved_knowledge=retrieved_knowledge,
            it_state=it_state_dict,
            plan=plan_dict,
            policy=policy_dict,
            tool=tool_dict,
            verification=verification_dict,
        )

    return AgentResponse(
        ticket_id=ticket_id,
        status="resolved",
        message=(
            "The request was successfully remediated through the "
            "controlled agent workflow and the resulting IT state "
            "was verified."
        ),
        stages=make_stages(
            current_stage="verify",
            completed_stages={
                "understand",
                "retrieve",
                "observe",
                "reason",
                "policy",
                "execute",
                "verify",
            },
        ),
        understanding=understanding_dict,
        retrieved_knowledge=retrieved_knowledge,
        it_state=it_state_dict,
        plan=plan_dict,
        policy=policy_dict,
        tool=tool_dict,
        verification=verification_dict,
    )


@router.post("/run/demo", response_model=AgentResponse)
def run_demo_agent() -> AgentResponse:
    demo_request = AgentRequest(
        request=(
            "I cannot connect to the company VPN. "
            "Please troubleshoot the issue and restore my connection."
        ),
        ticket_id="INC-1042",
    )

    return run_agent(demo_request)