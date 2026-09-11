"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  GitBranch,
  Layers3,
  Play,
  RotateCcw,
  ShieldCheck,
  Timer,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AgentRunResponse, AgentStage } from "@/lib/api/client";

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

type RunStatus = "resolved" | "running" | "escalated" | "blocked";

type EventType =
  | "understanding"
  | "retrieval"
  | "observation"
  | "planning"
  | "policy"
  | "execution"
  | "verification";

type AgentRun = {
  id: string;
  ticket: string;
  request: string;
  status: RunStatus;
  started: string;
  duration: string;
  confidence: string;
  toolCalls: number;
  verification: string;
};

type RunEvent = {
  time: string;
  stage: EventType;
  title: string;
  description: string;
  duration: string;
  status: "completed" | "running" | "blocked";
};

const demoRuns: AgentRun[] = [
  {
    id: "RUN-1284",
    ticket: "INC-1042",
    request: "VPN is disconnected and I cannot access internal services.",
    status: "resolved",
    started: "14:02:29",
    duration: "3.42s",
    confidence: "0.96",
    toolCalls: 2,
    verification: "Verified",
  },
  {
    id: "RUN-1283",
    ticket: "INC-1041",
    request: "I forgot my password and need to regain access.",
    status: "resolved",
    started: "13:52:46",
    duration: "2.18s",
    confidence: "0.97",
    toolCalls: 1,
    verification: "Verified",
  },
  {
    id: "RUN-1282",
    ticket: "INC-1040",
    request: "Please install the approved development package on my laptop.",
    status: "resolved",
    started: "13:46:08",
    duration: "0.91s",
    confidence: "0.94",
    toolCalls: 1,
    verification: "Verified",
  },
  {
    id: "RUN-1281",
    ticket: "INC-1039",
    request: "Give me access to the restricted analytics workspace.",
    status: "resolved",
    started: "13:41:32",
    duration: "0.82s",
    confidence: "0.90",
    toolCalls: 1,
    verification: "Verified",
  },
];

const stageConfig: Record<
  EventType,
  { label: string; icon: typeof Bot }
> = {
  understanding: {
    label: "Understanding",
    icon: Bot,
  },
  retrieval: {
    label: "Retrieval",
    icon: Layers3,
  },
  observation: {
    label: "Observation",
    icon: Eye,
  },
  planning: {
    label: "Planning",
    icon: GitBranch,
  },
  policy: {
    label: "Policy",
    icon: ShieldCheck,
  },
  execution: {
    label: "Execution",
    icon: Wrench,
  },
  verification: {
    label: "Verification",
    icon: CheckCircle2,
  },
};

export default function ObservatoryPage() {
  const [selectedRunId, setSelectedRunId] = useState("RUN-1284");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [latestRun, setLatestRun] = useState<AgentRunResponse | null>(null);

  const loadLatestRun = () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setLatestRun(null);
        return;
      }

      const parsed = JSON.parse(stored) as AgentRunResponse;
      setLatestRun(parsed);
    } catch {
      setLatestRun(null);
    }
  };

  useEffect(() => {
  const handleAgentRun = () => {
    loadLatestRun();
  };

  window.addEventListener(AGENT_RUN_EVENT, handleAgentRun);

  const frame = window.requestAnimationFrame(() => {
    loadLatestRun();
  });

  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener(AGENT_RUN_EVENT, handleAgentRun);
  };
}, []);

  const liveRun = useMemo<AgentRun | null>(() => {
    if (!latestRun) {
      return null;
    }

    const completedStages = latestRun.stages.filter(
      (stage) => stage.status === "completed",
    ).length;

    const hasBlockedPolicy =
      latestRun.policy?.decision === "blocked";

    const hasVerificationFailure =
      latestRun.verification?.status === "verification_failed";

    let status: RunStatus = "running";

    if (hasBlockedPolicy) {
      status = "blocked";
    } else if (hasVerificationFailure) {
      status = "escalated";
    } else if (latestRun.status === "resolved") {
      status = "resolved";
    } else if (latestRun.status === "escalated") {
      status = "escalated";
    }

    const duration = latestRun.stages
      .map((stage) => parseDuration(stage.duration))
      .reduce((total, value) => total + value, 0);

    return {
      id: `LIVE-${latestRun.ticket_id}`,
      ticket: latestRun.ticket_id,
      request: latestRun.message,
      status,
      started: "latest",
      duration:
        duration > 0 ? `${duration.toFixed(2)}s` : "runtime",
      confidence: latestRun.understanding
        ? latestRun.understanding.confidence.toFixed(2)
        : "—",
      toolCalls: latestRun.tool ? 1 : 0,
      verification: latestRun.verification
        ? latestRun.verification.verified
          ? "Verified"
          : "Failed"
        : completedStages > 0
          ? "Pending"
          : "—",
    };
  }, [latestRun]);

  const runs = useMemo(() => {
    if (!liveRun) {
      return demoRuns;
    }

    return [
      liveRun,
      ...demoRuns.filter(
        (run) => run.ticket !== liveRun.ticket,
      ),
    ];
  }, [liveRun]);

  const filteredRuns = useMemo(() => {
    if (statusFilter === "All") {
      return runs;
    }

    return runs.filter(
      (run) =>
        run.status === statusFilter.toLowerCase(),
    );
  }, [runs, statusFilter]);

  const selectedRun =
    runs.find((run) => run.id === selectedRunId) ??
    filteredRuns[0] ??
    runs[0];

  const selectedIsLive =
    Boolean(liveRun) && selectedRun.id === liveRun?.id;

  const selectedEvents = selectedIsLive
    ? buildLiveEvents(latestRun)
    : buildDemoEvents(selectedRun);

  const resolvedCount = runs.filter(
    (run) => run.status === "resolved",
  ).length;

  const runningCount = runs.filter(
    (run) => run.status === "running",
  ).length;

  const escalatedCount = runs.filter(
    (run) => run.status === "escalated",
  ).length;

  const blockedCount = runs.filter(
    (run) => run.status === "blocked",
  ).length;

  const refreshObservatory = () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    loadLatestRun();

    window.setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  return (
    <div className="min-h-full bg-[#060708] text-zinc-200">
      <div className="border-b border-white/[0.06] px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-300/[0.1] bg-indigo-300/[0.025]">
                  <Activity className="h-3.5 w-3.5 text-indigo-200/70" />
                </span>

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Operations / Agent Runtime
                </span>

                {latestRun && (
                  <span className="rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.018] px-2 py-0.5 text-[7px] text-emerald-300/60">
                    LIVE DATA
                  </span>
                )}
              </div>

              <h1 className="text-[25px] font-medium tracking-[-0.03em] text-zinc-100">
                Observatory
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-zinc-600">
                Observe autonomous agent runs, execution stages,
                tool calls, policy decisions and verification
                outcomes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.018] px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[9px] text-zinc-500">
                  Agent runtime operational
                </span>
              </div>

              <button
                type="button"
                onClick={refreshObservatory}
                disabled={refreshing}
                className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 text-[9px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw
                  className={`h-3 w-3 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />

                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] md:grid-cols-4">
          <RuntimeMetric
            icon={CheckCircle2}
            value={String(resolvedCount)}
            label="Resolved"
            detail="Verified agent outcomes"
          />

          <RuntimeMetric
            icon={Activity}
            value={String(runningCount)}
            label="Running"
            detail="Active executions"
          />

          <RuntimeMetric
            icon={AlertTriangle}
            value={String(escalatedCount)}
            label="Escalated"
            detail="Awaiting human action"
          />

          <RuntimeMetric
            icon={Ban}
            value={String(blockedCount)}
            label="Policy blocked"
            detail="Prevented executions"
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-zinc-600" />

              <p className="text-[10px] font-medium text-zinc-400">
                Autonomous runtime
              </p>

              <span className="rounded-full border border-indigo-300/[0.08] bg-indigo-300/[0.02] px-2 py-0.5 text-[7px] text-indigo-200/50">
                LIVE
              </span>
            </div>

            <p className="mt-1 text-[8px] text-zinc-700">
              Current operational path across active agent
              executions.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-7">
            <RuntimeStage
              number="01"
              title="Understand"
              detail="Intent + entities"
              icon={Bot}
              active
            />

            <RuntimeStage
              number="02"
              title="Retrieve"
              detail="Knowledge + context"
              icon={Layers3}
              active
            />

            <RuntimeStage
              number="03"
              title="Observe"
              detail="IT world state"
              icon={Eye}
              active
            />

            <RuntimeStage
              number="04"
              title="Reason"
              detail="Plan candidates"
              icon={GitBranch}
              active
            />

            <RuntimeStage
              number="05"
              title="Control"
              detail="Policy + risk"
              icon={ShieldCheck}
              active
            />

            <RuntimeStage
              number="06"
              title="Execute"
              detail="Controlled tools"
              icon={Wrench}
              active
            />

            <RuntimeStage
              number="07"
              title="Verify"
              detail="Expected vs actual"
              icon={CheckCircle2}
              active
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-zinc-400">
                    Agent runs
                  </p>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    {filteredRuns.length} executions in current
                    view
                  </p>
                </div>

                <Timer className="h-3.5 w-3.5 text-zinc-700" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "All",
                  "Resolved",
                  "Running",
                  "Escalated",
                  "Blocked",
                ].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-md border px-2.5 py-1.5 text-[8px] transition ${
                      statusFilter === filter
                        ? "border-indigo-300/[0.12] bg-indigo-300/[0.04] text-indigo-200/70"
                        : "border-white/[0.05] bg-white/[0.012] text-zinc-700 hover:text-zinc-500"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {filteredRuns.map((run, index) => (
                <RunRow
                  key={run.id}
                  run={run}
                  index={index}
                  selected={selectedRun.id === run.id}
                  live={run.id === liveRun?.id}
                  onClick={() => setSelectedRunId(run.id)}
                />
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-indigo-300/[0.08] bg-indigo-300/[0.025]">
                  <Bot className="h-3.5 w-3.5 text-indigo-200/60" />
                </div>

                <div>
                  <p className="text-[10px] font-medium text-zinc-400">
                    Selected agent run
                  </p>

                  <p className="mt-1 font-mono text-[7px] text-zinc-700">
                    {selectedRun.id}
                  </p>
                </div>
              </div>

              <RunStatusBadge status={selectedRun.status} />
            </div>

            <div className="p-5">
              <div className="rounded-lg border border-white/[0.06] bg-black/15 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-700">
                    Incoming request
                  </p>

                  <span className="font-mono text-[7px] text-zinc-800">
                    {selectedRun.ticket}
                  </span>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-zinc-400">
                  {selectedRun.request}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                <RunAttribute
                  label="Started"
                  value={selectedRun.started}
                />

                <RunAttribute
                  label="Duration"
                  value={selectedRun.duration}
                />

                <RunAttribute
                  label="Confidence"
                  value={selectedRun.confidence}
                />

                <RunAttribute
                  label="Tool calls"
                  value={String(selectedRun.toolCalls)}
                />

                <RunAttribute
                  label="Verification"
                  value={selectedRun.verification}
                />
              </div>

              {selectedIsLive && latestRun && (
                <LiveRunSummary result={latestRun} />
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                      Execution timeline
                    </p>

                    <p className="mt-1 text-[8px] text-zinc-700">
                      Complete agent decision and execution
                      trace.
                    </p>
                  </div>

                  <span className="font-mono text-[7px] text-zinc-800">
                    {selectedEvents.length} stages
                  </span>
                </div>

                <div className="mt-4">
                  {selectedEvents.map((event, index) => (
                    <TimelineEvent
                      key={`${event.time}-${event.stage}-${index}`}
                      event={event}
                      last={
                        index === selectedEvents.length - 1
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <SectionHeader
              icon={Activity}
              title="Runtime signals"
              subtitle="Operational indicators from agent activity"
            />

            <div className="divide-y divide-white/[0.05]">
              <SignalRow
                label="Verified resolutions"
                value={
                  latestRun?.verification?.verified
                    ? "Verified"
                    : "Live"
                }
                detail={
                  latestRun
                    ? "Latest agent execution"
                    : "Awaiting live agent execution"
                }
                trend="up"
              />

              <SignalRow
                label="Latest execution"
                value={
                  liveRun?.duration ??
                  "—"
                }
                detail="Derived from the latest agent trace"
                trend="down"
              />

              <SignalRow
                label="Policy decision"
                value={
                  latestRun?.policy?.decision ??
                  "—"
                }
                detail="Latest autonomous control decision"
                trend="neutral"
              />

              <SignalRow
                label="Verification"
                value={
                  latestRun?.verification
                    ? latestRun.verification.verified
                      ? "Passed"
                      : "Failed"
                    : "Pending"
                }
                detail="Expected state compared with observed state"
                trend={
                  latestRun?.verification?.verified
                    ? "up"
                    : "neutral"
                }
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <SectionHeader
              icon={GitBranch}
              title="Control signals"
              subtitle="Where autonomous execution was constrained"
            />

            <div className="p-5">
              <ControlSignal
                icon={ShieldCheck}
                title="Policy evaluation"
                value={latestRun?.policy ? "1" : "—"}
                detail={
                  latestRun?.policy
                    ? `${latestRun.policy.policy_id} returned ${latestRun.policy.decision}.`
                    : "Run an agent execution to populate live policy telemetry."
                }
              />

              <ControlSignal
                icon={Wrench}
                title="Controlled tool call"
                value={latestRun?.tool ? "1" : "0"}
                detail={
                  latestRun?.tool
                    ? `${latestRun.tool.tool} executed through the controlled gateway.`
                    : "No controlled tool execution recorded in the latest run."
                }
              />

              <ControlSignal
                icon={Eye}
                title="State observation"
                value={latestRun?.it_state ? "1" : "0"}
                detail={
                  latestRun?.it_state
                    ? "IT World state was captured before autonomous execution."
                    : "No live world-model state available yet."
                }
              />

              <ControlSignal
                icon={CheckCircle2}
                title="Verification check"
                value={latestRun?.verification ? "1" : "0"}
                detail={
                  latestRun?.verification
                    ? latestRun.verification.message
                    : "Verification will appear after controlled execution."
                }
              />
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-white/[0.06] bg-[#090b0d] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />

            <div>
              <p className="text-[9px] font-medium text-zinc-500">
                Autonomous operations principle
              </p>

              <p className="mt-1 text-[8px] leading-5 text-zinc-700">
                Autonomy is observable at every stage. The system
                records what the agent understood, what knowledge it
                retrieved, what state it observed, which plan it
                selected, what policy decided, which controlled tool
                executed and whether the resulting state was
                verified.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.05] pt-5 text-[8px] text-zinc-700 sm:flex-row">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Agent runtime telemetry and execution trace.
          </div>

          <div className="flex items-center gap-2">
            <span>Understand</span>
            <span>→</span>
            <span>Control</span>
            <span>→</span>
            <span>Execute</span>
            <span>→</span>
            <span>Verify</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function buildLiveEvents(
  result: AgentRunResponse | null,
): RunEvent[] {
  if (!result) {
    return [];
  }

  return result.stages.map((stage, index) =>
    stageToEvent(stage, result, index),
  );
}

function stageToEvent(
  stage: AgentStage,
  result: AgentRunResponse,
  index: number,
): RunEvent {
  const stageMap: Record<string, EventType> = {
    understanding: "understanding",
    retrieving: "retrieval",
    observing: "observation",
    planning: "planning",
    evaluating_policy: "policy",
    executing: "execution",
    verifying: "verification",
    resolved: "verification",
    escalated: "verification",
  };

  const eventStage =
    stageMap[stage.id] ??
    stageMap[stage.id.toLowerCase()] ??
    "observation";

  let description = stage.description;

  if (stage.id === "evaluating_policy" && result.policy) {
    description = `${result.policy.policy_id} returned ${result.policy.decision}. ${result.policy.reason}`;
  }

  if (stage.id === "executing" && result.tool) {
    description = `${result.tool.tool} — ${result.tool.message}`;
  }

  if (stage.id === "verifying" && result.verification) {
    description = result.verification.message;
  }

  const status: RunEvent["status"] =
    stage.status === "blocked"
      ? "blocked"
      : stage.status === "running"
        ? "running"
        : "completed";

  return {
    time: `stage-${String(index + 1).padStart(2, "0")}`,
    stage: eventStage,
    title: stage.label,
    description,
    duration: stage.duration ?? "—",
    status,
  };
}

function buildDemoEvents(run: AgentRun): RunEvent[] {
  if (run.ticket === "INC-1042") {
    return [
      {
        time: "14:02:29.08",
        stage: "understanding",
        title: "Request understood",
        description:
          "Detected VPN connectivity intent and mapped the request to remote-access troubleshooting.",
        duration: "0.18s",
        status: "completed",
      },
      {
        time: "14:02:29.26",
        stage: "retrieval",
        title: "Knowledge retrieved",
        description:
          "Retrieved VPN connectivity and client troubleshooting procedures from the knowledge base.",
        duration: "0.31s",
        status: "completed",
      },
      {
        time: "14:02:29.57",
        stage: "observation",
        title: "IT state observed",
        description:
          "VPN client reported degraded state while the network and gateway remained reachable.",
        duration: "0.29s",
        status: "completed",
      },
      {
        time: "14:02:29.86",
        stage: "planning",
        title: "Candidate plan created",
        description:
          "Selected a controlled VPN client restart as the lowest-risk remediation.",
        duration: "0.41s",
        status: "completed",
      },
      {
        time: "14:02:30.27",
        stage: "policy",
        title: "Policy allowed action",
        description:
          "POL-002 permitted the reversible Level-1 VPN remediation without additional authorization.",
        duration: "0.14s",
        status: "completed",
      },
      {
        time: "14:02:30.41",
        stage: "execution",
        title: "Tool executed",
        description:
          "restart_vpn_client completed through the controlled tool gateway.",
        duration: "1.24s",
        status: "completed",
      },
      {
        time: "14:02:31.65",
        stage: "verification",
        title: "Resolution verified",
        description:
          "Observed VPN state changed from degraded to connected and matched the expected state.",
        duration: "1.77s",
        status: "completed",
      },
    ];
  }

  if (run.ticket === "INC-1041") {
    return [
      {
        time: "13:52:46.12",
        stage: "understanding",
        title: "Password reset intent detected",
        description:
          "Mapped the request to the controlled password-reset workflow.",
        duration: "0.16s",
        status: "completed",
      },
      {
        time: "13:52:46.28",
        stage: "retrieval",
        title: "Reset procedure retrieved",
        description:
          "Retrieved the approved identity-service password reset procedure.",
        duration: "0.27s",
        status: "completed",
      },
      {
        time: "13:52:46.55",
        stage: "observation",
        title: "Identity state observed",
        description:
          "User identity context satisfied the Level-1 reset requirements.",
        duration: "0.24s",
        status: "completed",
      },
      {
        time: "13:52:46.79",
        stage: "planning",
        title: "Reset plan created",
        description:
          "Selected reset_password as the permitted remediation action.",
        duration: "0.31s",
        status: "completed",
      },
      {
        time: "13:52:47.10",
        stage: "policy",
        title: "Policy allowed action",
        description:
          "POL-001 allowed the controlled password reset.",
        duration: "0.12s",
        status: "completed",
      },
      {
        time: "13:52:47.22",
        stage: "execution",
        title: "Password reset executed",
        description:
          "reset_password completed through the identity tool gateway.",
        duration: "0.84s",
        status: "completed",
      },
      {
        time: "13:52:48.06",
        stage: "verification",
        title: "Authentication state verified",
        description:
          "The expected credential state was confirmed after execution.",
        duration: "0.24s",
        status: "completed",
      },
    ];
  }

  if (run.ticket === "INC-1040") {
    return [
      {
        time: "13:46:08.02",
        stage: "understanding",
        title: "Software installation intent detected",
        description:
          "Mapped the request to endpoint software installation.",
        duration: "0.18s",
        status: "completed",
      },
      {
        time: "13:46:08.20",
        stage: "retrieval",
        title: "Installation procedure retrieved",
        description:
          "Retrieved the approved software installation procedure.",
        duration: "0.21s",
        status: "completed",
      },
      {
        time: "13:46:08.41",
        stage: "observation",
        title: "Endpoint state observed",
        description:
          "Managed endpoint was available for the requested operation.",
        duration: "0.17s",
        status: "completed",
      },
      {
        time: "13:46:08.58",
        stage: "planning",
        title: "Installation plan created",
        description:
          "Candidate plan selected install_software for the requested package.",
        duration: "0.20s",
        status: "completed",
      },
      {
        time: "13:46:08.78",
        stage: "policy",
        title: "Policy allowed action",
        description:
          "POL-003 permitted the controlled software installation.",
        duration: "0.08s",
        status: "completed",
      },
      {
        time: "13:46:08.86",
        stage: "execution",
        title: "Software installation executed",
        description:
          "install_software completed through the controlled tool gateway.",
        duration: "0.41s",
        status: "completed",
      },
      {
        time: "13:46:09.27",
        stage: "verification",
        title: "Installation verified",
        description:
          "software_installation changed to installed and matched the expected state.",
        duration: "0.18s",
        status: "completed",
      },
    ];
  }

  return [
    {
      time: "latest",
      stage: "understanding",
      title: "Request processed",
      description:
        "The agent completed the available autonomous workflow.",
      duration: run.duration,
      status: "completed",
    },
  ];
}

function parseDuration(duration?: string | null): number {
  if (!duration) {
    return 0;
  }

  const match = duration.match(
    /([\d.]+)\s*(ms|s)?/i,
  );

  if (!match) {
    return 0;
  }

  const value = Number(match[1]);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return match[2]?.toLowerCase() === "ms"
    ? value / 1000
    : value;
}

function LiveRunSummary({
  result,
}: {
  result: AgentRunResponse;
}) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-3">
      <LiveFact
        label="Intent"
        value={
          result.understanding?.intent ??
          "—"
        }
      />

      <LiveFact
        label="Policy"
        value={
          result.policy
            ? `${result.policy.policy_id} · ${result.policy.decision}`
            : "—"
        }
      />

      <LiveFact
        label="Tool"
        value={
          result.tool?.tool ??
          "Not executed"
        }
      />
    </div>
  );
}

function LiveFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-emerald-300/[0.06] bg-emerald-300/[0.01] p-3">
      <p className="text-[7px] uppercase tracking-[0.09em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 truncate font-mono text-[8px] text-emerald-300/60">
        {value}
      </p>
    </div>
  );
}

function RuntimeMetric({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: typeof Activity;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="bg-[#0b0d0f] px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.018]">
          <Icon className="h-3 w-3 text-zinc-600" />
        </div>

        <span className="font-mono text-[8px] text-zinc-700">
          runtime
        </span>
      </div>

      <p className="mt-4 text-[21px] font-medium tracking-[-0.03em] text-zinc-200">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-0.5 text-[8px] text-zinc-700">
        {detail}
      </p>
    </div>
  );
}

function RuntimeStage({
  number,
  title,
  detail,
  icon: Icon,
  active,
}: {
  number: string;
  title: string;
  detail: string;
  icon: typeof Bot;
  active?: boolean;
}) {
  return (
    <div className="relative bg-[#090b0d] p-4">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md border ${
            active
              ? "border-indigo-300/[0.09] bg-indigo-300/[0.025]"
              : "border-white/[0.05] bg-white/[0.012]"
          }`}
        >
          <Icon
            className={`h-3 w-3 ${
              active
                ? "text-indigo-200/60"
                : "text-zinc-700"
            }`}
          />
        </div>

        <span className="font-mono text-[8px] text-zinc-800">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[9px] font-medium text-zinc-400">
        {title}
      </p>

      <p className="mt-1 text-[7px] leading-4 text-zinc-700">
        {detail}
      </p>

      {active && (
        <span className="absolute right-3 top-3 h-1 w-1 animate-pulse rounded-full bg-indigo-300/60" />
      )}
    </div>
  );
}

function RunRow({
  run,
  index,
  selected,
  live,
  onClick,
}: {
  run: AgentRun;
  index: number;
  selected: boolean;
  live: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.18,
        delay: index * 0.025,
      }}
      onClick={onClick}
      className={`w-full px-5 py-4 text-left transition ${
        selected
          ? "bg-indigo-300/[0.025]"
          : "hover:bg-white/[0.018]"
      }`}
    >
      <div className="flex items-start gap-3">
        <RunStatusIcon status={run.status} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[9px] font-medium text-zinc-400">
                  {run.id}
                </p>

                {live && (
                  <span className="rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.018] px-1.5 py-0.5 text-[6px] text-emerald-300/60">
                    LIVE
                  </span>
                )}
              </div>

              <p className="mt-1 font-mono text-[7px] text-zinc-700">
                {run.ticket}
              </p>
            </div>

            <RunStatusBadge
              status={run.status}
              compact
            />
          </div>

          <p className="mt-3 line-clamp-2 text-[8px] leading-5 text-zinc-700">
            {run.request}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-[7px] text-zinc-700">
              {run.started}
            </span>

            <span className="text-zinc-800">•</span>

            <span className="text-[7px] text-zinc-700">
              {run.duration}
            </span>

            <ChevronRight className="ml-auto h-2.5 w-2.5 text-zinc-800" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function RunStatusIcon({
  status,
}: {
  status: RunStatus;
}) {
  const config = {
    resolved: {
      icon: Check,
      classes:
        "border-emerald-300/[0.08] bg-emerald-300/[0.018] text-emerald-300/60",
    },
    running: {
      icon: Play,
      classes:
        "border-indigo-300/[0.08] bg-indigo-300/[0.018] text-indigo-200/60",
    },
    escalated: {
      icon: AlertTriangle,
      classes:
        "border-amber-300/[0.08] bg-amber-300/[0.018] text-amber-300/60",
    },
    blocked: {
      icon: Ban,
      classes:
        "border-red-300/[0.08] bg-red-300/[0.018] text-red-300/60",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${config.classes}`}
    >
      <Icon className="h-3 w-3" />
    </div>
  );
}

function RunStatusBadge({
  status,
  compact = false,
}: {
  status: RunStatus;
  compact?: boolean;
}) {
  const config = {
    resolved: {
      label: "Resolved",
      dot: "bg-emerald-400",
      border: "border-emerald-300/[0.08]",
      background: "bg-emerald-300/[0.018]",
      text: "text-emerald-300/70",
    },
    running: {
      label: "Running",
      dot: "bg-indigo-300",
      border: "border-indigo-300/[0.08]",
      background: "bg-indigo-300/[0.018]",
      text: "text-indigo-200/70",
    },
    escalated: {
      label: "Escalated",
      dot: "bg-amber-400",
      border: "border-amber-300/[0.08]",
      background: "bg-amber-300/[0.018]",
      text: "text-amber-300/70",
    },
    blocked: {
      label: "Blocked",
      dot: "bg-red-400",
      border: "border-red-300/[0.08]",
      background: "bg-red-300/[0.018]",
      text: "text-red-300/70",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.border} ${config.background} ${
        compact
          ? "px-2 py-1"
          : "px-2.5 py-1.5"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${
          status === "running"
            ? "animate-pulse"
            : ""
        }`}
      />

      <span
        className={`text-[7px] font-medium ${config.text}`}
      >
        {config.label}
      </span>
    </span>
  );
}

function RunAttribute({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.012] p-3">
      <p className="text-[7px] uppercase tracking-[0.09em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 truncate font-mono text-[8px] text-zinc-500">
        {value}
      </p>
    </div>
  );
}

function TimelineEvent({
  event,
  last,
}: {
  event: RunEvent;
  last: boolean;
}) {
  const config = stageConfig[event.stage];
  const Icon = config.icon;

  const isBlocked = event.status === "blocked";
  const isRunning = event.status === "running";

  return (
    <div className="relative flex gap-3">
      {!last && (
        <div className="absolute left-[13px] top-8 h-[calc(100%-8px)] w-px bg-white/[0.05]" />
      )}

      <div
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
          isBlocked
            ? "border-red-300/[0.09] bg-red-300/[0.018]"
            : isRunning
              ? "border-indigo-300/[0.09] bg-indigo-300/[0.018]"
              : "border-white/[0.06] bg-[#0d0f12]"
        }`}
      >
        <Icon
          className={`h-3 w-3 ${
            isBlocked
              ? "text-red-300/60"
              : isRunning
                ? "text-indigo-200/60"
                : "text-zinc-600"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="flex flex-col justify-between gap-1 sm:flex-row">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-medium text-zinc-400">
              {event.title}
            </p>

            <span className="rounded border border-white/[0.04] bg-white/[0.012] px-1.5 py-0.5 text-[6px] uppercase tracking-[0.08em] text-zinc-700">
              {config.label}
            </span>
          </div>

          <span className="font-mono text-[7px] text-zinc-800">
            {event.time}
          </span>
        </div>

        <p className="mt-1.5 text-[8px] leading-5 text-zinc-700">
          {event.description}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <Clock3 className="h-2.5 w-2.5 text-zinc-800" />

          <span className="font-mono text-[7px] text-zinc-800">
            {event.duration}
          </span>

          {isBlocked && (
            <>
              <span className="text-zinc-800">•</span>

              <span className="text-[7px] text-red-300/50">
                Execution boundary reached
              </span>
            </>
          )}

          {isRunning && (
            <>
              <span className="text-zinc-800">•</span>

              <span className="text-[7px] text-indigo-200/50">
                Active
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SignalRow({
  label,
  value,
  detail,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium text-zinc-400">
          {label}
        </p>

        <p className="mt-1 text-[7px] text-zinc-700">
          {detail}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {trend === "up" && (
          <ArrowUp className="h-2.5 w-2.5 text-emerald-300/50" />
        )}

        {trend === "down" && (
          <ArrowDown className="h-2.5 w-2.5 text-emerald-300/50" />
        )}

        {trend === "neutral" && (
          <span className="h-1 w-3 rounded-full bg-zinc-800" />
        )}

        <span className="font-mono text-[10px] text-zinc-400">
          {value}
        </span>
      </div>
    </div>
  );
}

function ControlSignal({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof ShieldCheck;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/[0.04] p-4 last:border-b-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.012]">
        <Icon className="h-3 w-3 text-zinc-700" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-medium text-zinc-400">
            {title}
          </p>

          <span className="font-mono text-[10px] text-zinc-500">
            {value}
          </span>
        </div>

        <p className="mt-1 text-[7px] leading-5 text-zinc-700">
          {detail}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Activity;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
        <Icon className="h-3.5 w-3.5 text-zinc-600" />
      </div>

      <div>
        <p className="text-[10px] font-medium text-zinc-400">
          {title}
        </p>

        <p className="mt-0.5 text-[8px] text-zinc-700">
          {subtitle}
        </p>
      </div>
    </div>
  );
}