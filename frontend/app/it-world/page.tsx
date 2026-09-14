"use client";

import { motion } from "framer-motion";
import {
  Activity,
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

        setResult(JSON.parse(stored) as AgentRunResponse);
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
      return baseNodes.map((node) =>
        node.id === "vpn-client" &&
        vpnSimulation === "disconnected"
          ? {
              ...node,
              status: "disconnected" as StateStatus,
              value: "Disconnected",
              detail: "VPN tunnel unavailable",
            }
          : node,
      );
    }

    const state = result.it_state;

    return baseNodes.map((node) => {
      if (node.id === "endpoint") {
        const operational = state.endpoint === "operational";

        return {
          ...node,
          status: operational
            ? ("healthy" as StateStatus)
            : ("warning" as StateStatus),
          value: state.endpoint ?? "Unknown",
          detail: operational
            ? "Device responding normally"
            : "Endpoint state requires attention",
        };
      }

      if (node.id === "network") {
        const connected = state.network === "connected";

        return {
          ...node,
          status: connected
            ? ("healthy" as StateStatus)
            : ("warning" as StateStatus),
          value: state.network ?? "Unknown",
          detail: connected
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
        const operational = state.vpn_gateway === "operational";

        return {
          ...node,
          status: operational
            ? ("healthy" as StateStatus)
            : ("warning" as StateStatus),
          value: state.vpn_gateway ?? "Unknown",
          detail: operational
            ? "Gateway responding"
            : "Gateway requires attention",
        };
      }

      if (node.id === "authentication") {
        const valid = state.authentication === "valid";

        return {
          ...node,
          status: valid
            ? ("healthy" as StateStatus)
            : ("warning" as StateStatus),
          value: state.authentication ?? "Unknown",
          detail: valid
            ? "Session authenticated"
            : "Authentication state requires attention",
        };
      }

      return node;
    });
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
    if (!result?.tool) {
      return null;
    }

    const entries = Object.entries(result.tool.state_changes);

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
      verified: result.verification?.verified ?? false,
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

  const stateConfidence =
    result?.verification?.verified
      ? "Verified"
      : result
        ? "Observed"
        : "—";

  return (
    <div className="min-h-full bg-[#060708] text-white">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1800px] px-5 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
                  <Globe2 className="h-3.5 w-3.5 text-white/55" />
                </div>

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                  State / World Model
                </span>
              </div>

              <h1 className="text-[29px] font-semibold tracking-[-0.04em] text-white">
                IT World
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/35">
                A structured representation of the operational environment
                used by Phoenix to observe state, reason about actions and
                verify resulting changes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.035] px-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[10px] font-medium text-emerald-300/70">
                  World model active
                </span>
              </div>

              <button
                type="button"
                onClick={refreshWorldState}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-[10px] text-white/40 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/70"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh state
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-5 px-5 py-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-4">
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
            value={stateConfidence}
            label="State confidence"
            detail={
              result
                ? result.verification?.verified
                  ? "Post-action verified"
                  : "Observed state"
                : "Awaiting agent run"
            }
          />

          <WorldMetric
            icon={Workflow}
            value={String(recentTransitions.length)}
            label="Transitions"
            detail={
              result ? "Latest agent run" : "No run loaded"
            }
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] px-5 py-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-white/35" />

                <div>
                  <h2 className="text-sm font-semibold text-white/80">
                    Environment state
                  </h2>

                  <p className="mt-1 text-[10px] text-white/25">
                    Structured observations available to the agent
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[9px]">
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
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/30">
                    Operational topology
                  </p>

                  <p className="mt-1 text-[10px] text-white/20">
                    Relationships represented in the world model
                  </p>
                </div>

                <span className="font-mono text-[9px] text-white/15">
                  WORLD-STATE / LIVE
                </span>
              </div>

              <div className="overflow-x-auto p-6">
                <div className="mx-auto flex min-w-[930px] items-center justify-center gap-2">
                  <TopologyNode
                    icon={UserRound}
                    title="User"
                    subtitle={result?.ticket_id ?? "Request"}
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Laptop}
                    title="Endpoint"
                    subtitle="Device"
                    status={getNodeStatus(nodes, "endpoint")}
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Network}
                    title="Network"
                    subtitle="Connectivity"
                    status={getNodeStatus(nodes, "network")}
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Wifi}
                    title="VPN"
                    subtitle="Remote access"
                    status={getNodeStatus(nodes, "vpn-client")}
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Router}
                    title="Gateway"
                    subtitle="Infrastructure"
                    status={getNodeStatus(nodes, "vpn-gateway")}
                  />

                  <TopologyConnector />

                  <TopologyNode
                    icon={Cloud}
                    title="Services"
                    subtitle="IT environment"
                    status={getNodeStatus(nodes, "it-service")}
                  />
                </div>
              </div>
            </div>

            {result && (
              <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] md:grid-cols-3">
                <ContextMetric
                  label="Current ticket"
                  value={result.ticket_id}
                  mono
                />

                <ContextMetric
                  label="Agent intent"
                  value={
                    result.understanding?.intent ?? "Unknown"
                  }
                />

                <ContextMetric
                  label="Latest tool"
                  value={
                    result.tool?.tool ?? "No tool executed"
                  }
                  mono
                />
              </div>
            )}

            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] md:grid-cols-2 xl:grid-cols-3">
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
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
            <SectionHeading
              icon={Activity}
              title="State transition history"
              subtitle="Changes recorded during the latest autonomous run"
            />

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

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
            <SectionHeading
              icon={Cpu}
              title="Agent world-model context"
              subtitle="State information available during reasoning"
            />

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
                    result.understanding?.intent ?? "Unknown"
                  }
                />

                <ContextRow
                  label="Category"
                  value={
                    result.understanding?.category ?? "Unknown"
                  }
                />

                <ContextRow
                  label="Endpoint"
                  value={
                    result.it_state?.endpoint ?? "Unknown"
                  }
                  positive={
                    result.it_state?.endpoint === "operational"
                  }
                />

                <ContextRow
                  label="Network"
                  value={
                    result.it_state?.network ?? "Unknown"
                  }
                  positive={
                    result.it_state?.network === "connected"
                  }
                />

                <ContextRow
                  label="VPN client"
                  value={
                    result.it_state?.vpn_client ?? "Unknown"
                  }
                  positive={
                    result.it_state?.vpn_client === "connected"
                  }
                />

                <ContextRow
                  label="Authentication"
                  value={
                    result.it_state?.authentication ?? "Unknown"
                  }
                  positive={
                    result.it_state?.authentication === "valid"
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
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/45" />

                <p className="text-[9px] leading-5 text-white/20">
                  World state is treated as an observed representation of the
                  environment. Phoenix uses it as context and verifies the
                  resulting state before resolving a request.
                </p>
              </div>
            </div>
          </section>
        </div>

        {transition && (
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
            <SectionHeading
              icon={Workflow}
              title="Latest state transition"
              subtitle="Controlled action and post-action verification"
            />

            <div className="grid gap-px bg-white/[0.05] md:grid-cols-[1fr_auto_1fr_auto_1fr]">
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
                value={result?.tool?.tool ?? "No tool"}
                description={
                  result?.policy?.policy_id
                    ? `${result.policy.policy_id} · ${formatLabel(result.policy.decision)}`
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

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <SectionHeading
            icon={Workflow}
            title="Controlled state simulation"
            subtitle="Demonstrate changing environmental conditions in the world model"
          />

          <div className="flex flex-wrap gap-2 border-b border-white/[0.05] px-5 py-4">
            <button
              type="button"
              onClick={() => setVpnSimulation("disconnected")}
              className="flex h-8 items-center gap-2 rounded-lg border border-amber-300/[0.08] bg-amber-300/[0.02] px-3 text-[9px] font-medium text-amber-200/55 transition hover:bg-amber-300/[0.05] hover:text-amber-200/75"
            >
              <Wifi className="h-3 w-3" />
              Simulate VPN failure
            </button>

            <button
              type="button"
              onClick={() => setVpnSimulation("normal")}
              className="flex h-8 items-center gap-2 rounded-lg border border-emerald-300/[0.08] bg-emerald-300/[0.02] px-3 text-[9px] font-medium text-emerald-200/55 transition hover:bg-emerald-300/[0.05] hover:text-emerald-200/75"
            >
              <CheckCircle2 className="h-3 w-3" />
              Restore state
            </button>
          </div>

          <div className="grid gap-px bg-white/[0.05] md:grid-cols-3">
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

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <SectionHeading
            icon={LayersIcon}
            title="World model lifecycle"
            subtitle="How environmental state participates in autonomous helpdesk execution"
          />

          <div className="grid gap-px bg-white/[0.05] md:grid-cols-5">
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

        <footer className="flex flex-col justify-between gap-3 border-t border-white/[0.05] pt-5 text-[9px] text-white/15 sm:flex-row">
          <div className="flex items-center gap-2">
            <Globe2 className="h-3 w-3" />

            <span>
              PHOENIX IT HELPDESK · Observed operational state
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

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Activity | typeof LayersIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-white/30" />

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white/80">
            {title}
          </h2>

          <p className="mt-1 truncate text-[10px] text-white/22">
            {subtitle}
          </p>
        </div>
      </div>
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
    <div className="bg-[#0a0c0e] px-5 py-4 transition hover:bg-[#0d0f11]">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.018]">
          <Icon className="h-3 w-3 text-white/30" />
        </div>

        <span className="font-mono text-[8px] text-white/12">
          STATE
        </span>
      </div>

      <p className="mt-4 truncate text-[21px] font-semibold tracking-[-0.04em] text-white/85">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium text-white/40">
        {label}
      </p>

      <p className="mt-0.5 truncate text-[8px] text-white/18">
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
    <div className="bg-[#090b0d] px-4 py-3">
      <p className="text-[8px] uppercase tracking-[0.1em] text-white/15">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-[10px] font-medium ${
          mono
            ? "font-mono text-white/40"
            : "text-white/35"
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
      <span className="text-white/25">{label}</span>
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
      text: "text-emerald-300/65",
    },
    warning: {
      dot: "bg-amber-400",
      border: "border-amber-300/[0.08]",
      badge:
        "border-amber-300/[0.08] bg-amber-300/[0.025] text-amber-300/60",
      text: "text-amber-300/65",
    },
    disconnected: {
      dot: "bg-red-400",
      border: "border-red-300/[0.08]",
      badge:
        "border-red-300/[0.08] bg-red-300/[0.02] text-red-300/60",
      text: "text-red-300/65",
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
      className="bg-[#090b0d] p-4 transition hover:bg-[#0d0f11]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white/[0.012] ${statusClasses.border}`}
          >
            <Icon className="h-3.5 w-3.5 text-white/35" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium text-white/55">
              {node.name}
            </p>

            <p className="mt-1 text-[8px] text-white/18">
              {node.type}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[7px] uppercase tracking-[0.08em] ${statusClasses.badge}`}
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

          <p className="mt-1 text-[8px] text-white/18">
            {node.detail}
          </p>
        </div>

        <span className="font-mono text-[7px] text-white/10">
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
  status,
}: {
  icon: typeof Laptop;
  title: string;
  subtitle: string;
  status?: StateStatus;
}) {
  const dotClass =
    status === "disconnected"
      ? "bg-red-400"
      : status === "warning"
        ? "bg-amber-400"
        : status === "healthy"
          ? "bg-emerald-400"
          : "bg-white/20";

  return (
    <div className="relative flex w-[120px] shrink-0 flex-col items-center rounded-xl border border-white/[0.06] bg-[#0b0d0f] px-3 py-3.5 transition hover:border-white/[0.1]">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.018]">
        <Icon className="h-3.5 w-3.5 text-white/35" />
      </div>

      <p className="mt-2.5 text-[9px] font-medium text-white/45">
        {title}
      </p>

      <div className="mt-1 flex max-w-[105px] items-center gap-1.5">
        <span className={`h-1 w-1 rounded-full ${dotClass}`} />

        <p className="truncate text-[7px] text-white/18">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function TopologyConnector() {
  return (
    <div className="flex shrink-0 items-center">
      <div className="h-px w-4 bg-white/[0.08]" />
      <ArrowRight className="h-2.5 w-2.5 text-white/15" />
      <div className="h-px w-4 bg-white/[0.08]" />
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

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-[110px]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            verified
              ? "bg-emerald-400"
              : warning
                ? "bg-red-400"
                : "bg-indigo-300"
          }`}
        />

        <span className="font-mono text-[8px] text-white/18">
          {transition.time}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <span className="text-[9px] font-medium text-white/35">
          {transition.source}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="rounded border border-white/[0.05] bg-white/[0.012] px-2 py-1 text-[8px] text-white/20">
            {transition.from}
          </span>

          <ArrowRight className="h-2.5 w-2.5 text-white/12" />

          <span
            className={`rounded border px-2 py-1 text-[8px] ${
              verified
                ? "border-emerald-300/[0.08] bg-emerald-300/[0.02] text-emerald-300/60"
                : warning
                  ? "border-red-300/[0.08] bg-red-300/[0.02] text-red-300/60"
                  : "border-white/[0.05] bg-white/[0.012] text-white/30"
            }`}
          >
            {transition.to}
          </span>
        </div>
      </div>

      <p className="text-[8px] leading-5 text-white/18 sm:w-[280px] sm:text-right">
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
      <span className="text-[9px] text-white/20">
        {label}
      </span>

      <span
        className={`max-w-[62%] truncate text-right text-[9px] ${
          positive
            ? "text-emerald-300/60"
            : mono
              ? "font-mono text-white/35"
              : "text-white/35"
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
        <span className="font-mono text-[8px] text-white/12">
          {number}
        </span>

        <CircleDot className="h-3 w-3 text-white/20" />
      </div>

      <p className="mt-4 text-[8px] uppercase tracking-[0.1em] text-white/15">
        {title}
      </p>

      <p
        className={`mt-2 truncate text-[12px] font-medium ${
          positive
            ? "text-emerald-300/65"
            : mono
              ? "font-mono text-white/45"
              : "text-white/40"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-[8px] leading-5 text-white/18">
        {description}
      </p>
    </div>
  );
}

function TransitionArrow() {
  return (
    <div className="hidden items-center justify-center bg-[#090b0d] px-3 md:flex">
      <ArrowRight className="h-3.5 w-3.5 text-white/15" />
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
    <div className="bg-[#090b0d] p-5 transition hover:bg-[#0d0f11]">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-3.5 w-3.5 text-white/30" />
        </div>

        <span className="font-mono text-[8px] text-white/12">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-medium text-white/45">
        {title}
      </p>

      <p className="mt-2 text-[8px] leading-5 text-white/18">
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
    <div className="bg-[#090b0d] p-5 transition hover:bg-[#0d0f11]">
      <div className="flex items-center justify-between">
        <CircleDot className="h-3 w-3 text-white/20" />

        <span className="font-mono text-[8px] text-white/12">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[9px] font-medium text-white/35">
        {title}
      </p>

      <p className="mt-2 text-[8px] leading-5 text-white/18">
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
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.015]">
        <Icon className="h-3.5 w-3.5 text-white/15" />
      </div>

      <p className="mt-3 text-[10px] font-medium text-white/30">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-[8px] leading-5 text-white/15">
        {description}
      </p>
    </div>
  );
}

function LayersIcon() {
  return (
    <div className="relative h-3.5 w-3.5">
      <span className="absolute left-0 top-0 h-2 w-2 border border-white/20" />
      <span className="absolute bottom-0 right-0 h-2 w-2 border border-white/20 bg-[#0a0c0e]" />
    </div>
  );
}

function getNodeStatus(
  nodes: WorldNode[],
  id: string,
): StateStatus | undefined {
  return nodes.find((node) => node.id === id)?.status;
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