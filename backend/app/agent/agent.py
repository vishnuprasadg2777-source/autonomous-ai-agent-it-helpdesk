from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.agent.reasoning.planner import (
    generate_plan,
    plan_to_dict,
)
from backend.app.agent.understanding import understand_request
from backend.app.knowledge.retrieval import retrieve_knowledge
from backend.app.persistence.repository import (
    get_repositories,
    record_agent_run,
)
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


class AgentTrace(BaseModel):
    """
    Human-readable execution trace for the autonomous workflow.
    """

    attempt: int
    stage: str
    action: str | None = None
    status: str
    message: str


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
    trace: list[AgentTrace] = []


STAGE_DEFINITIONS = [
    (
        "understand",
        "01 Understand",
        "Identify the user's intent, category, priority and relevant entities.",
    ),
    (
        "retrieve",
        "02 Retrieve",
        "Retrieve relevant IT helpdesk procedures from the knowledge base.",
    ),
    (
        "observe",
        "03 Observe",
        "Observe the current state of the relevant IT environment.",
    ),
    (
        "reason",
        "04 Reason",
        "Generate a candidate remediation plan from the request, knowledge and observed state.",
    ),
    (
        "policy",
        "05 Policy",
        "Evaluate authorization, risk and policy compliance before taking action.",
    ),
    (
        "execute",
        "06 Execute",
        "Execute an approved action through the controlled tool gateway.",
    ),
    (
        "verify",
        "07 Verify",
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
    status: Literal[
        "open",
        "in_progress",
        "verifying",
        "waiting",
        "resolved",
        "escalated",
    ],
) -> bool:
    """
    Persist an agent-driven ticket status change.

    The persistence repository is used directly rather than making
    the backend call its own HTTP API. This keeps ticket state and
    agent execution inside the same persistence boundary.
    """

    if not ticket_id or ticket_id == "INC-DEMO":
        return True

    repository = get_repositories()

    existing_ticket = repository.get_ticket(ticket_id)

    if existing_ticket is None:
        return False

    previous_status = existing_ticket.status

    # Idempotent status update.
    if previous_status == status:
        return True

    # A previously resolved ticket represents a new request.
    # Reopen it through the repository before moving it into
    # the verification workflow.
    if previous_status == "resolved" and status == "verifying":
        reopened_ticket = repository.transition(
            ticket_id=ticket_id,
            status="in_progress",
        )

        if reopened_ticket is None:
            return False

        repository.append(
            event_type="ticket_status_changed",
            ticket_id=ticket_id,
            payload={
                "from_status": previous_status,
                "to_status": reopened_ticket.status,
                "assignee": reopened_ticket.assignee,
                "timestamp": reopened_ticket.updated_at,
                "source": "agent",
                "reason": "reopened_for_new_agent_request",
            },
        )

        previous_status = reopened_ticket.status

    updated_ticket = repository.transition(
        ticket_id=ticket_id,
        status=status,
    )

    if updated_ticket is None:
        return False

    repository.append(
        event_type="ticket_status_changed",
        ticket_id=ticket_id,
        payload={
            "from_status": previous_status,
            "to_status": updated_ticket.status,
            "assignee": updated_ticket.assignee,
            "timestamp": updated_ticket.updated_at,
            "source": "agent",
        },
    )

    return True


def persist_agent_response(
    request: str,
    response: AgentResponse,
) -> AgentResponse:
    """
    Persist a secret-free structured record of the agent execution.

    Persistence failures must never change the user's agent result.
    """

    try:
        record_agent_run(
            request=request,
            response=response.model_dump(),
        )
    except Exception:
        # Audit persistence must not make an otherwise successful
        # helpdesk execution fail.
        pass

    return response


@router.post("/run", response_model=AgentResponse)
def run_agent(payload: AgentRequest) -> AgentResponse:
    ticket_id = payload.ticket_id or "INC-DEMO"

    trace: list[AgentTrace] = []
    attempt = 1

    def add_trace(
        stage: str,
        status: str,
        message: str,
        action: str | None = None,
    ) -> None:
        trace.append(
            AgentTrace(
                attempt=attempt,
                stage=stage,
                action=action,
                status=status,
                message=message,
            )
        )

    understanding = understand_request(payload.request)

    understanding_dict = {
        "intent": understanding.intent,
        "category": understanding.category,
        "priority": understanding.priority,
        "entities": understanding.entities,
        "confidence": understanding.confidence,
    }

    add_trace(
        stage="understand",
        status="completed",
        message=(
            f"Request understood as '{understanding.intent}' "
            f"with category '{understanding.category}'."
        ),
    )

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

    add_trace(
        stage="retrieve",
        status="completed",
        message=(
            f"Retrieved {len(retrieved_knowledge)} relevant "
            "knowledge-base source(s)."
        ),
    )

    it_state = observe_it_state(understanding.category)
    it_state_dict = state_to_dict(it_state)

    software_name = understanding.entities.get("software")

    if software_name:
        it_state_dict["requested_software"] = software_name

    resource_name = understanding.entities.get("resource")

    if resource_name:
        it_state_dict["requested_resource"] = resource_name

    add_trace(
        stage="observe",
        status="completed",
        message="Current IT environment state was observed.",
    )

    plan = generate_plan(
        intent=understanding.intent,
        category=understanding.category,
        it_state=it_state_dict,
        knowledge_sources=knowledge_sources,
    )

    if plan is None:
        add_trace(
            stage="reason",
            status="blocked",
            message=(
                "No safe remediation plan could be generated. "
                "Escalation required."
            ),
        )

        update_ticket_status(ticket_id, "open")

        response = AgentResponse(
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    plan_dict = plan_to_dict(plan)

    add_trace(
        stage="reason",
        status="completed",
        action=plan.action,
        message=(
            f"Candidate action '{plan.action}' generated with "
            f"risk '{plan.risk}' and confidence {plan.confidence:.2f}."
        ),
    )

    policy = evaluate_policy(
        action=plan.action,
        risk=plan.risk,
        requires_authorization=plan.requires_authorization,
        it_state=it_state_dict,
    )

    policy_dict = policy_to_dict(policy)

    if policy.decision == "blocked":
        add_trace(
            stage="policy",
            status="blocked",
            action=plan.action,
            message=(
                f"Policy blocked action '{plan.action}'. "
                "Human IT intervention is required."
            ),
        )

        update_ticket_status(ticket_id, "escalated")

        response = AgentResponse(
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    if policy.decision == "approval_required":
        add_trace(
            stage="policy",
            status="blocked",
            action=plan.action,
            message=(
                f"Action '{plan.action}' requires administrator approval "
                "before execution."
            ),
        )

        update_ticket_status(ticket_id, "waiting")

        response = AgentResponse(
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    add_trace(
        stage="policy",
        status="completed",
        action=plan.action,
        message=(
            f"Policy allowed action '{plan.action}' "
            f"with risk level '{plan.risk}'."
        ),
    )

    ticket_update_success = update_ticket_status(
        ticket_id,
        "verifying",
    )

    if not ticket_update_success:
        add_trace(
            stage="execute",
            status="blocked",
            action=plan.action,
            message=(
                "The ticket could not be moved to the verifying state. "
                "Execution was stopped safely."
            ),
        )

        response = AgentResponse(
            ticket_id=ticket_id,
            status="escalated",
            message=(
                "The ticket status could not be updated before execution. "
                "The action was not executed."
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    add_trace(
        stage="execute",
        status="running",
        action=plan.action,
        message=(
            f"Executing approved action '{plan.action}' "
            "through the controlled tool gateway."
        ),
    )

    tool_result = execute_tool(
        plan.action,
        parameters=understanding.entities,
    )

    tool_dict = tool_result_to_dict(tool_result)

    if not tool_result.success:
        add_trace(
            stage="execute",
            status="blocked",
            action=plan.action,
            message=(
                "The controlled tool gateway could not complete "
                "the approved action."
            ),
        )

        update_ticket_status(ticket_id, "open")

        response = AgentResponse(
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    add_trace(
        stage="execute",
        status="completed",
        action=plan.action,
        message=(
            f"Controlled action '{plan.action}' executed successfully."
        ),
    )

    observed_state = dict(it_state_dict)
    observed_state.update(tool_result.state_changes)

    observed_state["last_updated"] = datetime.now(
        timezone.utc
    ).isoformat()

    add_trace(
        stage="observe",
        status="completed",
        action=plan.action,
        message=(
            "Post-action IT state was constructed from the "
            "observed state and tool state changes."
        ),
    )

    add_trace(
        stage="verify",
        status="running",
        action=plan.action,
        message=(
            "Comparing expected IT state with the observed "
            "post-action state."
        ),
    )

    verification = verify_state(
        expected_state=plan.expected_state,
        observed_state=observed_state,
    )

    verification_dict = verification_to_dict(verification)

    if not verification.verified:
        add_trace(
            stage="verify",
            status="blocked",
            action=plan.action,
            message=(
                "Verification failed because the expected IT state "
                "was not confirmed."
            ),
        )

        update_ticket_status(ticket_id, "open")

        response = AgentResponse(
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    add_trace(
        stage="verify",
        status="completed",
        action=plan.action,
        message=(
            "Verification succeeded. The observed IT state matches "
            "the expected remediation state."
        ),
    )

    ticket_updated = update_ticket_status(
        ticket_id,
        "resolved",
    )

    if not ticket_updated:
        add_trace(
            stage="verify",
            status="blocked",
            action=plan.action,
            message=(
                "Remediation and verification succeeded, but the "
                "resolved ticket status could not be persisted."
            ),
        )

        response = AgentResponse(
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
            trace=trace,
        )

        return persist_agent_response(payload.request, response)

    add_trace(
        stage="verify",
        status="completed",
        action=plan.action,
        message=(
            "Ticket status persisted as resolved after successful "
            "remediation and verification."
        ),
    )

    response = AgentResponse(
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
        trace=trace,
    )

    return persist_agent_response(payload.request, response)


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