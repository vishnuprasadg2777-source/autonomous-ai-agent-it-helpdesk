"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  Globe2,
  Laptop,
  Network,
  Play,
  Server,
  ShieldCheck,
  Users,
  Workflow,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

type AgentRun = {
  ticket_id: string;
  status: string;
  message: string;
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
    authorization_required: boolean;
  } | null;
  tool?: {
    tool: string;
    success: boolean;
    message: string;
    state_changes: Record<string, string>;
  } | null;
  verification?: {
    status: string;
    verified: boolean;
    message: string;
  } | null;
};

type BackendStatus = "checking" | "online" | "offline";

const services = [
  {
    name: "FastAPI Backend",
    description: "Application API and autonomous agent orchestration",
    icon: Server,
  },
  {
    name: "IT Service Desk",
    description: "Ticket intake, routing and lifecycle management",
    icon: Database,
  },
  {
    name: "Knowledge / RAG",
    description: "Knowledge retrieval and agent context generation",
    icon: Cloud,
  },
  {
    name: "Policy Engine",
    description: "Authorization, risk and controlled-action evaluation",
    icon: ShieldCheck,
  },
];

const resources = [
  {
    name: "User Endpoints",
    value: "1,284",
    description: "Logical endpoint records",
    icon: Laptop,
  },
  {
    name: "Network Nodes",
    value: "48",
    description: "Tracked network components",
    icon: Network,
  },
  {
    name: "Infrastructure",
    value: "32",
    description: "Logical infrastructure objects",
    icon: Server,
  },
  {
    name: "Cloud Services",
    value: "16",
    description: "Logical service resources",
    icon: Globe2,
  },
];

const topology = [
  { label: "Users", icon: Users },
  { label: "ITSM", icon: Database },
  { label: "Phoenix Agent", icon: Cpu },
  { label: "Policy", icon: ShieldCheck },
  { label: "Tools", icon: Workflow },
  { label: "IT World", icon: Network },
];

export default function ProductionPage() {
  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>("checking");
  const [latestRun, setLatestRun] =
    useState<AgentRun | null>(null);
  const [lastChecked, setLastChecked] =
    useState("Checking…");

  const checkBackend = async () => {
    setBackendStatus("checking");

    try {
      const response = await fetch(
        `${API_BASE_URL}/health`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Backend health check failed",
        );
      }

      setBackendStatus("online");
      setLastChecked(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch {
      setBackendStatus("offline");
      setLastChecked(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
  };

  const loadLatestRun = () => {
    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY,
        );

      if (!stored) {
        setLatestRun(null);
        return;
      }

      setLatestRun(
        JSON.parse(stored) as AgentRun,
      );
    } catch {
      setLatestRun(null);
    }
  };

  useEffect(() => {
    const handleAgentRun = () => {
      loadLatestRun();
    };

    window.addEventListener(
      AGENT_RUN_EVENT,
      handleAgentRun,
    );

    const frame =
      window.requestAnimationFrame(() => {
        loadLatestRun();
        checkBackend();
      });

    const interval =
      window.setInterval(() => {
        checkBackend();
      }, 30000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener(
        AGENT_RUN_EVENT,
        handleAgentRun,
      );
    };
  }, []);

  const environmentOperational =
    backendStatus === "online";

  const latestPolicy =
    latestRun?.policy?.decision ??
    "No evaluation yet";

  const latestTool =
    latestRun?.tool?.tool ??
    "No execution yet";

  const latestVerification =
    latestRun?.verification;

  const servicesWithStatus = useMemo(
    () =>
      services.map((service, index) => {
        if (index === 0) {
          return {
            ...service,
            status:
              backendStatus === "online"
                ? "Operational"
                : backendStatus ===
                    "offline"
                  ? "Unavailable"
                  : "Checking",
          };
        }

        if (index === 3) {
          return {
            ...service,
            status: latestRun?.policy
              ? "Operational"
              : "Ready",
          };
        }

        return {
          ...service,
          status: "Operational",
        };
      }),
    [backendStatus, latestRun],
  );

  return (
    <div className="min-h-full bg-[#060708] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-7 lg:px-8">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              <span>Environment</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/65">
                Production
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]">
                <FactoryIcon />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                  Production
                </h1>

                <p className="mt-1 text-sm text-white/40">
                  Autonomous IT operations environment
                </p>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
              environmentOperational
                ? "border-emerald-400/15 bg-emerald-400/[0.06]"
                : backendStatus === "checking"
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-red-400/15 bg-red-400/[0.05]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                environmentOperational
                  ? "bg-emerald-400"
                  : backendStatus === "checking"
                    ? "bg-white/40"
                    : "bg-red-400"
              }`}
            />

            <span
              className={`text-xs font-medium ${
                environmentOperational
                  ? "text-emerald-300"
                  : backendStatus === "checking"
                    ? "text-white/50"
                    : "text-red-300/80"
              }`}
            >
              {backendStatus === "online"
                ? "Environment Operational"
                : backendStatus ===
                    "checking"
                  ? "Checking Environment"
                  : "Backend Offline"}
            </span>
          </div>
        </header>

        <section className="mb-6 rounded-xl border border-amber-300/10 bg-amber-300/[0.025] px-4 py-3.5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/55" />

            <div>
              <p className="text-xs font-medium text-amber-100/65">
                Prototype deployment boundary
              </p>

              <p className="mt-1 text-[11px] leading-5 text-white/35">
                Phoenix is currently demonstrated as a
                controlled development prototype. IT
                actions use controlled/mock tools and
                logical IT state rather than real
                enterprise infrastructure. Production
                labels represent the logical runtime
                environment presented by this interface.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric
            label="Backend API"
            value={
              backendStatus === "online"
                ? "Online"
                : backendStatus ===
                    "checking"
                  ? "Checking"
                  : "Offline"
            }
            detail={`FastAPI · checked ${lastChecked}`}
            icon={Server}
            status={backendStatus}
          />

          <Metric
            label="Agent Runtime"
            value={
              latestRun
                ? latestRun.status ===
                    "resolved"
                  ? "Resolved"
                  : latestRun.status ===
                      "escalated"
                    ? "Escalated"
                    : "Active"
                : "Ready"
            }
            detail={
              latestRun
                ? `${latestRun.ticket_id} · latest run`
                : "Awaiting execution"
            }
            icon={Cpu}
            status={
              latestRun
                ? "online"
                : "checking"
            }
          />

          <Metric
            label="Policy Layer"
            value={
              latestRun?.policy
                ? latestPolicy ===
                    "allowed"
                  ? "Allowed"
                  : "Blocked"
                : "Active"
            }
            detail={
              latestRun?.policy
                ? `${latestRun.policy.policy_id} · ${latestRun.policy.risk} risk`
                : "Authorization enforced"
            }
            icon={ShieldCheck}
            status="online"
          />

          <Metric
            label="Verification"
            value={
              latestVerification
                ? latestVerification.verified
                  ? "Verified"
                  : "Mismatch"
                : "Ready"
            }
            detail={
              latestVerification
                ? latestVerification.message
                : "Expected state confirmation"
            }
            icon={
              latestVerification?.verified
                ? CheckCircle2
                : latestVerification
                  ? XCircle
                  : Activity
            }
            status={
              latestVerification
                ? latestVerification.verified
                  ? "online"
                  : "offline"
                : "checking"
            }
          />
        </section>

        <section className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold">
                Production Health
              </p>

              <p className="mt-1 text-xs text-white/35">
                Runtime readiness and autonomous safety controls
              </p>
            </div>

            <button
              type="button"
              onClick={checkBackend}
              className="flex items-center gap-2 self-start rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-white/45 transition hover:bg-white/[0.05] hover:text-white/75 md:self-auto"
            >
              <Activity className="h-3.5 w-3.5" />
              Refresh health
            </button>
          </div>

          <div className="grid divide-y divide-white/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
            <HealthItem
              icon={
                backendStatus === "online"
                  ? CheckCircle2
                  : backendStatus ===
                      "offline"
                    ? XCircle
                    : Activity
              }
              title="Backend API"
              status={
                backendStatus === "online"
                  ? "Operational"
                  : backendStatus ===
                      "offline"
                    ? "Offline"
                    : "Checking"
              }
              description={`${API_BASE_URL}/health`}
              healthy={
                backendStatus === "online"
              }
              warning={
                backendStatus === "offline"
              }
            />

            <HealthItem
              icon={
                latestRun
                  ? CheckCircle2
                  : Activity
              }
              title="Agent Execution"
              status={
                latestRun
                  ? "Ready"
                  : "Awaiting Run"
              }
              description={
                latestRun
                  ? `Latest execution: ${latestRun.ticket_id}`
                  : "Controlled agent workflow is available from the Agent Workspace."
              }
              healthy={Boolean(latestRun)}
              warning={!latestRun}
            />

            <HealthItem
              icon={ShieldCheck}
              title="Policy & Risk Controls"
              status={
                latestRun?.policy
                  ? "Evaluated"
                  : "Monitoring"
              }
              description={
                latestRun?.policy
                  ? `${latestRun.policy.policy_id} · ${latestRun.policy.risk} risk · ${latestPolicy}`
                  : "Risk-sensitive actions remain subject to policy evaluation."
              }
              healthy={
                latestRun?.policy
                  ? latestRun.policy.decision ===
                    "allowed"
                  : false
              }
              warning={
                !latestRun?.policy
              }
            />
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">
                  Latest Agent Execution
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Live execution context shared from the Autonomous Agent Workspace
                </p>
              </div>

              {latestRun && (
                <span className="flex items-center gap-2 self-start rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              )}
            </div>
          </div>

          {latestRun ? (
            <div className="grid gap-px bg-white/[0.05] md:grid-cols-2 xl:grid-cols-5">
              <ExecutionStat
                label="Ticket"
                value={latestRun.ticket_id}
                detail={
                  latestRun.understanding?.category ??
                  "IT request"
                }
              />

              <ExecutionStat
                label="Intent"
                value={
                  latestRun.understanding?.intent ??
                  "Not available"
                }
                detail={
                  latestRun.understanding
                    ? `${Math.round(
                        latestRun.understanding
                          .confidence * 100,
                      )}% confidence`
                    : "No understanding result"
                }
              />

              <ExecutionStat
                label="Policy"
                value={
                  latestRun.policy?.decision ??
                  "Not evaluated"
                }
                detail={
                  latestRun.policy
                    ? `${latestRun.policy.policy_id} · ${latestRun.policy.risk} risk`
                    : "No policy result"
                }
              />

              <ExecutionStat
                label="Tool"
                value={latestTool}
                detail={
                  latestRun.tool
                    ? latestRun.tool.success
                      ? "Execution successful"
                      : "Execution failed"
                    : "No controlled tool executed"
                }
              />

              <ExecutionStat
                label="Verification"
                value={
                  latestVerification
                    ? latestVerification.verified
                      ? "Verified"
                      : "Mismatch"
                    : "Pending"
                }
                detail={
                  latestVerification?.status ??
                  "No verification result"
                }
              />
            </div>
          ) : (
            <div className="px-5 py-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
                  <Activity className="h-4 w-4 text-white/30" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    No agent execution recorded yet
                  </p>

                  <p className="mt-1 text-xs text-white/25">
                    Run a request from the Agent Workspace to
                    populate live execution telemetry here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="text-sm font-semibold">
              Production Topology
            </p>

            <p className="mt-1 text-xs text-white/35">
              Logical execution path for autonomous IT operations
            </p>
          </div>

          <div className="overflow-x-auto px-5 py-8">
            <div className="mx-auto flex min-w-[760px] max-w-6xl items-center justify-center">
              {topology.map(
                (item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex items-center"
                    >
                      <div className="flex min-w-[112px] flex-col items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                            item.label ===
                            "Phoenix Agent"
                              ? "border-white/15 bg-white/[0.07]"
                              : "border-white/[0.08] bg-white/[0.035]"
                          }`}
                        >
                          <Icon className="h-5 w-5 text-white/70" />
                        </div>

                        <span className="mt-2 text-xs font-medium text-white/65">
                          {item.label}
                        </span>
                      </div>

                      {index <
                        topology.length -
                          1 && (
                        <div className="mx-2 h-px w-10 bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <p className="text-sm font-semibold">
                  Runtime Services
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Logical services participating in autonomous operations
                </p>
              </div>

              <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/35">
                {servicesWithStatus.length}{" "}
                services
              </span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {servicesWithStatus.map(
                (service) => {
                  const Icon = service.icon;

                  const isOffline =
                    service.status ===
                    "Unavailable";

                  const isChecking =
                    service.status ===
                    "Checking";

                  return (
                    <div
                      key={service.name}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
                          <Icon className="h-4 w-4 text-white/55" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/85">
                            {service.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-white/35">
                            {service.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isOffline
                              ? "bg-red-400"
                              : isChecking
                                ? "bg-white/40"
                                : "bg-emerald-400"
                          }`}
                        />

                        <span
                          className={`text-xs ${
                            isOffline
                              ? "text-red-300/70"
                              : isChecking
                                ? "text-white/35"
                                : "text-white/45"
                          }`}
                        >
                          {service.status}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <p className="text-sm font-semibold">
                Environment Resources
              </p>

              <p className="mt-1 text-xs text-white/35">
                Logical resources represented by the IT World Model
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/[0.05]">
              {resources.map(
                (resource) => {
                  const Icon =
                    resource.icon;

                  return (
                    <div
                      key={resource.name}
                      className="bg-[#08090a] p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <Icon className="h-4 w-4 text-white/40" />

                        <span className="text-[10px] uppercase tracking-[0.14em] text-white/25">
                          Resource
                        </span>
                      </div>

                      <p className="text-xl font-semibold tracking-[-0.03em]">
                        {resource.value}
                      </p>

                      <p className="mt-1 text-xs font-medium text-white/60">
                        {resource.name}
                      </p>

                      <p className="mt-1 text-[11px] text-white/30">
                        {resource.description}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div>
              <p className="text-sm font-semibold">
                Runtime Activity
              </p>

              <p className="mt-1 text-xs text-white/35">
                Latest autonomous execution state
              </p>
            </div>

            <Link
              href="/observatory"
              className="flex items-center gap-1 text-xs text-white/45 transition hover:text-white"
            >
              Open Observatory
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {latestRun ? (
            <div className="divide-y divide-white/[0.06]">
              <ActivityRow
                icon={Cpu}
                title={`Agent processed ${latestRun.ticket_id}`}
                detail={
                  latestRun.understanding?.intent ??
                  "IT request processing"
                }
                value={latestRun.status}
              />

              {latestRun.policy && (
                <ActivityRow
                  icon={ShieldCheck}
                  title={`Policy ${latestRun.policy.policy_id} evaluated`}
                  detail={`${latestRun.policy.action} · ${latestRun.policy.risk} risk`}
                  value={
                    latestRun.policy
                      .decision
                  }
                />
              )}

              {latestRun.tool && (
                <ActivityRow
                  icon={Workflow}
                  title={`Controlled tool ${latestRun.tool.tool}`}
                  detail={
                    latestRun.tool.message
                  }
                  value={
                    latestRun.tool.success
                      ? "success"
                      : "failed"
                  }
                />
              )}

              {latestRun.verification && (
                <ActivityRow
                  icon={
                    latestRun
                      .verification
                      .verified
                      ? CheckCircle2
                      : XCircle
                  }
                  title="Verification completed"
                  detail={
                    latestRun
                      .verification
                      .message
                  }
                  value={
                    latestRun
                      .verification
                      .verified
                      ? "verified"
                      : "mismatch"
                  }
                />
              )}
            </div>
          ) : (
            <div className="px-5 py-8 text-xs text-white/25">
              No runtime activity is available yet.
              Execute an agent request to populate this
              section.
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035]">
                  <ShieldCheck className="h-4 w-4 text-white/60" />
                </div>

                <p className="text-sm font-semibold">
                  Autonomous Execution Readiness
                </p>
              </div>

              <p className="max-w-2xl text-xs leading-5 text-white/35">
                Phoenix operates through controlled workflows
                where requests are understood, knowledge is
                retrieved, IT state is observed, actions are
                evaluated against policy, tools are executed
                under control, and results are verified before
                resolution.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Intent",
                  "RAG",
                  "World Model",
                  "Planning",
                  "Policy",
                  "Tools",
                  "Verification",
                ].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white/35"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <Link
              href="/agent"
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
            >
              <Play className="h-3.5 w-3.5" />
              Open Agent Workspace
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <footer className="flex flex-col gap-2 px-1 py-6 text-[10px] uppercase tracking-[0.16em] text-white/20 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Phoenix IT Helpdesk · Production Environment · Prototype Runtime
          </span>

          <span>
            FastAPI · Next.js · Controlled Agent Architecture
          </span>
        </footer>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  status: BackendStatus;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
          {label}
        </span>

        <Icon className="h-4 w-4 text-white/30" />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold tracking-[-0.03em]">
          {value}
        </p>

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "online"
              ? "bg-emerald-400"
              : status === "offline"
                ? "bg-red-400"
                : "bg-white/30"
          }`}
        />
      </div>

      <p className="mt-1 truncate text-xs text-white/30">
        {detail}
      </p>
    </div>
  );
}

function HealthItem({
  icon: Icon,
  title,
  status,
  description,
  healthy,
  warning,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  status: string;
  description: string;
  healthy?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
            warning
              ? "border-red-400/15 bg-red-400/[0.05]"
              : healthy
                ? "border-emerald-400/10 bg-emerald-400/[0.04]"
                : "border-white/[0.08] bg-white/[0.03]"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              warning
                ? "text-red-300/75"
                : healthy
                  ? "text-emerald-300/80"
                  : "text-white/45"
            }`}
          />
        </div>

        <span
          className={`text-[10px] font-medium uppercase tracking-[0.14em] ${
            warning
              ? "text-red-300/65"
              : healthy
                ? "text-emerald-300/65"
                : "text-white/35"
          }`}
        >
          {status}
        </span>
      </div>

      <p className="text-sm font-medium text-white/80">
        {title}
      </p>

      <p className="mt-1.5 break-all text-xs leading-5 text-white/30">
        {description}
      </p>

      {healthy && (
        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/25">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          Healthy
        </div>
      )}

      {warning && (
        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-red-300/50">
          <XCircle className="h-3 w-3" />
          Attention required
        </div>
      )}
    </div>
  );
}

function ExecutionStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-[#08090a] p-4">
      <p className="text-[9px] uppercase tracking-[0.14em] text-white/25">
        {label}
      </p>

      <p className="mt-2 truncate font-mono text-sm text-white/70">
        {value}
      </p>

      <p className="mt-1 truncate text-[10px] text-white/25">
        {detail}
      </p>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  title,
  detail,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
          <Icon className="h-3.5 w-3.5 text-white/45" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm text-white/75">
            {title}
          </p>

          <p className="mt-0.5 truncate text-xs text-white/30">
            {detail}
          </p>
        </div>
      </div>

      <span className="ml-11 shrink-0 rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white/35 md:ml-0">
        {value}
      </span>
    </div>
  );
}

function FactoryIcon() {
  return (
    <div className="relative h-5 w-5">
      <div className="absolute bottom-0 left-0 h-3.5 w-4 rounded-sm border border-white/45" />
      <div className="absolute bottom-3.5 left-1 h-2.5 w-1 border-l border-t border-white/45" />
      <div className="absolute bottom-3.5 left-3 h-3 w-1 border-l border-t border-white/45" />
      <div className="absolute bottom-0 right-0 h-5 w-1 border-l border-white/45" />
    </div>
  );
}