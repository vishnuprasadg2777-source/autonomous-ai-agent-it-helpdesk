export type AgentStageStatus =
  | "completed"
  | "running"
  | "pending"
  | "blocked";

export interface AgentStage {
  id: string;
  label: string;
  description: string;
  status: AgentStageStatus;
  duration?: string;
}

export interface RetrievedSource {
  id: string;
  title: string;
  category: string;
  relevance: string;
}

export interface ToolExecution {
  id: string;
  name: string;
  description: string;
  status: "completed" | "running" | "blocked";
  result?: string;
}

export const currentAgentRequest = {
  ticketId: "INC-1042",
  title: "VPN connectivity issue",
  request:
    "I cannot connect to the company VPN. Please troubleshoot the issue and restore my connection.",
  requester: "Alex Morgan",
  category: "Network",
  priority: "Medium",
};

export const agentStages: AgentStage[] = [
  {
    id: "understand",
    label: "Request understanding",
    description: "Intent and relevant entities identified",
    status: "completed",
    duration: "0.8s",
  },
  {
    id: "retrieve",
    label: "Knowledge retrieval",
    description: "Relevant VPN troubleshooting procedures retrieved",
    status: "completed",
    duration: "1.2s",
  },
  {
    id: "state",
    label: "IT state observation",
    description: "Current endpoint and VPN state evaluated",
    status: "running",
  },
  {
    id: "reason",
    label: "Reasoning & planning",
    description: "Candidate remediation plan being evaluated",
    status: "pending",
  },
  {
    id: "policy",
    label: "Policy evaluation",
    description: "Authorization and action risk being checked",
    status: "pending",
  },
  {
    id: "execute",
    label: "Controlled execution",
    description: "Approved IT action executed through tool gateway",
    status: "pending",
  },
  {
    id: "verify",
    label: "Verification",
    description: "Expected and observed IT state compared",
    status: "pending",
  },
];

export const retrievedSources: RetrievedSource[] = [
  {
    id: "kb-021",
    title: "VPN connectivity troubleshooting",
    category: "Network / VPN",
    relevance: "96%",
  },
  {
    id: "kb-014",
    title: "VPN client connection procedure",
    category: "Network / Client",
    relevance: "91%",
  },
  {
    id: "kb-008",
    title: "Remote access service requirements",
    category: "Access / Network",
    relevance: "84%",
  },
];

export const toolExecutions: ToolExecution[] = [
  {
    id: "tool-01",
    name: "get_vpn_status",
    description: "Read current VPN connection state",
    status: "running",
  },
  {
    id: "tool-02",
    name: "restart_vpn_client",
    description: "Restart the controlled VPN client",
    status: "blocked",
    result: "Awaiting policy decision",
  },
];

export const policyDecision = {
  action: "restart_vpn_client",
  risk: "Low",
  authorization: "Required",
  decision: "Pending",
  reason:
    "The requested action is available through the controlled tool gateway but requires policy evaluation before execution.",
};