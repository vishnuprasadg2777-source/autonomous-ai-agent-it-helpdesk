"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTickets, type Ticket } from "@/lib/api/client";

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

type AgentRun = {
  ticket_id: string;
  status: string;
  message: string;
  stages?: {
    id: string;
    label: string;
    status: string;
  }[];
  understanding?: {
    intent: string;
    category: string;
    priority: string;
    confidence: number;
  } | null;
  policy?: {
    action: string;
    decision: string;
    risk: string;
    policy_id: string;
  } | null;
  tool?: {
    tool: string;
    success: boolean;
    message: string;
  } | null;
  verification?: {
    verified: boolean;
    status: string;
    message: string;
  } | null;
};

const pipeline = [
  "Understand",
  "Retrieve",
  "Observe",
  "Reason",
  "Control",
  "Execute",
  "Verify",
];

const services = [
  {
    name: "VPN Gateway",
    type: "Network service",
    detail: "Connected",
  },
  {
    name: "Identity Service",
    type: "Authentication",
    detail: "Operational",
  },
  {
    name: "Endpoint Manager",
    type: "Device management",
    detail: "Operational",
  },
  {
    name: "Software Repository",
    type: "Application service",
    detail: "Operational",
  },
];

const statusStyles: Record<string, string> = {
  running: "text-indigo-300",
  completed: "text-emerald-300",
  resolved: "text-emerald-300",
  verifying: "text-indigo-300",
  waiting: "text-amber-300",
  blocked: "text-red-300",
  escalated: "text-red-300",
  open: "text-amber-300",
};

export default function CommandCenterPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [latestRun, setLatestRun] = useState<AgentRun | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const loadTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadLatestRun = () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setLatestRun(null);
        return;
      }

      setLatestRun(JSON.parse(stored) as AgentRun);
    } catch {
      setLatestRun(null);
    }
  };

  useEffect(() => {
    const handleAgentRun = () => {
      loadLatestRun();
      loadTickets();
    };

    window.addEventListener(AGENT_RUN_EVENT, handleAgentRun);

    const frame = window.requestAnimationFrame(() => {
      loadLatestRun();
      loadTickets();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(AGENT_RUN_EVENT, handleAgentRun);
    };
  }, []);

  const openTickets = tickets.filter(
    (ticket) => ticket.status !== "resolved",
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;

  const aiManagedTickets = tickets.filter(
    (ticket) =>
      ticket.assignee.toLowerCase().includes("ai"),
  ).length;

  const currentStage = useMemo(() => {
    if (!latestRun) {
      return null;
    }

    const runningStage = latestRun.stages?.find(
      (stage) =>
        stage.status === "running" ||
        stage.status === "completed",
    );

    return runningStage?.label ?? "Agent execution";
  }, [latestRun]);

  const pipelineState = useMemo(() => {
    if (!latestRun) {
      return pipeline.map(() => "pending");
    }

    const stageLabels =
      latestRun.stages?.map((stage) => stage.label.toLowerCase()) ?? [];

    return pipeline.map((item, index) => {
      const normalized = item.toLowerCase();

      if (
        stageLabels.some((label) =>
          label.includes(normalized),
        )
      ) {
        const stage = latestRun.stages?.find((entry) =>
          entry.label.toLowerCase().includes(normalized),
        );

        return stage?.status ?? "pending";
      }

      if (
        latestRun.status === "resolved" &&
        index <= pipeline.length - 1
      ) {
        return "completed";
      }

      return index === 0 ? "running" : "pending";
    });
  }, [latestRun]);

  const activityTickets = useMemo(() => {
    if (latestRun) {
      const latestTicket = tickets.find(
        (ticket) => ticket.id === latestRun.ticket_id,
      );

      const others = tickets.filter(
        (ticket) => ticket.id !== latestRun.ticket_id,
      );

      return [
        {
          ticket: latestRun.ticket_id,
          title:
            latestTicket?.title ??
            latestRun.understanding?.category ??
            "IT request",
          stage: currentStage ?? "Agent execution",
          status: latestRun.status,
          time: "Latest execution",
          live: true,
        },
        ...others.slice(0, 3).map((ticket) => ({
          ticket: ticket.id,
          title: ticket.title,
          stage:
            ticket.status === "resolved"
              ? "Verified resolution"
              : "Ticket lifecycle",
          status: ticket.status,
          time: ticket.updated,
          live: false,
        })),
      ];
    }

    return tickets.slice(0, 4).map((ticket) => ({
      ticket: ticket.id,
      title: ticket.title,
      stage:
        ticket.status === "resolved"
          ? "Resolved"
          : "Ticket lifecycle",
      status: ticket.status,
      time: ticket.updated,
      live: false,
    }));
  }, [tickets, latestRun, currentStage]);

  const environmentStatus =
    apiOnline === true
      ? "All systems operational"
      : apiOnline === false
        ? "API unavailable"
        : "Checking systems";

  return (
    <div className="min-h-full px-6 py-7 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-7"
        >
          <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
            <Activity className="h-3.5 w-3.5" />
            AI IT Operations
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-zinc-100">
                Command Center
              </h1>

              <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-zinc-500">
                Observe autonomous IT operations, agent activity, service
                health, policy controls and ticket resolution from one
                workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  apiOnline === false
                    ? "border-red-400/10 bg-red-400/[0.025]"
                    : "border-white/[0.06] bg-white/[0.018]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    apiOnline === true
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.45)]"
                      : apiOnline === false
                        ? "bg-red-400"
                        : "bg-zinc-500"
                  }`}
                />

                <span
                  className={`text-[10px] ${
                    apiOnline === false
                      ? "text-red-300/65"
                      : "text-zinc-500"
                  }`}
                >
                  {environmentStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.push("/agent")}
                className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3.5 py-2 text-[10px] font-medium text-zinc-900 transition hover:bg-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Open Agent
              </button>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Open tickets"
            value={loadingTickets ? "—" : String(openTickets)}
            detail="Live from FastAPI ticket service"
            icon={FileText}
            accent="neutral"
          />

          <MetricCard
            label="Resolved tickets"
            value={loadingTickets ? "—" : String(resolvedTickets)}
            detail={
              latestRun
                ? `Latest: ${latestRun.ticket_id}`
                : "Current ticket inventory"
            }
            icon={CheckCircle2}
            accent="green"
          />

          <MetricCard
            label="AI-managed"
            value={loadingTickets ? "—" : String(aiManagedTickets)}
            detail="Tickets assigned to AI Agent"
            icon={Bot}
            accent="neutral"
          />

          <MetricCard
            label="Policy state"
            value={
              latestRun?.policy?.decision
                ? formatDecision(latestRun.policy.decision)
                : "Active"
            }
            detail={
              latestRun?.policy
                ? `${latestRun.policy.policy_id} · ${latestRun.policy.risk} risk`
                : "Authorization enforced"
            }
            icon={ShieldCheck}
            accent="green"
          />
        </div>

        {/* Agent command strip */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-5 overflow-hidden rounded-xl border border-indigo-400/10 bg-indigo-400/[0.025]"
        >
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-400/15 bg-indigo-400/[0.06]">
                <Bot className="h-4 w-4 text-indigo-300" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-medium text-zinc-200">
                    Autonomous Agent
                  </p>

                  <span className="flex items-center gap-1 text-[8px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {latestRun ? "Live" : "Ready"}
                  </span>
                </div>

                <p className="mt-0.5 text-[9px] text-zinc-600">
                  {latestRun
                    ? `${latestRun.ticket_id} · ${
                        latestRun.understanding?.intent ??
                        "IT request"
                      }`
                    : "Awaiting autonomous agent execution"}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center overflow-x-auto">
              {pipeline.map((item, index) => {
                const state = pipelineState[index];

                const completed =
                  state === "completed";

                const running =
                  state === "running" ||
                  state === "retrieving" ||
                  state === "observing" ||
                  state === "planning" ||
                  state === "evaluating_policy" ||
                  state === "executing" ||
                  state === "verifying";

                return (
                  <div
                    key={item}
                    className="flex shrink-0 items-center"
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        completed
                          ? "text-zinc-300"
                          : running
                            ? "text-indigo-300"
                            : "text-zinc-700"
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : running ? (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_9px_rgba(129,140,248,.55)]" />
                      ) : (
                        <span className="h-2 w-2 rounded-full border border-zinc-700" />
                      )}

                      <span className="text-[8px] font-medium">
                        {item}
                      </span>
                    </div>

                    {index < pipeline.length - 1 && (
                      <ChevronRight className="mx-2 h-3 w-3 text-zinc-800" />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => router.push("/observatory")}
              className="flex shrink-0 items-center gap-1.5 text-[9px] font-medium text-zinc-500 transition hover:text-zinc-300"
            >
              Inspect run
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </motion.section>

        {/* Main operational grid */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          {/* Agent activity */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.018]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-[13px] font-medium text-zinc-200">
                  Agent activity
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  Autonomous executions across the helpdesk queue
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-zinc-600">
                <Activity className="h-3 w-3" />
                {latestRun ? "Live" : "Waiting"}
              </div>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {activityTickets.length > 0 ? (
                activityTickets.map((item, index) => (
                  <Link
                    key={item.ticket}
                    href={`/tickets/${encodeURIComponent(item.ticket)}`}
                    className="group block w-full px-5 py-4 text-left transition-colors hover:bg-white/[0.018] focus-visible:bg-white/[0.025]"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: 0.2 + index * 0.04,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/10">
                          <Bot className="h-3.5 w-3.5 text-zinc-600" />

                          {item.live && (
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,.6)]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-[9px] text-zinc-600">
                              {item.ticket}
                            </code>

                            <span className="text-zinc-800">·</span>

                            <span className="truncate text-[11px] font-medium text-zinc-400">
                              {item.title}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[9px] text-zinc-700">
                              Current stage
                            </span>

                            <span className="truncate text-[9px] text-zinc-500">
                              {item.stage}
                            </span>
                          </div>
                        </div>

                        <div className="hidden text-right sm:block">
                          <p
                            className={`text-[9px] font-medium ${
                              statusStyles[
                                item.status.toLowerCase()
                              ] ?? "text-zinc-500"
                            }`}
                          >
                            {formatStatus(item.status)}
                          </p>

                          <p className="mt-1 text-[8px] text-zinc-700">
                            {item.time}
                          </p>
                        </div>

                        <ChevronRight className="h-3.5 w-3.5 text-zinc-800 transition group-hover:text-zinc-600" />
                      </div>
                    </motion.div>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <FileText className="mx-auto h-5 w-5 text-zinc-700" />

                  <p className="mt-3 text-[11px] text-zinc-500">
                    {loadingTickets
                      ? "Loading ticket activity…"
                      : "No ticket activity available"}
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          {/* IT World */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.018]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-[13px] font-medium text-zinc-200">
                  IT World
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  Current environment state
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/it-world")}
                className="text-[9px] text-zinc-600 transition hover:text-zinc-400"
              >
                View world
              </button>
            </div>

            <div className="p-5">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                    Environment
                  </p>

                  <p className="mt-1 text-[15px] font-medium text-zinc-300">
                    Prototype Runtime
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[22px] font-semibold tracking-[-0.04em] text-zinc-100">
                    {latestRun?.verification
                      ? latestRun.verification.verified
                        ? "100%"
                        : "Check"
                      : "Ready"}
                  </p>

                  <p className="text-[8px] text-emerald-300">
                    World model state
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,.4)]" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] text-zinc-400">
                        {service.name}
                      </p>

                      <p className="mt-0.5 text-[8px] text-zinc-700">
                        {service.type}
                      </p>
                    </div>

                    <span className="text-[8px] text-emerald-300">
                      {service.detail}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-white/[0.05] pt-4">
                <Wifi className="h-3 w-3 text-indigo-300" />

                <span className="text-[9px] text-zinc-600">
                  {latestRun
                    ? `State synchronized · ${latestRun.ticket_id}`
                    : "Awaiting agent observation"}
                </span>

                <span className="ml-auto font-mono text-[8px] text-zinc-700">
                  WORLD.STATE
                </span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Bottom row */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
          {/* Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4 }}
            className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[12px] font-medium text-zinc-300">
                  Ticket operations
                </p>
              </div>

              <span className="font-mono text-[9px] text-zinc-700">
                {loadingTickets ? "—" : `${openTickets} open`}
              </span>
            </div>

            <div className="mt-5 flex items-end gap-6">
              <div>
                <p className="text-[25px] font-semibold tracking-[-0.04em] text-zinc-100">
                  {loadingTickets ? "—" : aiManagedTickets}
                </p>

                <p className="mt-1 text-[9px] text-zinc-700">
                  AI-managed
                </p>
              </div>

              <div>
                <p className="text-[25px] font-semibold tracking-[-0.04em] text-zinc-500">
                  {loadingTickets
                    ? "—"
                    : Math.max(
                        tickets.length - aiManagedTickets,
                        0,
                      )}
                </p>

                <p className="mt-1 text-[9px] text-zinc-700">
                  Other assignment
                </p>
              </div>
            </div>
          </motion.div>

          {/* Governance */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[12px] font-medium text-zinc-300">
                  Governance
                </p>
              </div>

              <span className="flex items-center gap-1 text-[8px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>

            <div className="mt-5 space-y-2.5">
              <GovernanceRow
                label="Policy enforcement"
                active
              />

              <GovernanceRow
                label="Authorization checks"
                active
              />

              <GovernanceRow
                label="Verification layer"
                active
              />

              <GovernanceRow
                label="Human escalation"
                active
              />
            </div>
          </motion.div>

          {/* Observability */}
          <Link
            href="/observatory"
            className="block rounded-xl border border-white/[0.07] bg-white/[0.018] p-5 text-left transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.025]"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-zinc-600" />

                  <p className="text-[12px] font-medium text-zinc-300">
                    Observatory
                  </p>
                </div>

                <span className="text-[8px] text-zinc-700">
                  Live telemetry
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[20px] font-semibold tracking-[-0.035em] text-zinc-100">
                    {latestRun ? "1" : "0"}
                  </p>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    Latest live run
                  </p>
                </div>

                <div>
                  <p className="truncate text-[20px] font-semibold tracking-[-0.035em] text-zinc-100">
                    {latestRun?.status
                      ? formatStatus(latestRun.status)
                      : "Ready"}
                  </p>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    Current state
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Live execution summary */}
        {latestRun && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl border border-indigo-400/10 bg-indigo-400/[0.02]"
          >
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-400/10 bg-indigo-400/[0.04]">
                  <Zap className="h-3.5 w-3.5 text-indigo-300" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-zinc-300">
                    Latest autonomous execution
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-zinc-600">
                    {latestRun.ticket_id} ·{" "}
                    {latestRun.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {latestRun.tool && (
                  <StatusChip
                    label={latestRun.tool.tool}
                    success={latestRun.tool.success}
                  />
                )}

                {latestRun.verification && (
                  <StatusChip
                    label={
                      latestRun.verification.verified
                        ? "Verified"
                        : "Verification mismatch"
                    }
                    success={latestRun.verification.verified}
                  />
                )}

                <Link
                  href={`/tickets/${encodeURIComponent(
                    latestRun.ticket_id,
                  )}`}
                  className="flex items-center gap-1.5 text-[9px] text-zinc-500 transition hover:text-zinc-200"
                >
                  Open ticket
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.05] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock3 className="h-3 w-3 text-zinc-700" />

            <span className="text-[9px] text-zinc-700">
              Phoenix command environment · live prototype state
            </span>
          </div>

          <div className="flex items-center gap-3 text-[9px] text-zinc-700">
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3" />
              Controlled tools
            </span>

            <span>·</span>

            <span className="flex items-center gap-1.5">
              <TriangleAlert className="h-3 w-3" />
              Human escalation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "neutral" | "green";
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 transition-colors hover:bg-white/[0.025]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-[0.13em] text-zinc-600">
          {label}
        </span>

        <Icon
          className={`h-3.5 w-3.5 ${
            accent === "green"
              ? "text-emerald-400/60"
              : "text-zinc-600"
          }`}
        />
      </div>

      <div className="mt-3">
        <span className="text-[25px] font-semibold tracking-[-0.04em] text-zinc-100">
          {value}
        </span>
      </div>

      <p className="mt-1 truncate text-[9px] text-zinc-700">
        {detail}
      </p>
    </motion.div>
  );
}

function GovernanceRow({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-zinc-600">
        {label}
      </span>

      {active ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      ) : (
        <XCircle className="h-3 w-3 text-zinc-700" />
      )}
    </div>
  );
}

function StatusChip({
  label,
  success,
}: {
  label: string;
  success: boolean;
}) {
  return (
    <span
      className={`rounded-md border px-2 py-1 font-mono text-[8px] ${
        success
          ? "border-emerald-400/10 bg-emerald-400/[0.035] text-emerald-300/65"
          : "border-red-400/10 bg-red-400/[0.035] text-red-300/65"
      }`}
    >
      {label}
    </span>
  );
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDecision(decision: string) {
  return decision
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}