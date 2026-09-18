"""
PHOENIX IT HELPDESK
LLM Reasoning Layer

The LLM proposes a candidate remediation plan.
It does NOT execute tools and cannot bypass Policy or Verification.

Primary local model:
    Qwen2.5-3B-Instruct via Ollama

Optional cloud provider:
    OpenAI
"""

import json
import os
from typing import Any

import httpx
from openai import OpenAI


ALLOWED_ACTIONS = {
    "restart_vpn_client",
    "reset_password",
    "install_software",
    "request_application_access",
    "grant_admin_access",
    "escalate_vpn_troubleshooting",
}


INTENT_ALLOWED_ACTIONS = {
    "troubleshoot_vpn": {
        "restart_vpn_client",
        "escalate_vpn_troubleshooting",
    },
    "reset_password": {
        "reset_password",
    },
    "install_software": {
        "install_software",
    },
    "request_application_access": {
        "request_application_access",
    },
    "request_access": {
        "request_application_access",
    },
    "request_privileged_access": {
        "grant_admin_access",
    },
}


SYSTEM_PROMPT = """
You are the reasoning engine of PHOENIX IT HELPDESK.

Analyze the IT helpdesk request using ONLY the supplied intent,
category, observed IT state, and retrieved knowledge.

Your role is to propose ONE candidate remediation action.

IMPORTANT REASONING GROUNDING RULES:
1. Start with the supplied intent and category.
2. Use only IT-state fields that are directly relevant to that intent.
3. Do NOT treat unrelated state fields as causes of the user's problem.
4. For a VPN request, reason from vpn_client, network, vpn_gateway,
   authentication, and endpoint state. Do not use software_installation
   or access_request as evidence unless the supplied intent explicitly
   concerns those resources.
5. For a password request, reason from identity/authentication-related
   evidence and the supplied knowledge.
6. For software installation, reason from software installation state
   and the requested software.
7. For application access, reason from access_request and the requested
   resource.
8. For privileged access, treat the request as privileged and do not
   recommend bypassing authorization or security controls.
9. Never claim that an unrelated state field caused the user's problem.
10. The rationale MUST be evidence-based and relevant to the requested
    intent.
11. If evidence is insufficient, choose escalation.
12. Never invent IT state.
13. Never invent facts not present in the supplied context.
14. Never convert a state value into a different state or condition.
15. If the observed state says "disconnected", say "disconnected";
    do not infer "not provisioned", "not installed", "unconfigured",
    or any other condition unless that exact evidence is supplied.
16. The rationale may only state facts explicitly present in the
    observed IT state or retrieved knowledge.
17. The selected action must be appropriate for the supplied intent.
18. Never select an action belonging to a different intent.
19. If the supplied evidence does not support a safe action for the
    intent, select the appropriate escalation action when available.

IMPORTANT SAFETY RULES:
1. You never execute an action.
2. You never bypass Policy.
3. You never bypass authorization.
4. You never directly call tools.
5. You never claim that an action has been executed.
6. You never invent IT state.
7. If evidence is insufficient, choose escalation.
8. High-risk privileged access must remain a candidate only;
   the Policy layer decides whether it is allowed.
9. The candidate action MUST be exactly one of the allowed actions.
10. Risk MUST be exactly Low, Medium, or High.
11. requires_authorization MUST be a JSON boolean: true or false.
12. confidence MUST be a JSON number between 0.0 and 1.0.
13. Do not use descriptive text for risk or confidence.
14. Do not invent new action names.
15. Do not add an expected state field unless it is explicitly required
    by the output schema.

Allowed actions:
- restart_vpn_client
- reset_password
- install_software
- request_application_access
- grant_admin_access
- escalate_vpn_troubleshooting

Return ONLY one valid JSON object.
Do not include Markdown.
Do not include explanations outside the JSON object.

The JSON schema is EXACTLY:

{
  "action": "one allowed action",
  "target": "target",
  "rationale": "evidence-based explanation",
  "risk": "Low",
  "requires_authorization": false,
  "confidence": 0.0
}

Field requirements:
- action: exact allowed action string
- target: concise target
- rationale: concise evidence-based explanation using only
  intent-relevant evidence
- risk: exactly "Low", "Medium", or "High"
- requires_authorization: JSON true or false
- confidence: JSON number from 0.0 to 1.0
"""


def _validate_candidate(
    plan: Any,
    intent: str | None = None,
) -> dict[str, Any] | None:
    """
    Treat model output as untrusted input before planning.

    The candidate must first satisfy the global schema and then
    pass intent-to-action compatibility validation.
    """

    if not isinstance(plan, dict):
        return None

    required_fields = {
        "action",
        "target",
        "rationale",
        "risk",
        "requires_authorization",
        "confidence",
    }

    if not required_fields.issubset(plan):
        return None

    action = str(plan["action"]).strip()
    risk = str(plan["risk"]).strip()

    if action not in ALLOWED_ACTIONS:
        return None

    if (
        intent in INTENT_ALLOWED_ACTIONS
        and action not in INTENT_ALLOWED_ACTIONS[intent]
    ):
        return None

    if risk not in {
        "Low",
        "Medium",
        "High",
    }:
        return None

    if not isinstance(
        plan["requires_authorization"],
        bool,
    ):
        return None

    try:
        confidence = float(
            plan["confidence"]
        )
    except (
        TypeError,
        ValueError,
    ):
        return None

    if not 0.0 <= confidence <= 1.0:
        return None

    target = str(
        plan["target"]
    ).strip()

    rationale = str(
        plan["rationale"]
    ).strip()

    if not target or not rationale:
        return None

    return {
        "action": action,
        "target": target,
        "rationale": rationale,
        "risk": risk,
        "requires_authorization": plan[
            "requires_authorization"
        ],
        "confidence": confidence,
    }


def _generate_ollama_plan(
    context: dict[str, Any],
) -> dict[str, Any] | None:
    """Generate a candidate plan using local Qwen through Ollama."""

    base_url = os.getenv(
        "OLLAMA_BASE_URL",
        "http://127.0.0.1:11434",
    ).rstrip("/")

    model = os.getenv(
        "OLLAMA_MODEL",
        "qwen2.5:3b",
    )

    timeout = float(
        os.getenv(
            "PHOENIX_LLM_TIMEOUT_SECONDS",
            "30",
        )
    )

    try:
        response = httpx.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "system": SYSTEM_PROMPT,
                "prompt": json.dumps(
                    context,
                    indent=2,
                ),
                "format": "json",
                "stream": False,
            },
            timeout=timeout,
        )

        response.raise_for_status()

        payload = response.json()

        raw_output = payload.get(
            "response",
            "",
        )

        if not isinstance(
            raw_output,
            str,
        ):
            return None

        raw_output = raw_output.strip()

        if not raw_output:
            return None

        plan = json.loads(
            raw_output
        )

        return _validate_candidate(
            plan,
            context.get("intent"),
        )

    except (
        httpx.HTTPError,
        KeyError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
    ):
        return None


def generate_llm_plan(
    intent: str,
    category: str,
    it_state: dict[str, str],
    knowledge_sources: list[Any],
) -> dict[str, Any] | None:
    """
    Generate a candidate remediation plan.

    Default provider:
        Ollama + Qwen2.5-3B-Instruct

    Optional provider:
        OpenAI

    Returns None when the selected model is unavailable or its
    output fails strict validation. The deterministic planner
    remains the safety fallback.
    """

    if os.getenv(
        "PHOENIX_DISABLE_LLM",
        "",
    ).lower() in {
        "1",
        "true",
        "yes",
    }:
        return None

    context = {
        "intent": intent,
        "category": category,
        "observed_it_state": it_state,
        "retrieved_knowledge": [
            str(source.title)
            if hasattr(
                source,
                "title",
            )
            else str(
                source.get(
                    "title",
                    source,
                )
            )
            if isinstance(
                source,
                dict,
            )
            else str(source)
            for source in knowledge_sources[:3]
        ],
    }

    provider = os.getenv(
        "PHOENIX_LLM_PROVIDER",
        "ollama",
    ).strip().lower()

    if provider == "ollama":
        return _generate_ollama_plan(
            context
        )

    if provider not in {
        "openai",
        "auto",
    }:
        return None

    api_key = os.getenv(
        "OPENAI_API_KEY"
    )

    if not api_key:
        return None

    try:
        client = OpenAI(
            api_key=api_key
        )

        response = client.responses.create(
            model=os.getenv(
                "PHOENIX_LLM_MODEL",
                "gpt-5-mini",
            ),
            instructions=SYSTEM_PROMPT,
            input=json.dumps(
                context,
                indent=2,
            ),
        )

        raw_output = (
            response.output_text.strip()
        )

        plan = json.loads(
            raw_output
        )

        return _validate_candidate(
            plan,
            context.get("intent"),
        )

    except Exception:
        # Fail closed.
        # The deterministic planner remains the fallback.
        return None