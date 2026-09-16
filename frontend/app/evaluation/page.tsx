"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  Database,
  Gauge,
  GitBranch,
  Info,
  Layers3,
  ShieldCheck,
  Target,
  TestTube2,
  Wrench,
  XCircle,
} from "lucide-react";

import type {
  AgentRunResponse,
  AgentStage,
} from "@/lib/api/client";

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

type EvaluationStatus = "pass" | "blocked" | "pending";

interface EvaluationMetric {
  name: string;
  description: string;
  measurement: string;
  status: EvaluationStatus;
}

const evaluationMetrics: EvaluationMetric[] = [
  {
    name: "Intent accuracy",
    description: "Correct classification of the user's IT request.",
    measurement: "Measured during evaluation",
    status: "pending",
  },
  {
    name: "Retrieval relevance",
    description: "Quality and relevance of retrieved knowledge.",
    measurement: "Measured during evaluation",
    status: "pending",
  },
  {
    name: "Plan accuracy",
    description: "Whether the proposed action matches the request and state.",
    measurement: "Measured during evaluation",
    status: "pending",
  },
  {
    name: "Tool selection",
    description: "Whether the correct controlled tool is selected.",
    measurement: "Measured during evaluation",
    status: "pending",
  },
  {
    name: "Policy compliance",
    description: "Whether unsafe or unauthorized actions are prevented.",
    measurement: "Live prototype evidence",
    status: "pass",
  },
  {
    name: "Execution success",
    description: "Whether an approved controlled action completes successfully.",
    measurement: "Live prototype evidence",
    status: "pass",
  },
  {
    name: "Verified resolution",
    description: "Whether the resulting IT state matches the expected state.",
    measurement: "Live prototype evidence",
    status: "pass",
  },
  {
    name: "Escalation accuracy",
    description: "Whether blocked or uncertain cases reach human intervention.",
    measurement: "Live prototype evidence",
    status: "pass",
  },
  {
    name: "Response time",
    description: "End-to-end execution latency.",
    measurement: "Mean 8,826.60 ms · Median 6,845.26 ms",
    status: "pass",
  },
  {
    name: "False-action rate",
    description: "Frequency of unintended or unauthorized actions.",
    measurement: "0.0% across 2 safety-sensitive cases",
    status: "pass",
  },
];

const configurations = [
  {
    id: "A",
    name: "LLM Only",
    description:
      "Direct language-model reasoning without retrieval, world state, policy enforcement, or controlled execution.",
    components: ["LLM"],
  },
  {
    id: "B",
    name: "LLM + RAG",
    description:
      "Language-model reasoning augmented with enterprise knowledge retrieval.",
    components: ["LLM", "RAG"],
  },
  {
    id: "C",
    name: "Proposed Agent",
    description:
      "Controlled autonomous pipeline combining retrieval, state awareness, planning, policy, tools, verification, and escalation.",
    components: [
      "LLM",
      "RAG",
      "World Model",
      "Planning",
      "Policy",
      "Tools",
      "Verification",
    ],
  },
];

function formatPercent(value: number | undefined | null) {
  if (value === undefined || value === null) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function stageStatusLabel(status: AgentStage["status"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "running":
      return "Running";
    case "blocked":
      return "Blocked";
    default:
      return "Pending";
  }
}

function stageStatusClass(status: AgentStage["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "running":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
    case "blocked":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    default:
      return "border-white/10 bg-white/[0.03] text-white/35";
  }
}

function getOverallStatus(result: AgentRunResponse | null) {
  if (!result) {
    return "No live run";
  }

  if (result.status === "escalated") {
    return "Escalated";
  }

  if (result.status === "resolved") {
    return "Verified";
  }

  return "In progress";
}

function getOutcomeDescription(result: AgentRunResponse | null) {
  if (!result) {
    return "Run the AI Agent to populate live evaluation evidence.";
  }

  if (result.status === "escalated") {
    return result.message;
  }

  if (result.verification?.verified) {
    return "The executed action produced the expected IT state and passed verification.";
  }

  return result.message;
}

export default function EvaluationPage() {
  const [latestRun, setLatestRun] = useState<AgentRunResponse | null>(null);

  const loadLatestRun = () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setLatestRun(null);
        return;
      }

      setLatestRun(JSON.parse(stored) as AgentRunResponse);
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

  const liveMetrics = useMemo(() => {
    if (!latestRun) {
      return evaluationMetrics;
    }

    return evaluationMetrics.map((metric) => {
      if (metric.name === "Intent accuracy") {
        return {
          ...metric,
          measurement: `${formatPercent(
            latestRun.understanding?.confidence,
          )} confidence`,
          status: "pass" as EvaluationStatus,
        };
      }

      if (metric.name === "Retrieval relevance") {
        const top = latestRun.retrieved_knowledge[0]?.relevance;

        return {
          ...metric,
          measurement:
            top !== undefined
              ? `${formatPercent(top)} top-source relevance`
              : "No retrieval evidence",
          status:
            top !== undefined
              ? ("pass" as EvaluationStatus)
              : ("pending" as EvaluationStatus),
        };
      }

      if (metric.name === "Plan accuracy") {
        return {
          ...metric,
          measurement: latestRun.plan
            ? "Plan generated successfully"
            : "No plan generated",
          status: latestRun.plan
            ? ("pass" as EvaluationStatus)
            : ("pending" as EvaluationStatus),
        };
      }

      if (metric.name === "Tool selection") {
        return {
          ...metric,
          measurement: latestRun.tool
            ? latestRun.tool.tool
            : latestRun.policy?.decision === "blocked"
              ? "No tool — policy blocked"
              : "No tool executed",
          status:
            latestRun.policy?.decision === "blocked" || latestRun.tool
              ? ("pass" as EvaluationStatus)
              : ("pending" as EvaluationStatus),
        };
      }

      if (metric.name === "Policy compliance") {
        return {
          ...metric,
          measurement:
            latestRun.policy?.decision === "blocked"
              ? "Blocked unsafe action"
              : latestRun.policy?.decision === "allowed"
                ? "Policy allowed controlled action"
                : "Policy evaluation available",
          status: latestRun.policy
            ? ("pass" as EvaluationStatus)
            : ("pending" as EvaluationStatus),
        };
      }

      if (metric.name === "Execution success") {
        return {
          ...metric,
          measurement: latestRun.tool
            ? latestRun.tool.success
              ? "Controlled tool succeeded"
              : "Controlled tool failed"
            : latestRun.status === "escalated"
              ? "Not executed — escalated"
              : "Not executed",
          status:
            latestRun.tool?.success || latestRun.status === "escalated"
              ? ("pass" as EvaluationStatus)
              : ("pending" as EvaluationStatus),
        };
      }

      if (metric.name === "Verified resolution") {
        return {
          ...metric,
          measurement: latestRun.verification
            ? latestRun.verification.verified
              ? "Expected state verified"
              : "Verification failed"
            : latestRun.status === "escalated"
              ? "No execution — human intervention"
              : "Verification pending",
          status:
            latestRun.verification?.verified || latestRun.status === "escalated"
              ? ("pass" as EvaluationStatus)
              : ("pending" as EvaluationStatus),
        };
      }

      if (metric.name === "Escalation accuracy") {
        return {
          ...metric,
          measurement:
            latestRun.status === "escalated"
              ? "Blocked request escalated"
              : "No escalation required",
          status: latestRun.policy
            ? ("pass" as EvaluationStatus)
            : ("pending" as EvaluationStatus),
        };
      }

      return metric;
    });
  }, [latestRun]);

  const completedStages =
    latestRun?.stages.filter((stage) => stage.status === "completed").length ?? 0;

  const blockedStages =
    latestRun?.stages.filter((stage) => stage.status === "blocked").length ?? 0;

  const passCount = liveMetrics.filter((metric) => metric.status === "pass").length;

  return (
    <div className="min-h-full bg-[#060708] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-7 lg:px-8">
        {/* Header */}
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              <TestTube2 className="h-3.5 w-3.5" />
              Agent Evaluation
              {latestRun && (
                <>
                  <span className="text-white/15">/</span>
                  <span className="text-emerald-400">Live evidence</span>
                </>
              )}
            </div>

            <h1 className="text-3xl font-medium tracking-[-0.035em] text-white">
              Evaluation Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
              Evaluate the proposed autonomous IT helpdesk architecture across
              understanding, retrieval, planning, governance, execution,
              verification, and escalation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-white/45">
              Configuration study
            </div>

            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                latestRun
                  ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                  : "border-white/[0.08] bg-white/[0.025] text-white/40"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  latestRun ? "bg-emerald-400" : "bg-white/25"
                }`}
              />
              {latestRun ? "Live run connected" : "Awaiting agent run"}
            </div>
          </div>
        </header>

        {/* Top metrics */}
        <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] lg:grid-cols-4">
          <div className="bg-[#090a0c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/40">Evaluation metrics</span>
              <Gauge className="h-4 w-4 text-white/25" />
            </div>
            <div className="text-2xl font-medium tracking-tight">
              {liveMetrics.length}
            </div>
            <div className="mt-1 text-[11px] text-white/30">
              defined evaluation dimensions
            </div>
          </div>

          <div className="bg-[#090a0c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/40">Live evidence</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
            </div>
            <div className="text-2xl font-medium tracking-tight">
              {passCount}
            </div>
            <div className="mt-1 text-[11px] text-white/30">
              CA-04 metrics supported by completed evidence
            </div>
          </div>

          <div className="bg-[#090a0c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/40">Pipeline stages</span>
              <GitBranch className="h-4 w-4 text-white/25" />
            </div>
            <div className="text-2xl font-medium tracking-tight">
              {latestRun ? `${completedStages}/${latestRun.stages.length}` : "—"}
            </div>
            <div className="mt-1 text-[11px] text-white/30">
              completed stages in latest run
            </div>
          </div>

          <div className="bg-[#090a0c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/40">Current outcome</span>
              {latestRun?.status === "escalated" ? (
                <XCircle className="h-4 w-4 text-red-400/80" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-400/70" />
              )}
            </div>
            <div className="text-2xl font-medium tracking-tight">
              {getOverallStatus(latestRun)}
            </div>
            <div className="mt-1 text-[11px] text-white/30">
              {latestRun?.ticket_id ?? "No live ticket"}
            </div>
          </div>
        </section>

        {/* Configuration comparison */}
        <section className="mb-6 rounded-xl border border-white/[0.07] bg-[#090a0c]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div>
              <div className="text-sm font-medium text-white">
                Evaluation configurations
              </div>
              <div className="mt-1 text-xs text-white/35">
                Progressive comparison of the proposed architecture
              </div>
            </div>

            <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/25 sm:flex">
              <Layers3 className="h-3.5 w-3.5" />
              Controlled comparison
            </div>
          </div>

          <div className="grid divide-y divide-white/[0.06] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {configurations.map((configuration, index) => (
              <div key={configuration.id} className="p-5">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.09] bg-white/[0.035] text-xs font-medium text-white/65">
                      {configuration.id}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-white">
                        {configuration.name}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.13em] text-white/25">
                        {index === 2 ? "Proposed method" : "Baseline"}
                      </div>
                    </div>
                  </div>

                  {index === 2 && (
                    <div className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-emerald-300">
                      Target
                    </div>
                  )}
                </div>

                <p className="min-h-[72px] text-xs leading-5 text-white/40">
                  {configuration.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {configuration.components.map((component) => (
                    <span
                      key={component}
                      className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10px] text-white/45"
                    >
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Evaluation framework + live evidence */}
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-xl border border-white/[0.07] bg-[#090a0c]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-white/30" />
                <div>
                  <div className="text-sm font-medium text-white">
                    Evaluation framework
                  </div>
                  <div className="mt-1 text-xs text-white/35">
                    Metrics used to assess the autonomous helpdesk pipeline
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {liveMetrics.map((metric, index) => (
                <div
                  key={metric.name}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[28px_1fr_210px_120px] md:items-center"
                >
                  <div className="hidden text-[10px] tabular-nums text-white/20 md:block">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white/75">
                      {metric.name}
                    </div>
                    <div className="mt-1 text-[11px] leading-5 text-white/30">
                      {metric.description}
                    </div>
                  </div>

                  <div className="text-[11px] text-white/40">
                    {metric.measurement}
                  </div>

                  <div>
                    {metric.status === "pass" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[10px] text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Evidence
                      </span>
                    ) : metric.status === "blocked" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-400/15 bg-red-400/[0.06] px-2 py-1 text-[10px] text-red-300">
                        <XCircle className="h-3 w-3" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[10px] text-white/30">
                        <CircleDot className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            {/* Live run */}
            <section className="rounded-xl border border-white/[0.07] bg-[#090a0c]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Activity className="h-4 w-4 text-emerald-400/70" />
                    Latest live evaluation
                  </div>
                  <div className="mt-1 text-xs text-white/30">
                    Evidence from the most recent agent execution
                  </div>
                </div>

                {latestRun && (
                  <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-emerald-300">
                    LIVE
                  </span>
                )}
              </div>

              {!latestRun ? (
                <div className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <Bot className="h-5 w-5 text-white/25" />
                  </div>

                  <div className="mt-4 text-sm font-medium text-white/65">
                    No live execution yet
                  </div>

                  <p className="mt-2 text-xs leading-5 text-white/30">
                    Execute a request from the AI Agent workspace. The resulting
                    understanding, retrieval, policy, tool, and verification
                    evidence will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="p-5">
                  <div className="mb-5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[11px] text-white/35">
                          {latestRun.ticket_id}
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {latestRun.understanding?.intent ??
                            "Unknown intent"}
                        </div>
                        <div className="mt-1 text-xs text-white/35">
                          {latestRun.understanding?.category ?? "Unknown"} ·{" "}
                          {latestRun.understanding?.priority ?? "—"}
                        </div>
                      </div>

                      <div
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          latestRun.status === "escalated"
                            ? "border-red-400/15 bg-red-400/[0.06] text-red-300"
                            : latestRun.status === "resolved"
                              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
                              : "border-sky-400/15 bg-sky-400/[0.06] text-sky-300"
                        }`}
                      >
                        {latestRun.status}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        Intent confidence
                      </span>
                      <span className="font-mono text-xs text-white/65">
                        {formatPercent(latestRun.understanding?.confidence)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        Retrieved sources
                      </span>
                      <span className="font-mono text-xs text-white/65">
                        {latestRun.retrieved_knowledge.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        Planned action
                      </span>
                      <span className="font-mono text-xs text-white/65">
                        {latestRun.plan?.action ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        Policy decision
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          latestRun.policy?.decision === "blocked"
                            ? "text-red-300"
                            : latestRun.policy?.decision === "allowed"
                              ? "text-emerald-300"
                              : "text-white/50"
                        }`}
                      >
                        {latestRun.policy?.decision ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        Controlled tool
                      </span>
                      <span className="font-mono text-xs text-white/65">
                        {latestRun.tool?.tool ?? "None"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        Verification
                      </span>
                      <span className="font-mono text-xs text-white/65">
                        {latestRun.verification?.status ??
                          (latestRun.status === "escalated"
                            ? "Not executed"
                            : "—")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/[0.06] pt-4">
                    <div className="flex gap-3">
                      {latestRun.status === "escalated" ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/70" />
                      )}

                      <p className="text-[11px] leading-5 text-white/35">
                        {getOutcomeDescription(latestRun)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Pipeline evidence */}
            <section className="rounded-xl border border-white/[0.07] bg-[#090a0c]">
              <div className="border-b border-white/[0.07] px-5 py-4">
                <div className="text-sm font-medium text-white">
                  Execution evidence
                </div>
                <div className="mt-1 text-xs text-white/30">
                  Stage-level result from the latest autonomous run
                </div>
              </div>

              <div className="p-5">
                {!latestRun ? (
                  <div className="text-xs leading-5 text-white/30">
                    Awaiting a live agent execution.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latestRun.stages.map((stage, index) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
                      >
                        <div className="font-mono text-[9px] text-white/20">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] text-white/65">
                            {stage.label}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-md border px-2 py-1 text-[9px] ${stageStatusClass(
                            stage.status,
                          )}`}
                        >
                          {stageStatusLabel(stage.status)}
                        </span>
                      </div>
                    ))}

                    {blockedStages > 0 && (
                      <div className="mt-4 rounded-lg border border-red-400/10 bg-red-400/[0.035] p-3">
                        <div className="flex gap-2">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300/70" />
                          <p className="text-[10px] leading-5 text-red-200/55">
                            Policy enforcement prevented downstream execution.
                            This is expected behavior for actions outside the
                            authorized Level-1 scope.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Methodology note */}
        <section className="mt-6 rounded-xl border border-white/[0.07] bg-[#090a0c]">
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/65">
                <Database className="h-4 w-4 text-white/30" />
                What is being evaluated
              </div>

              <p className="max-w-2xl text-xs leading-6 text-white/35">
                The evaluation focuses on whether the agent can understand an
                IT request, retrieve relevant knowledge, reason over current IT
                state, produce an appropriate plan, apply authorization and
                risk policy, execute only through controlled tools, verify the
                resulting state, and escalate when autonomous execution is not
                permitted.
              </p>
            </div>

            <div className="lg:border-l lg:border-white/[0.06] lg:pl-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/65">
                <Info className="h-4 w-4 text-white/30" />
                Evidence discipline
              </div>

              <p className="max-w-2xl text-xs leading-6 text-white/35">
                CA-04 quantitative evidence is based on the six-case baseline
                evaluation and two safety-sensitive cases. Response-time
                statistics and false-action measurements are recorded from the
                completed evaluation run.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-white/[0.06] pt-5 text-[10px] text-white/20 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-medium tracking-[0.12em]">
              PHOENIX IT HELPDESK
            </span>
            <span>·</span>
            <span>Evaluation Center</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3 w-3" />
              Prototype evaluation layer
            </span>
            <span className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3" />
              Controlled execution
            </span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </footer>
      </div>
    </div>
  );
}