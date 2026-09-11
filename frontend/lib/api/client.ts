const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface Ticket {
  id: string;
  title: string;
  category: string;
  status: "open" | "verifying" | "waiting" | "resolved";
  assignee: string;
  updated: string;
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(`${API_BASE_URL}/api/tickets`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch tickets: ${response.status}`
    );
  }

  return response.json();
}

export async function getTicket(
  ticketId: string
): Promise<Ticket> {
  const response = await fetch(
    `${API_BASE_URL}/api/tickets/${encodeURIComponent(ticketId)}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ticket: ${response.status}`
    );
  }

  return response.json();
}

export interface AgentRunRequest {
  request: string;
  ticket_id?: string;
}

export type AgentStatus =
  | "understanding"
  | "retrieving"
  | "observing"
  | "planning"
  | "evaluating_policy"
  | "executing"
  | "verifying"
  | "resolved"
  | "escalated";

export type AgentStageStatus =
  | "completed"
  | "running"
  | "pending"
  | "blocked";

export interface AgentStage {
  id: string;
  label: string;
  status: AgentStageStatus;
  description: string;
  duration?: string | null;
}

export interface UnderstandingResult {
  intent: string;
  category: string;
  priority: string;
  entities: Record<string, string>;
  confidence: number;
}

export interface RetrievedKnowledge {
  id: string;
  title: string;
  category: string;
  content: string;
  relevance: number;
}

export interface ITState {
  vpn_client?: string;
  network?: string;
  vpn_gateway?: string;
  authentication?: string;
  endpoint?: string;
  last_updated?: string;
  [key: string]: string | undefined;
}

export interface AgentPlan {
  action: string;
  target: string;
  rationale: string;
  expected_state: Record<string, string>;
  risk: string;
  requires_authorization: boolean;
  confidence: number;
}

export type PolicyDecision =
  | "allowed"
  | "approval_required"
  | "blocked";

export interface AgentPolicy {
  action: string;
  decision: PolicyDecision;
  risk: string;
  authorization_required: boolean;
  reason: string;
  policy_id: string;
}

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  message: string;
  state_changes: Record<string, string>;
  output: Record<string, unknown>;
}

export interface VerificationResult {
  status: "verified" | "verification_failed";
  verified: boolean;
  message: string;
  expected_state: Record<string, string>;
  observed_state: Record<string, string>;
  differences: Record<
    string,
    {
      expected: string;
      observed: string;
    }
  >;
}

export interface AgentRunResponse {
  ticket_id: string;
  status: AgentStatus;
  message: string;
  stages: AgentStage[];

  understanding?: UnderstandingResult | null;

  retrieved_knowledge: RetrievedKnowledge[];

  it_state?: ITState | null;

  plan?: AgentPlan | null;

  policy?: AgentPolicy | null;

  tool?: ToolExecutionResult | null;

  verification?: VerificationResult | null;
}

export async function runAgent(
  payload: AgentRunRequest
): Promise<AgentRunResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/agent/run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Agent request failed: ${response.status}`
    );
  }

  return response.json();
}