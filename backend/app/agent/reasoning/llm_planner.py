"""
PHOENIX IT HELPDESK
LLM Reasoning Layer

The LLM proposes a candidate remediation plan.
It does NOT execute tools and cannot bypass Policy or Verification.
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


SYSTEM_PROMPT = """
You are the reasoning engine of PHOENIX IT HELPDESK.

Analyze the IT helpdesk request using ONLY the supplied intent,
category, observed IT state, and retrieved knowledge.

Your role is to propose ONE candidate remediation action.

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

Allowed actions:
- restart_vpn_client
- reset_password
- install_software
- request_application_access
- grant_admin_access
- escalate_vpn_troubleshooting

Return ONLY valid JSON:

{
  "action": "allowed action",
  "target": "target",
  "rationale": "evidence-based explanation",
  "risk": "Low|Medium|High",
  "requires_authorization": true,
  "confidence": 0.0
}

Confidence must be between 0.0 and 1.0.
"""


def _validate_candidate(plan: Any) -> dict[str, Any] | None:
    """Treat model output as untrusted input before passing it to planning."""

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

    action = str(plan["action"])
    risk = str(plan["risk"])

    if action not in ALLOWED_ACTIONS or risk not in {"Low", "Medium", "High"}:
        return None

    if not isinstance(plan["requires_authorization"], bool):
        return None

    try:
        confidence = float(plan["confidence"])
    except (TypeError, ValueError):
        return None

    if not 0.0 <= confidence <= 1.0:
        return None

    target = str(plan["target"]).strip()
    rationale = str(plan["rationale"]).strip()
    if not target or not rationale:
        return None

    return {
        "action": action,
        "target": target,
        "rationale": rationale,
        "risk": risk,
        "requires_authorization": plan["requires_authorization"],
        "confidence": confidence,
    }


def _generate_ollama_plan(context: dict[str, Any]) -> dict[str, Any] | None:
    """Call an explicitly configured local Ollama server, if available."""

    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.2")
    timeout = float(os.getenv("PHOENIX_LLM_TIMEOUT_SECONDS", "15"))

    try:
        response = httpx.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "system": SYSTEM_PROMPT,
                "prompt": json.dumps(context, indent=2),
                "format": "json",
                "stream": False,
            },
            timeout=timeout,
        )
        response.raise_for_status()
        return _validate_candidate(json.loads(response.json()["response"]))
    except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None


def generate_llm_plan(
    intent: str,
    category: str,
    it_state: dict[str, str],
    knowledge_sources: list[Any],
) -> dict[str, Any] | None:
    """
    Generate a candidate remediation plan using an OpenAI model.

    Returns None when the API is unavailable or the response fails
    validation. The deterministic planner can then be used as fallback.
    """

    if os.getenv("PHOENIX_DISABLE_LLM", "").lower() in {"1", "true", "yes"}:
        return None

    context = {
        "intent": intent,
        "category": category,
        "observed_it_state": it_state,
        "retrieved_knowledge": [
            str(source.title)
            if hasattr(source, "title")
            else str(source.get("title", source))
            if isinstance(source, dict)
            else str(source)
            for source in knowledge_sources[:3]
        ],
    }

    provider = os.getenv("PHOENIX_LLM_PROVIDER", "openai").lower()
    if provider == "ollama":
        return _generate_ollama_plan(context)
    if provider not in {"openai", "auto"}:
        return None

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return None

    try:
        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model=os.getenv("PHOENIX_LLM_MODEL", "gpt-5-mini"),
            instructions=SYSTEM_PROMPT,
            input=json.dumps(context, indent=2),
        )

        raw_output = response.output_text.strip()
        plan = json.loads(raw_output)

        return _validate_candidate(plan)

    except Exception:
        # Fail closed.
        # The deterministic planner remains the fallback.
        return None
