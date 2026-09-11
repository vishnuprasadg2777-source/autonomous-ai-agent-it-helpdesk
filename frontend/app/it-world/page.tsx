"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Cloud,
  Cpu,
  Database,
  Globe2,
  KeyRound,
  Laptop,
  Network,
  RefreshCw,
  Router,
  Server,
  ShieldCheck,
  UserRound,
  Wifi,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AgentRunResponse } from "@/lib/api/client";

type StateStatus = "healthy" | "warning" | "disconnected";

type WorldNode = {
  id: string;
  name: string;
  type: string;
  status: StateStatus;
  value: string;
  detail: string;
  icon: typeof Laptop;
};

const baseNodes: WorldNode[] = [
  {
    id: "endpoint",
    name: "User Endpoint",
    type: "Endpoint",
    status: "healthy",
    value: "Operational",
    detail: "Device responding normally",
    icon: Laptop,
  },
  {
    id: "network",
    name: "Network",
    type: "Connectivity",
    status: "healthy",
    value: "Connected",
    detail: "Local network reachable",
    icon: Network,
  },
  {
    id: "vpn-client",
    name: "VPN Client",
    type: "Remote Access",
    status: "healthy",
    value: "Connected",
    detail: "Secure tunnel established",
    icon: Wifi,
  },
  {
    id: "vpn-gateway",
    name: "VPN Gateway",
    type: "Infrastructure",
    status: "healthy",
    value: "Operational",
    detail: "Gateway responding",
    icon: Router,
  },
  {
    id: "authentication",
    name: "Authentication",
    type: "Identity",
    status: "healthy",
    value: "Valid",
    detail: "Session authenticated",
    icon: KeyRound,
  },
  {
    id: "it-service",
    name: "IT Service Layer",
    type: "Service",
    status: "healthy",
    value: "Available",
    detail: "Core services operational",
    icon: Server,
  },
];

export default function ITWorldPage() {
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [vpnSimulation, setVpnSimulation] = useState<
    "normal" | "disconnected"
  >("normal");

  useEffect(() => {
    const loadLatestRun = () => {
      try {
        const stored = window.localStorage.getItem(
          "autonomous-it:last-agent-run",
        );

        if (!stored) {
          return;
        }

        const parsed = JSON.parse(stored) as AgentRunResponse;
        setResult(parsed);
      } catch {
        setResult(null);
      }
    };

    loadLatestRun();

    window.addEventListener("storage", loadLatestRun);

    return () => {
      window.removeEventListener("storage", loadLatestRun);
    };
  }, []);

  const nodes = useMemo(() => {
    if (!result?.it_state) {
      if (vpnSimulation === "disconnected") {
        return baseNodes.map((node) =>
          node.id === "vpn-client"
            ? {
                ...node,
                status: "disconnected" as StateStatus,
                value: "Disconnected",
                detail: "VPN tunnel unavailable",
              }
            : node,
        );
      }

      return baseNodes;
    }

    const state = result.it_state;

    const nextNodes = baseNodes.map((node) => {
      if (node.id === "endpoint") {
        return {
          ...node,
          status:
            state.endpoint === "operational"
              ? ("healthy" as StateStatus)
              : ("warning" as StateStatus),
          value:
            state.endpoint === "operational"
              ? "Operational"
              : state.endpoint ?? "Unknown",
          detail:
            state.endpoint === "operational"
              ? "Device responding normally"
              : "Endpoint state requires attention",
        };
      }

      if (node.id === "network") {
        return {
          ...node,
          status:
            state.network === "connected"
              ? ("healthy" as StateStatus)
              : ("warning" as StateStatus),
          value: state.network ?? "Unknown",
          detail:
            state.network === "connected"
              ? "Local network reachable"
              : "Network connectivity requires attention",
        };
      }

      if (node.id === "vpn-client") {
        if (vpnSimulation === "disconnected") {
          return {
            ...node,
            status: "disconnected" as StateStatus,
            value: "Disconnected",
            detail: "VPN tunnel unavailable",
          };
        }

        if (state.vpn_client === "connected") {
          return {
            ...node,
            status: "healthy" as StateStatus,
            value: "Connected",
            detail: "Secure tunnel established",
          };
        }

        if (state.vpn_client === "disconnected") {
          return {
            ...node,
            status: "disconnected" as StateStatus,
            value: "Disconnected",
            detail: "VPN tunnel unavailable",
          };
        }

        return {
          ...node,
          status: "warning" as StateStatus,
          value: state.vpn_client ?? "Unknown",
          detail: "VPN state observed by the agent",
        };
      }

      if (node.id === "vpn-gateway") {
        return {
          ...node,
          status:
            state.vpn_gateway === "operational"
              ? ("healthy" as StateStatus)
              : ("warning" as StateStatus),
          value: state.vpn_gateway ?? "Unknown",
          detail:
            state.vpn_gateway === "operational"
              ? "Gateway responding"
              : "Gateway requires attention",
        };
      }

      if (node.id === "authentication") {
        return {
          ...node,
          status:
            state.authentication === "valid"
              ? ("healthy" as StateStatus)
              : ("warning" as StateStatus),
          value: state.authentication ?? "Unknown",
          detail:
            state.authentication === "valid"
              ? "Session authenticated"
              : "Authentication state requires attention",
        };
      }

      return node;
    });

    return nextNodes;
  }, [result, vpnSimulation]);

  const refreshWorldState = () => {
    setRefreshing(true);

    try {
      const stored = window.localStorage.getItem(
        "autonomous-it:last-agent-run",
      );

      if (stored) {
        setResult(JSON.parse(stored) as AgentRunResponse);
      }
    } catch {
      setResult(null);
    }

    window.setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const simulateDisconnect = () => {
    setVpnSimulation("disconnected");
  };

  const restoreConnection = () => {
    setVpnSimulation("normal");
  };

  const healthyCount = nodes.filter(
    (node) => node.status === "healthy",
  ).length;

  const warningCount = nodes.filter(
    (node) => node.status === "warning",
  ).length;

  const disconnectedCount = nodes.filter(
    (node) => node.status === "disconnected",
  ).length;

  const transition = useMemo(() => {
    if (!result) {
      return null;
    }

    const tool = result.tool;
    const verification = result.verification;

    if (!tool) {
      return null;
    }

    const entries = Object.entries(tool.state_changes);

    if (!entries.length) {
      return null;
    }

    const [key, value] = entries[0];

    let from = "unknown";

    if (key === "software_installation") {
      from = "not_installed";
    } else if (key === "access_request") {
      from = "not_provisioned";
    } else if (key === "vpn_client") {
      from = "disconnected";
    } else if (key === "authentication") {
      from = "invalid";
    }

    return {
      key,
      from,
      to: value,
      verified: verification?.verified ?? false,
    };
  }, [result]);

  const recentTransitions = useMemo(() => {
    if (!result || !transition) {
      return [];
    }

    return [
      {
        time: formatTime(result.it_state?.last_updated),
        source: formatLabel(transition.key),
        from: formatLabel(transition.from),
        to: formatLabel(transition.to),
        reason:
          result.tool?.message ??
          "Controlled tool execution completed",
        type: "action",
      },
      {
        time: formatTime(result.it_state?.last_updated),
        source: "Verification",
        from: formatLabel(transition.to),
        to: result.verification?.verified
          ? "Verified"
          : "Verification failed",
        reason:
          result.verification?.message ??
          "Post-action state comparison completed",
        type: result.verification?.verified
          ? "verified"
          : "warning",
      },
    ];
  }, [result, transition]);

  return (
    <div className="min-h-full bg-[#060708] text-zinc-200">
      <header className="border-b border-white/[0.06] px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-300/[0.12] bg-emerald-300/[0.035]">
                  <Globe2 className="h-3.5 w-3.5 text-emerald-200/70" />
                </span>

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  State / World Model
                </span>
              </div>

              <h1 className="text-[25px] font-medium tracking-[-0.03em] text-zinc-100">
                IT World
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-zinc-600">
                A structured operational representation of the environment
                used by the agent to observe state, reason about actions and
                verify post-action changes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.025] px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[9px] text-emerald-300/60">
                  World model active
                </span>
              </div>

              <button
                type="button"
                onClick={refreshWorldState}
                className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 text-[9px] text-zinc-600 transition hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-zinc-400"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh state
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6 lg:px-8">
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] md:grid-cols-4">
          <WorldMetric
            icon={Activity}
            value={String(nodes.length)}
            label="Tracked components"
            detail="Current world model"
          />

          <WorldMetric
            icon={CheckCircle2}
            value={String(healthyCount)}
            label="Operational"
            detail="Healthy state"
          />

          <WorldMetric
            icon={ShieldCheck}
            value={
              result?.verification
                ? result.verification.verified
                  ? "100%"
                  : "—"
                : "—"
            }
            label="State confidence"
            detail={
              result?.verification
                ? result.verification.verified
                  ? "Verified observation"
                  : "Verification pending"
                : "Awaiting agent run"
            }
          />

          <WorldMetric
            icon={Workflow}
            value={String(recentTransitions.length).padStart(2, "0")}
            label="Recent transitions"
            detail={
              result
                ? "Latest agent run"
                : "No agent run loaded"
            }
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] px-5 py-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[10px] font-medium text-zinc-400">
                  Current environment state
                </p>
              </div>

              <p className="mt-1 text-[8px] text-zinc-700">
                Structured state used by reasoning, planning and verification
              </p>
            </div>

            <div className="flex items-center gap-4 text-[8px]">
              <StatusLegend
                status="healthy"
                label={`${healthyCount} operational`}
              />

              <StatusLegend
                status="warning"
                label={`${warningCount} warning`}
              />

              <StatusLegend
                status="disconnected"
                label={`${disconnectedCount} disconnected`}
              />
            </div>
          </div>

          <div className="p-5">
            <div className="mb-5 overflow-hidden rounded-lg border border-white/[0.05] bg-black/15">
              <div className="border-b border-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                      Operational topology
                    </p>

                    <p className="mt-1 text-[7px] text-zinc-800">
                      Environment relationships represented for agent
                      reasoning
                    </p>
                  </div>

                  <span className="font-mono text-[7px] text-zinc-800">
                    WORLD-STATE / LIVE
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto p-5">
                <div className="mx-auto flex min-w-[850px] items-center justify-center gap-3">
                  <TopologyNode
                    icon={UserRound}
                    title="User"
                    subtitle={
                      result?.ticket_id ?? "Request"
                    }
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Laptop}
                    title="Endpoint"
                    subtitle="Device"
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Network}
                    title="Network"
                    subtitle="Connectivity"
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Wifi}
                    title="VPN"
                    subtitle="Remote access"
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Router}
                    title="Gateway"
                    subtitle="Infrastructure"
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Cloud}
                    title="Services"
                    subtitle="IT environment"
                  />
                </div>
              </div>
            </div>

            {result && (
              <div className="mb-5 grid gap-px overflow-hidden rounded-lg border border-indigo-300/[0.08] bg-indigo-300/[0.025] md:grid-cols-3">
                <ContextMetric
                  label="Current ticket"
                  value={result.ticket_id}
                  mono
                />

                <ContextMetric
                  label="Agent intent"
                  value={
                    result.understanding?.intent ??
                    "Unknown"
                  }
                />

                <ContextMetric
                  label="Latest tool"
                  value={
                    result.tool?.tool ??
                    "No tool executed"
                  }
                  mono
                />
              </div>
            )}

            <div className="grid gap-px overflow-hidden rounded-lg border border-white/[0.05] bg-white/[0.04] md:grid-cols-2 xl:grid-cols-3">
              {nodes.map((node, index) => (
                <WorldNodeCard
                  key={node.id}
                  node={node}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-[10px] font-medium text-zinc-400">
                  State transition history
                </p>

                <p className="mt-1 text-[8px] text-zinc-700">
                  Changes recorded during the latest autonomous run
                </p>
              </div>

              <Activity className="h-3.5 w-3.5 text-zinc-700" />
            </div>

            <div className="divide-y divide-white/[0.05]">
              {recentTransitions.length ? (
                recentTransitions.map((item, index) => (
                  <StateTransitionRow
                    key={`${item.time}-${item.source}-${index}`}
                    transition={item}
                  />
                ))
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No recent transitions"
                  description="Run the AI Agent to record an observed state transition."
                />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[10px] font-medium text-zinc-400">
                  Agent world-model context
                </p>
              </div>

              <p className="mt-1 text-[8px] text-zinc-700">
                State information available during autonomous reasoning
              </p>
            </div>

            {result ? (
              <div className="space-y-2 p-5">
                <ContextRow
                  label="Current ticket"
                  value={result.ticket_id}
                  mono
                />

                <ContextRow
                  label="Detected intent"
                  value={
                    result.understanding?.intent ??
                    "Unknown"
                  }
                />

                <ContextRow
                  label="Category"
                  value={
                    result.understanding?.category ??
                    "Unknown"
                  }
                />

                <ContextRow
                  label="Endpoint"
                  value={
                    result.it_state?.endpoint ??
                    "Unknown"
                  }
                  positive={
                    result.it_state?.endpoint ===
                    "operational"
                  }
                />

                <ContextRow
                  label="Network"
                  value={
                    result.it_state?.network ??
                    "Unknown"
                  }
                  positive={
                    result.it_state?.network ===
                    "connected"
                  }
                />

                <ContextRow
                  label="Authentication"
                  value={
                    result.it_state?.authentication ??
                    "Unknown"
                  }
                  positive={
                    result.it_state?.authentication ===
                    "valid"
                  }
                />

                {result.it_state?.requested_software && (
                  <ContextRow
                    label="Requested software"
                    value={
                      result.it_state.requested_software
                    }
                  />
                )}

                {result.it_state?.requested_resource && (
                  <ContextRow
                    label="Requested resource"
                    value={
                      result.it_state.requested_resource
                    }
                  />
                )}

                <ContextRow
                  label="Last observation"
                  value={formatDateTime(
                    result.it_state?.last_updated,
                  )}
                  mono
                />
              </div>
            ) : (
              <EmptyState
                icon={Cpu}
                title="Awaiting agent context"
                description="The latest autonomous run will populate the world-model context."
              />
            )}

            <div className="border-t border-white/[0.05] px-5 py-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300/50" />

                <p className="text-[8px] leading-5 text-zinc-700">
                  The world model is treated as an observed representation of
                  the environment. The agent uses it as context and verifies
                  resulting state before resolving a request.
                </p>
              </div>
            </div>
          </section>
        </div>

        {transition && (
          <section className="overflow-hidden rounded-xl border border-emerald-300/[0.08] bg-[#0b0d0f]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <Workflow className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[10px] font-medium text-zinc-400">
                  Latest state transition
                </p>
              </div>

              <p className="mt-1 text-[8px] text-zinc-700">
                Controlled action and post-action verification
              </p>
            </div>

            <div className="grid gap-px bg-white/[0.04] md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <TransitionStage
                number="01"
                title="Before action"
                value={formatLabel(transition.from)}
                description="Observed starting state"
              />

              <TransitionArrow />

              <TransitionStage
                number="02"
                title="Controlled action"
                value={
                  result?.tool?.tool ??
                  "No tool"
                }
                description={
                  result?.policy?.policy_id
                    ? `${result.policy.policy_id} · ${result.policy.decision}`
                    : "Policy-controlled execution"
                }
                mono
              />

              <TransitionArrow />

              <TransitionStage
                number="03"
                title="After action"
                value={formatLabel(transition.to)}
                description={
                  transition.verified
                    ? "State verified successfully"
                    : "Verification requires attention"
                }
                positive={transition.verified}
              />
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] px-5 py-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Workflow className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[10px] font-medium text-zinc-400">
                  Controlled state simulation
                </p>
              </div>

              <p className="mt-1 text-[8px] text-zinc-700">
                Demonstrate how the world model can represent changing
                environmental conditions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={simulateDisconnect}
                className="flex h-8 items-center gap-2 rounded-lg border border-amber-300/[0.08] bg-amber-300/[0.02] px-3 text-[8px] text-amber-200/50 transition hover:bg-amber-300/[0.05] hover:text-amber-200/70"
              >
                <Wifi className="h-3 w-3" />
                Simulate VPN failure
              </button>

              <button
                type="button"
                onClick={restoreConnection}
                className="flex h-8 items-center gap-2 rounded-lg border border-emerald-300/[0.08] bg-emerald-300/[0.02] px-3 text-[8px] text-emerald-200/50 transition hover:bg-emerald-300/[0.05] hover:text-emerald-200/70"
              >
                <CheckCircle2 className="h-3 w-3" />
                Restore state
              </button>
            </div>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-3">
            <SimulationStep
              number="01"
              title="Observe"
              description="Read the current IT state before deciding what action is appropriate."
              icon={Activity}
            />

            <SimulationStep
              number="02"
              title="Act"
              description="Execute only an authorized action through the controlled tool layer."
              icon={Workflow}
            />

            <SimulationStep
              number="03"
              title="Verify"
              description="Compare observed state against the expected post-action state."
              icon={CheckCircle2}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <LayersIcon />

              <p className="text-[10px] font-medium text-zinc-400">
                World model lifecycle
              </p>
            </div>

            <p className="mt-1 text-[8px] text-zinc-700">
              How environmental state participates in autonomous helpdesk
              execution
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-5">
            <LifecycleStep
              number="01"
              title="Observe"
              description="Collect current environmental state."
            />

            <LifecycleStep
              number="02"
              title="Represent"
              description="Normalize state into structured entities."
            />

            <LifecycleStep
              number="03"
              title="Reason"
              description="Use state as context for planning."
            />

            <LifecycleStep
              number="04"
              title="Execute"
              description="Apply controlled changes through tools."
            />

            <LifecycleStep
              number="05"
              title="Verify"
              description="Confirm the environment reached the expected state."
            />
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-white/[0.05] pt-5 text-[8px] text-zinc-700 sm:flex-row">
          <div className="flex items-center gap-2">
            <Globe2 className="h-3 w-3" />

            <span>
              IT World represents observed operational state used by the
              Phoenix agent.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Observe</span>
            <span>→</span>
            <span>Represent</span>
            <span>→</span>
            <span>Reason</span>
            <span>→</span>
            <span>Act</span>
            <span>→</span>
            <span>Verify</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function WorldMetric({
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
          state
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

function ContextMetric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-[#0a0c0e] px-4 py-3">
      <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-[9px] font-medium ${
          mono
            ? "font-mono text-zinc-500"
            : "text-zinc-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusLegend({
  status,
  label,
}: {
  status: StateStatus;
  label: string;
}) {
  const statusClass = {
    healthy: "bg-emerald-400",
    warning: "bg-amber-400",
    disconnected: "bg-red-400",
  }[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${statusClass}`} />
      <span className="text-zinc-700">{label}</span>
    </div>
  );
}

function WorldNodeCard({
  node,
  index,
}: {
  node: WorldNode;
  index: number;
}) {
  const Icon = node.icon;

  const statusClasses = {
    healthy: {
      dot: "bg-emerald-400",
      border: "border-emerald-300/[0.08]",
      badge:
        "border-emerald-300/[0.08] bg-emerald-300/[0.025] text-emerald-300/60",
      text: "text-emerald-300/60",
    },
    warning: {
      dot: "bg-amber-400",
      border: "border-amber-300/[0.08]",
      badge:
        "border-amber-300/[0.08] bg-amber-300/[0.025] text-amber-300/60",
      text: "text-amber-300/60",
    },
    disconnected: {
      dot: "bg-red-400",
      border: "border-red-300/[0.08]",
      badge:
        "border-red-300/[0.08] bg-red-300/[0.02] text-red-300/60",
      text: "text-red-300/60",
    },
  }[node.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.035,
      }}
      className="bg-[#090b0d] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-white/[0.012] ${statusClasses.border}`}
          >
            <Icon className="h-3.5 w-3.5 text-zinc-600" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[9px] font-medium text-zinc-400">
              {node.name}
            </p>

            <p className="mt-1 text-[7px] text-zinc-700">
              {node.type}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[7px] ${statusClasses.badge}`}
        >
          {node.status}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusClasses.dot}`}
            />

            <span
              className={`text-[10px] font-medium ${statusClasses.text}`}
            >
              {node.value}
            </span>
          </div>

          <p className="mt-1 text-[7px] text-zinc-700">
            {node.detail}
          </p>
        </div>

        <span className="font-mono text-[7px] text-zinc-800">
          {node.id}
        </span>
      </div>
    </motion.div>
  );
}

function TopologyNode({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Laptop;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex w-[112px] shrink-0 flex-col items-center rounded-lg border border-white/[0.06] bg-[#0b0d0f] px-3 py-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.018]">
        <Icon className="h-3 w-3 text-zinc-600" />
      </div>

      <p className="mt-2 text-[8px] font-medium text-zinc-500">
        {title}
      </p>

      <p className="mt-1 max-w-[95px] truncate text-[7px] text-zinc-800">
        {subtitle}
      </p>
    </div>
  );
}

function TopologyConnector() {
  return (
    <div className="flex items-center">
      <div className="h-px w-5 bg-white/[0.08]" />
      <ArrowRight className="h-2.5 w-2.5 text-zinc-800" />
      <div className="h-px w-5 bg-white/[0.08]" />
    </div>
  );
}

function StateTransitionRow({
  transition,
}: {
  transition: {
    time: string;
    source: string;
    from: string;
    to: string;
    reason: string;
    type: string;
  };
}) {
  const verified = transition.type === "verified";
  const warning = transition.type === "warning";
  const action = transition.type === "action";

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-[105px]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            verified
              ? "bg-emerald-400"
              : warning
                ? "bg-red-400"
                : action
                  ? "bg-indigo-300"
                  : "bg-zinc-600"
          }`}
        />

        <span className="font-mono text-[7px] text-zinc-700">
          {transition.time}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-[8px] font-medium text-zinc-500">
          {transition.source}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="rounded border border-white/[0.05] bg-white/[0.012] px-2 py-1 text-[7px] text-zinc-700">
            {transition.from}
          </span>

          <ArrowDown className="h-2.5 w-2.5 -rotate-90 text-zinc-800" />

          <span
            className={`rounded border px-2 py-1 text-[7px] ${
              verified
                ? "border-emerald-300/[0.08] bg-emerald-300/[0.02] text-emerald-300/60"
                : warning
                  ? "border-red-300/[0.08] bg-red-300/[0.02] text-red-300/60"
                  : "border-white/[0.05] bg-white/[0.012] text-zinc-500"
            }`}
          >
            {transition.to}
          </span>
        </div>
      </div>

      <p className="text-[7px] text-zinc-700 sm:w-[260px] sm:text-right">
        {transition.reason}
      </p>
    </div>
  );
}

function ContextRow({
  label,
  value,
  positive,
  mono,
}: {
  label: string;
  value: string;
  positive?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.012] px-3 py-2.5">
      <span className="text-[8px] text-zinc-700">
        {label}
      </span>

      <span
        className={`max-w-[62%] truncate text-right text-[8px] ${
          positive
            ? "text-emerald-300/60"
            : mono
              ? "font-mono text-zinc-500"
              : "text-zinc-500"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TransitionStage({
  number,
  title,
  value,
  description,
  mono,
  positive,
}: {
  number: string;
  title: string;
  value: string;
  description: string;
  mono?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-[#090b0d] p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] text-zinc-800">
          {number}
        </span>

        <CircleDot className="h-3 w-3 text-zinc-700" />
      </div>

      <p className="mt-4 text-[8px] uppercase tracking-[0.1em] text-zinc-800">
        {title}
      </p>

      <p
        className={`mt-2 truncate text-[12px] font-medium ${
          positive
            ? "text-emerald-300/60"
            : mono
              ? "font-mono text-zinc-400"
              : "text-zinc-400"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-[7px] leading-5 text-zinc-700">
        {description}
      </p>
    </div>
  );
}

function TransitionArrow() {
  return (
    <div className="hidden items-center justify-center bg-[#090b0d] px-3 md:flex">
      <ArrowRight className="h-3.5 w-3.5 text-zinc-800" />
    </div>
  );
}

function SimulationStep({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: typeof Activity;
}) {
  return (
    <div className="bg-[#090b0d] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-3 w-3 text-zinc-600" />
        </div>

        <span className="font-mono text-[8px] text-zinc-800">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-medium text-zinc-400">
        {title}
      </p>

      <p className="mt-2 text-[8px] leading-5 text-zinc-700">
        {description}
      </p>
    </div>
  );
}

function LifecycleStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#090b0d] p-5">
      <div className="flex items-center justify-between">
        <CircleDot className="h-3 w-3 text-zinc-700" />

        <span className="font-mono text-[8px] text-zinc-800">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[9px] font-medium text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-[7px] leading-5 text-zinc-700">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[145px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.015]">
        <Icon className="h-3.5 w-3.5 text-zinc-800" />
      </div>

      <p className="mt-3 text-[9px] font-medium text-zinc-600">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-[8px] leading-5 text-zinc-800">
        {description}
      </p>
    </div>
  );
}

function LayersIcon() {
  return (
    <div className="flex h-3.5 w-3.5 items-center justify-center">
      <div className="relative h-3 w-3">
        <span className="absolute left-0 top-0 h-2 w-2 border border-zinc-700" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border border-zinc-700 bg-[#0b0d0f]" />
      </div>
    </div>
  );
}

function formatLabel(value: string | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatTime(value: string | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDateTime(value: string | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}