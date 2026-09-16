"""
PHOENIX IT HELPDESK
LLM Reasoning Layer

The LLM proposes a candidate remediation plan.
It does NOT execute tools and cannot bypass Policy or Verification.
"""

import json
import os
from typing import Any

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

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return None

    try:
        client = OpenAI(api_key=api_key)

        knowledge: list[str] = []

        for source in knowledge_sources[:3]:
            if hasattr(source, "title"):
                knowledge.append(str(source.title))
            elif isinstance(source, dict):
                knowledge.append(str(source.get("title", source)))
            else:
                knowledge.append(str(source))

        context = {
            "intent": intent,
            "category": category,
            "observed_it_state": it_state,
            "retrieved_knowledge": knowledge,
        }

        response = client.responses.create(
            model=os.getenv("PHOENIX_LLM_MODEL", "gpt-5-mini"),
            instructions=SYSTEM_PROMPT,
            input=json.dumps(context, indent=2),
        )

        raw_output = response.output_text.strip()
        plan = json.loads(raw_output)

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

        if action not in ALLOWED_ACTIONS:
            return None

        risk = str(plan["risk"])

        if risk not in {"Low", "Medium", "High"}:
            return None

        confidence = float(plan["confidence"])

        if not 0.0 <= confidence <= 1.0:
            return None

        return {
            "action": action,
            "target": str(plan["target"]),
            "rationale": str(plan["rationale"]),
            "risk": risk,
            "requires_authorization": bool(
                plan["requires_authorization"]
            ),
            "confidence": confidence,
        }

    except Exception:
        # Fail closed.
        # The deterministic planner remains the fallback.
        return None