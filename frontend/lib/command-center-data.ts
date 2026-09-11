export type ActivityStatus =
  | "completed"
  | "running"
  | "waiting"
  | "blocked";

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "offline";

export type TicketStatus =
  | "resolved"
  | "verifying"
  | "waiting"
  | "open";

export interface AgentActivityItem {
  id: string;
  ticketId: string;
  title: string;
  stage: string;
  status: ActivityStatus;
  timestamp: string;
}

export interface ITService {
  id: string;
  name: string;
  type: string;
  status: ServiceStatus;
  detail: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  status: TicketStatus;
  assignee: string;
  updated: string;
}

/**
 * Prototype UI metrics.
 *
 * These values are demonstration fixtures for the Command Center.
 * They are not measured results from the project.
 */
export const commandCenterMetrics = [
  {
    id: "open-tickets",
    label: "Open tickets",
    value: "24",
    change: "+8.4%",
    direction: "up" as const,
  },
  {
    id: "autonomous-resolution",
    label: "Autonomous resolution",
    value: "87.6%",
    change: "+4.2%",
    direction: "up" as const,
  },
  {
    id: "agent-executions",
    label: "Agent executions",
    value: "1,284",
    change: "+12.8%",
    direction: "up" as const,
  },
  {
    id: "policy-blocks",
    label: "Policy blocks",
    value: "17",
    change: "-6.1%",
    direction: "down" as const,
  },
];

/**
 * Prototype agent execution activity.
 *
 * Represents the autonomous IT helpdesk pipeline:
 * understand → retrieve → reason → control → execute → verify.
 */
export const agentActivity: AgentActivityItem[] = [
  {
    id: "run-1042",
    ticketId: "INC-1042",
    title: "VPN connectivity issue",
    stage: "Knowledge retrieval",
    status: "running",
    timestamp: "12 sec ago",
  },
  {
    id: "run-1041",
    ticketId: "INC-1041",
    title: "Password reset",
    stage: "Verified resolution",
    status: "completed",
    timestamp: "2 min ago",
  },
  {
    id: "run-1040",
    ticketId: "INC-1040",
    title: "Software installation",
    stage: "Policy evaluation",
    status: "waiting",
    timestamp: "3 min ago",
  },
  {
    id: "run-1039",
    ticketId: "INC-1039",
    title: "Access request",
    stage: "Authorization required",
    status: "blocked",
    timestamp: "5 min ago",
  },
];

/**
 * Prototype IT World state.
 *
 * These represent controlled services visible to the autonomous agent.
 */
export const itServices: ITService[] = [
  {
    id: "vpn-gateway",
    name: "VPN Gateway",
    type: "Network service",
    status: "operational",
    detail: "Connected",
  },
  {
    id: "identity-service",
    name: "Identity Service",
    type: "Authentication",
    status: "operational",
    detail: "Operational",
  },
  {
    id: "endpoint-manager",
    name: "Endpoint Manager",
    type: "Device management",
    status: "operational",
    detail: "Operational",
  },
  {
    id: "software-repository",
    name: "Software Repository",
    type: "Application service",
    status: "operational",
    detail: "Operational",
  },
];

/**
 * Prototype ticket queue.
 *
 * These tickets correspond to the initial Level-1 helpdesk use cases.
 */
export const recentTickets: Ticket[] = [
  {
    id: "INC-1042",
    title: "VPN connectivity issue",
    category: "Network",
    status: "verifying",
    assignee: "AI Agent",
    updated: "12 sec ago",
  },
  {
    id: "INC-1041",
    title: "Password reset",
    category: "Identity",
    status: "resolved",
    assignee: "AI Agent",
    updated: "2 min ago",
  },
  {
    id: "INC-1040",
    title: "Software installation",
    category: "Software",
    status: "waiting",
    assignee: "IT Admin",
    updated: "3 min ago",
  },
  {
    id: "INC-1039",
    title: "Access request",
    category: "Access",
    status: "open",
    assignee: "IT Admin",
    updated: "5 min ago",
  },
];