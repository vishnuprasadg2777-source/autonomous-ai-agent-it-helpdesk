"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Cpu,
  Database,
  FileText,
  KeyRound,
  Lock,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
  Workflow,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  runAgent,
  type AgentRunResponse,
  type AgentStage,
} from "@/lib/api/client";

const suggestions = [
  {
    ticketId: "INC-1042",
    label: "VPN connectivity",
    request:
      "Please troubleshoot the company VPN and restore my connection.",
  },
  {
    ticketId: "INC-1041",
    label: "Password reset",
    request: "I need to reset my password.",
  },
  {
    ticketId: "INC-1040",
    label: "Software installation",
    request: "I need approval to install approved software.",
  },
  {
    ticketId: "INC-1039",
    label: "Application access",
    request: "I need access to a company application.",
  },
];

const pipeline = [
  {
    id: "understand",
    label: "Understand",
    icon: MessageSquare,
  },
  {
    id: "retrieve",
    label: "Retrieve",
    icon: Database,
  },
  {
    id: "observe",
    label: "Observe",
    icon: Activity,
  },
  {
    id: "reason",
    label: "Reason",
    icon: Cpu,
  },
  {
    id: "policy",
    label: "Policy",
    icon: ShieldCheck,
  },
  {
    id: "execute",
    label: "Execute",
    icon: Terminal,
  },
  {
    id: "verify",
    label: "Verify",
    icon: CheckCircle2,
  },
];

const stageMapping: Record<string, string> = {
  understand: "understand",
  retrieve: "retrieve",
  observe: "observe",
  reason: "reason",
  policy: "policy",
  execute: "execute",
  verify: "verify",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AgentPage() {
  const [request, setRequest] = useState("");
  const [ticketId, setTicketId] = useState("INC-1042");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [displayedStageCount, setDisplayedStageCount] = useState(0);
  const [error, setError] = useState("");

  const selectedSuggestion = useMemo(
    () =>
      suggestions.find(
        (suggestion) =>
          suggestion.ticketId === ticketId &&
          suggestion.request === request,
      ),
    [request, ticketId],
  );

  const submitRequest = async () => {
    const trimmed = request.trim();

    if (!trimmed || running) {
      return;
    }

    setRunning(true);
    setError("");
    setResult(null);
    setDisplayedStageCount(0);

    try {
      const response = await runAgent({
        request: trimmed,
        ticket_id: ticketId,
      });

      /*
       * The backend returns the completed execution trace.
       * The frontend replays that verified trace sequentially so
       * the prototype visibly demonstrates the agent lifecycle.
       */
      const validStages = response.stages.filter(
        (stage) =>
          stage.status === "completed" ||
          stage.status === "blocked" ||
          stage.status === "running",
      );

      for (let index = 0; index < validStages.length; index += 1) {
        setDisplayedStageCount(index + 1);
        await sleep(index === 0 ? 650 : 800);
      }

      setResult({
        ...response,
        stages: response.stages.map((stage) => ({
          ...stage,
          status:
            stage.status === "blocked"
              ? "blocked"
              : "completed",
        })),
      });

      window.localStorage.setItem(
        "autonomous-it:last-agent-run",
        JSON.stringify(response),
      );

      window.dispatchEvent(new Event("autonomous-it:agent-run"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the agent service.",
      );
      setDisplayedStageCount(0);
    } finally {
      setRunning(false);
    }
  };

  const handleSuggestion = (
    suggestion: (typeof suggestions)[number],
  ) => {
    setTicketId(suggestion.ticketId);
    setRequest(suggestion.request);
    setError("");
    setResult(null);
    setDisplayedStageCount(0);
  };

  const clearRun = () => {
    setResult(null);
    setError("");
    setDisplayedStageCount(0);
  };

  const getStageStatus = (id: string) => {
    const pipelineIndex = pipeline.findIndex(
      (stage) => stage.id === id,
    );

    if (running) {
      if (pipelineIndex < displayedStageCount - 1) {
        return "completed";
      }

      if (pipelineIndex === displayedStageCount - 1) {
        return "running";
      }

      return "pending";
    }

    if (!result) {
      return "pending";
    }

    const stageId = stageMapping[id];

    const stage = result.stages.find(
      (item) => item.id === stageId,
    );

    return stage?.status ?? "completed";
  };

  const activePipelineIndex = running
    ? Math.max(0, displayedStageCount - 1)
    : -1;

  const visibleStages = running
    ? result?.stages.slice(0, displayedStageCount) ?? []
    : result?.stages ?? [];

  return (
    <div className="min-h-full bg-[#060708] text-zinc-200">
      <header className="border-b border-white/[0.06] px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-300/[0.12] bg-indigo-300/[0.035]">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-200/70" />
                </span>

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Autonomous Operations
                </span>
              </div>

              <h1 className="text-[25px] font-medium tracking-[-0.03em] text-zinc-100">
                AI Agent Workspace
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-zinc-600">
                Understand requests, retrieve relevant knowledge, reason over
                IT state, enforce policy, execute controlled actions and
                verify the resulting environment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.025] px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[9px] text-emerald-300/60">
                  Agent runtime ready
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <Workflow className="h-3 w-3 text-zinc-700" />

                <span className="text-[8px] text-zinc-600">
                  Controlled execution
                </span>
              </div>

              {result && (
                <button
                  type="button"
                  onClick={clearRun}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[8px] text-zinc-600 transition hover:border-white/[0.1] hover:text-zinc-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  New run
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6 lg:px-8">
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <UserRound className="h-3.5 w-3.5 text-zinc-600" />

                  <p className="text-[10px] font-medium text-zinc-400">
                    Request composer
                  </p>
                </div>

                <p className="mt-1 text-[8px] text-zinc-700">
                  Submit a Level-1 IT request to the autonomous helpdesk
                  agent.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[7px] uppercase tracking-[0.12em] text-zinc-800">
                  Ticket
                </span>

                <select
                  value={ticketId}
                  onChange={(event) => setTicketId(event.target.value)}
                  className="rounded-md border border-white/[0.06] bg-[#090b0d] px-2.5 py-1.5 font-mono text-[8px] text-zinc-500 outline-none transition focus:border-indigo-300/[0.15]"
                >
                  {suggestions.map((suggestion) => (
                    <option
                      key={suggestion.ticketId}
                      value={suggestion.ticketId}
                    >
                      {suggestion.ticketId}
                    </option>
                  ))}
                </select>

                <span className="font-mono text-[7px] text-zinc-800">
                  AGENT / RUN
                </span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-xl border border-white/[0.07] bg-black/20">
              <textarea
                value={request}
                onChange={(event) => setRequest(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    void submitRequest();
                  }
                }}
                placeholder="Describe the IT issue or request..."
                rows={4}
                className="w-full resize-none bg-transparent px-4 py-4 text-[11px] leading-6 text-zinc-300 outline-none placeholder:text-zinc-800"
              />

              <div className="flex flex-col justify-between gap-3 border-t border-white/[0.05] px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-[8px] text-zinc-700">
                  <Lock className="h-3 w-3" />

                  <span>
                    Execution is governed by policy and verification
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void submitRequest()}
                  disabled={!request.trim() || running}
                  className="flex h-8 items-center justify-center gap-2 rounded-lg border border-indigo-300/[0.12] bg-indigo-300/[0.06] px-4 text-[9px] font-medium text-indigo-200/70 transition hover:bg-indigo-300/[0.1] hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {running ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Agent running
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Run agent
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => {
                const active =
                  selectedSuggestion?.ticketId === suggestion.ticketId;

                return (
                  <button
                    key={suggestion.ticketId}
                    type="button"
                    onClick={() => handleSuggestion(suggestion)}
                    className={`rounded-full border px-3 py-1.5 text-left text-[8px] transition ${
                      active
                        ? "border-indigo-300/[0.12] bg-indigo-300/[0.04] text-indigo-200/60"
                        : "border-white/[0.05] bg-white/[0.015] text-zinc-700 hover:border-white/[0.09] hover:bg-white/[0.03] hover:text-zinc-500"
                    }`}
                  >
                    <span className="font-mono">{suggestion.ticketId}</span>
                    <span className="mx-1.5 text-zinc-800">·</span>
                    {suggestion.label}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-300/[0.08] bg-red-300/[0.02] px-3 py-3">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300/60" />

                <div>
                  <p className="text-[9px] font-medium text-red-300/70">
                    Agent request failed
                  </p>

                  <p className="mt-1 text-[8px] leading-5 text-zinc-700">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Workflow className="h-3.5 w-3.5 text-zinc-600" />

              <p className="text-[10px] font-medium text-zinc-400">
                Autonomous execution pipeline
              </p>
            </div>

            <p className="mt-1 text-[8px] text-zinc-700">
              The agent moves through controlled stages instead of directly
              executing an unrestricted action.
            </p>
          </div>

          <div className="overflow-x-auto p-5">
            <div className="mx-auto flex min-w-[850px] items-center justify-center gap-2">
              {pipeline.map((stage, index) => {
                const Icon = stage.icon;
                const status = getStageStatus(stage.id);
                const completed = status === "completed";
                const active =
                  running && index === activePipelineIndex;

                return (
                  <div
                    key={stage.id}
                    className="flex items-center gap-2"
                  >
                    <PipelineNode
                      icon={Icon}
                      label={stage.label}
                      completed={completed}
                      active={active}
                      pending={status === "pending"}
                    />

                    {index < pipeline.length - 1 && (
                      <ArrowRight
                        className={`h-3 w-3 shrink-0 transition-colors duration-500 ${
                          completed
                            ? "text-emerald-300/30"
                            : "text-zinc-800"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-[10px] font-medium text-zinc-400">
                  Execution trace
                </p>

                <p className="mt-1 text-[8px] text-zinc-700">
                  Agent stages and execution state
                </p>
              </div>

              {result && <StatusBadge status={result.status} />}
            </div>

            <div className="divide-y divide-white/[0.05]">
              {result || running ? (
                visibleStages.length > 0 ? (
                  visibleStages.map((stage, index) => (
                    <ExecutionStageRow
                      key={stage.id}
                      stage={
                        running && index === displayedStageCount - 1
                          ? {
                              ...stage,
                              status: "running",
                            }
                          : stage
                      }
                      index={index}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="Initializing agent"
                    description="The agent is preparing the execution trace."
                  />
                )
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No execution yet"
                  description="Submit a request to start an autonomous agent run."
                />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[10px] font-medium text-zinc-400">
                  Request understanding
                </p>
              </div>

              <p className="mt-1 text-[8px] text-zinc-700">
                Structured interpretation generated before planning.
              </p>
            </div>

            {result?.understanding ? (
              <div className="space-y-2 p-5">
                <DataRow
                  label="Intent"
                  value={result.understanding.intent}
                />

                <DataRow
                  label="Category"
                  value={result.understanding.category}
                />

                <DataRow
                  label="Priority"
                  value={result.understanding.priority}
                />

                <DataRow
                  label="Confidence"
                  value={`${Math.round(
                    result.understanding.confidence * 100,
                  )}%`}
                  positive
                />

                <DataRow
                  label="Ticket"
                  value={result.ticket_id}
                  mono
                />

                {Object.entries(
                  result.understanding.entities ?? {},
                ).length > 0 && (
                  <div className="mt-3 border-t border-white/[0.05] pt-3">
                    <p className="mb-2 text-[7px] uppercase tracking-[0.1em] text-zinc-800">
                      Entities
                    </p>

                    <div className="space-y-2">
                      {Object.entries(
                        result.understanding.entities,
                      ).map(([key, value]) => (
                        <DataRow
                          key={key}
                          label={key.replaceAll("_", " ")}
                          value={value}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Waiting for request"
                description="Intent, entities and priority will appear here."
              />
            )}
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <KnowledgePanel result={result} />
          <WorldStatePanel result={result} />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <PlanPanel result={result} />
          <PolicyPanel result={result} />
          <ToolPanel result={result} />
        </div>

        <VerificationPanel result={result} />

        <footer className="flex flex-col justify-between gap-3 border-t border-white/[0.05] pt-5 text-[8px] text-zinc-700 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />

            <span>
              PHOENIX AI Agent — Understand. Decide. Act. Verify.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Controlled</span>
            <span>→</span>
            <span>Observable</span>
            <span>→</span>
            <span>Verifiable</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function PipelineNode({
  icon: Icon,
  label,
  completed,
  active,
  pending,
}: {
  icon: typeof Activity;
  label: string;
  completed: boolean;
  active: boolean;
  pending: boolean;
}) {
  return (
    <motion.div
      animate={{
        scale: active ? 1.025 : 1,
      }}
      transition={{ duration: 0.3 }}
      className={`flex min-w-[92px] flex-col items-center gap-2 rounded-lg border px-3 py-3 transition-all duration-500 ${
        completed
          ? "border-emerald-300/[0.08] bg-emerald-300/[0.025]"
          : active
            ? "border-indigo-300/[0.14] bg-indigo-300/[0.045]"
            : "border-white/[0.05] bg-white/[0.012]"
      }`}
    >
      <div
        className={`relative flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-500 ${
          active
            ? "border-indigo-300/[0.14] bg-indigo-300/[0.06]"
            : "border-white/[0.05] bg-white/[0.018]"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/60" />
        ) : active ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-200/70" />
        ) : (
          <Icon
            className={`h-3.5 w-3.5 ${
              pending ? "text-zinc-800" : "text-zinc-700"
            }`}
          />
        )}

        {active && (
          <span className="absolute inset-0 rounded-md border border-indigo-300/[0.08] animate-pulse" />
        )}
      </div>

      <span
        className={`text-[8px] font-medium transition-colors duration-500 ${
          completed
            ? "text-emerald-300/60"
            : active
              ? "text-indigo-200/80"
              : "text-zinc-600"
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
}

function ExecutionStageRow({
  stage,
}: {
  stage: AgentStage;
  index: number;
}) {
  const completed = stage.status === "completed";
  const blocked = stage.status === "blocked";
  const running = stage.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 px-5 py-4 ${
        running ? "bg-indigo-300/[0.018]" : ""
      }`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.018]">
        {completed ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-300/60" />
        ) : blocked ? (
          <XCircle className="h-3 w-3 text-red-300/60" />
        ) : running ? (
          <RefreshCw className="h-3 w-3 animate-spin text-indigo-200/60" />
        ) : (
          <CircleDot className="h-3 w-3 text-zinc-700" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[9px] font-medium text-zinc-400">
            {stage.label}
          </p>

          <span
            className={`rounded-full border px-2 py-0.5 text-[7px] ${
              running
                ? "border-indigo-300/[0.1] text-indigo-200/60"
                : completed
                  ? "border-emerald-300/[0.07] text-emerald-300/50"
                  : blocked
                    ? "border-red-300/[0.08] text-red-300/60"
                    : "border-white/[0.05] text-zinc-700"
            }`}
          >
            {running ? "running" : stage.status}
          </span>

          {stage.duration && (
            <span className="font-mono text-[7px] text-zinc-800">
              {stage.duration}
            </span>
          )}
        </div>

        <p className="mt-1 text-[8px] leading-5 text-zinc-700">
          {stage.description}
        </p>
      </div>
    </motion.div>
  );
}

function KnowledgePanel({
  result,
}: {
  result: AgentRunResponse | null;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
      <PanelHeader
        icon={Database}
        title="Knowledge retrieval"
        description="Retrieved knowledge used to ground the agent decision."
      />

      {result?.retrieved_knowledge?.length ? (
        <div className="divide-y divide-white/[0.05]">
          {result.retrieved_knowledge.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-medium text-zinc-400">
                    {item.title}
                  </p>

                  <p className="mt-1 text-[7px] text-zinc-700">
                    {item.id} · {item.category}
                  </p>
                </div>

                <span className="font-mono text-[8px] text-emerald-300/50">
                  {Math.round(item.relevance * 100)}%
                </span>
              </div>

              <p className="mt-3 text-[8px] leading-5 text-zinc-700">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Database}
          title="No retrieval results"
          description="Relevant knowledge sources will appear after the request is understood."
        />
      )}
    </section>
  );
}

function WorldStatePanel({
  result,
}: {
  result: AgentRunResponse | null;
}) {
  const state = result?.it_state;

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
      <PanelHeader
        icon={Network}
        title="IT World state"
        description="Environmental state observed before autonomous action."
      />

      {state ? (
        <div className="grid gap-px bg-white/[0.04] sm:grid-cols-2">
          {Object.entries(state)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => (
              <div
                key={key}
                className="bg-[#090b0d] px-4 py-3"
              >
                <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
                  {key.replaceAll("_", " ")}
                </p>

                <p
                  className={`mt-1 text-[9px] font-medium ${
                    key === "vpn_client" && value === "disconnected"
                      ? "text-amber-300/60"
                      : "text-emerald-300/60"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={Network}
          title="No observed state"
          description="The agent will observe the relevant IT environment before acting."
        />
      )}
    </section>
  );
}

function PlanPanel({
  result,
}: {
  result: AgentRunResponse | null;
}) {
  const plan = result?.plan;

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
      <PanelHeader
        icon={Cpu}
        title="Agent plan"
        description="Candidate action selected through reasoning."
      />

      {plan ? (
        <div className="space-y-3 p-5">
          <DataRow label="Action" value={plan.action} />
          <DataRow label="Target" value={plan.target} />

          <div>
            <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
              Rationale
            </p>

            <p className="mt-1 text-[8px] leading-5 text-zinc-600">
              {plan.rationale}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DataRow label="Risk" value={plan.risk} />
            <DataRow
              label="Confidence"
              value={`${Math.round(plan.confidence * 100)}%`}
              positive
            />
          </div>

          <div className="flex items-center gap-2 border-t border-white/[0.05] pt-3">
            <KeyRound className="h-3 w-3 text-zinc-700" />

            <span className="text-[8px] text-zinc-600">
              Authorization{" "}
              {plan.requires_authorization
                ? "required"
                : "not required"}
            </span>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Cpu}
          title="No plan yet"
          description="The agent plan will appear after state observation."
        />
      )}
    </section>
  );
}

function PolicyPanel({
  result,
}: {
  result: AgentRunResponse | null;
}) {
  const policy = result?.policy;

  const allowed = policy?.decision === "allowed";
  const blocked = policy?.decision === "blocked";

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
      <PanelHeader
        icon={ShieldCheck}
        title="Policy & authorization"
        description="Risk and authorization decision before tool execution."
      />

      {policy ? (
        <div className="space-y-3 p-5">
          <div
            className={`rounded-lg border px-4 py-3 ${
              allowed
                ? "border-emerald-300/[0.08] bg-emerald-300/[0.02]"
                : blocked
                  ? "border-red-300/[0.08] bg-red-300/[0.02]"
                  : "border-amber-300/[0.08] bg-amber-300/[0.02]"
            }`}
          >
            <div className="flex items-center gap-2">
              {allowed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/60" />
              ) : blocked ? (
                <XCircle className="h-3.5 w-3.5 text-red-300/60" />
              ) : (
                <Clock3 className="h-3.5 w-3.5 text-amber-300/60" />
              )}

              <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                {policy.decision}
              </span>
            </div>
          </div>

          <DataRow label="Policy" value={policy.policy_id} mono />
          <DataRow label="Action" value={policy.action} />
          <DataRow label="Risk" value={policy.risk} />

          <div>
            <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
              Decision reason
            </p>

            <p className="mt-1 text-[8px] leading-5 text-zinc-600">
              {policy.reason}
            </p>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No policy decision"
          description="Policy evaluation occurs before a controlled action is executed."
        />
      )}
    </section>
  );
}

function ToolPanel({
  result,
}: {
  result: AgentRunResponse | null;
}) {
  const tool = result?.tool;

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
      <PanelHeader
        icon={Terminal}
        title="Controlled tool"
        description="Action executed through the controlled tool layer."
      />

      {tool ? (
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.012] px-3 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-zinc-700" />

              <span className="font-mono text-[8px] text-zinc-500">
                {tool.tool}
              </span>
            </div>

            {tool.success ? (
              <span className="text-[8px] text-emerald-300/60">
                SUCCESS
              </span>
            ) : (
              <span className="text-[8px] text-red-300/60">
                FAILED
              </span>
            )}
          </div>

          <p className="text-[8px] leading-5 text-zinc-600">
            {tool.message}
          </p>

          {Object.entries(tool.state_changes).map(
            ([key, value]) => (
              <DataRow
                key={key}
                label={key.replaceAll("_", " ")}
                value={value}
                positive
              />
            ),
          )}
        </div>
      ) : (
        <EmptyState
          icon={Terminal}
          title="No tool execution"
          description="A controlled tool will appear here only after policy evaluation allows execution."
        />
      )}
    </section>
  );
}

function VerificationPanel({
  result,
}: {
  result: AgentRunResponse | null;
}) {
  const verification = result?.verification;

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
      <PanelHeader
        icon={CheckCircle2}
        title="Verification"
        description="The agent compares expected state with observed state before resolving the request."
      />

      {verification ? (
        <div className="grid gap-px bg-white/[0.04] md:grid-cols-3">
          <div className="bg-[#090b0d] p-5">
            <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
              Result
            </p>

            <div className="mt-3 flex items-center gap-2">
              {verification.verified ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300/60" />
              ) : (
                <XCircle className="h-4 w-4 text-red-300/60" />
              )}

              <span className="text-[10px] font-medium text-zinc-400">
                {verification.status}
              </span>
            </div>
          </div>

          <div className="bg-[#090b0d] p-5">
            <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
              Expected state
            </p>

            <div className="mt-3 space-y-2">
              {Object.entries(verification.expected_state).map(
                ([key, value]) => (
                  <DataRow
                    key={key}
                    label={key.replaceAll("_", " ")}
                    value={value}
                  />
                ),
              )}
            </div>
          </div>

          <div className="bg-[#090b0d] p-5">
            <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-800">
              Observed state
            </p>

            <div className="mt-3 space-y-2">
              {Object.entries(verification.observed_state).map(
                ([key, value]) => (
                  <DataRow
                    key={key}
                    label={key.replaceAll("_", " ")}
                    value={value}
                    positive={verification.verified}
                  />
                ),
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.05] px-5 py-4 md:col-span-3">
            <p className="text-[8px] leading-5 text-zinc-600">
              {verification.message}
            </p>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="Verification pending"
          description="The request is not considered resolved until the resulting IT state is verified."
        />
      )}
    </section>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-white/[0.06] px-5 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-zinc-600" />

        <p className="text-[10px] font-medium text-zinc-400">
          {title}
        </p>
      </div>

      <p className="mt-1 text-[8px] text-zinc-700">
        {description}
      </p>
    </div>
  );
}

function DataRow({
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
        className={`text-right text-[8px] ${
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const resolved = status === "resolved";
  const escalated = status === "escalated";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[7px] uppercase tracking-[0.08em] ${
        resolved
          ? "border-emerald-300/[0.08] bg-emerald-300/[0.025] text-emerald-300/60"
          : escalated
            ? "border-amber-300/[0.08] bg-amber-300/[0.025] text-amber-300/60"
            : "border-indigo-300/[0.08] bg-indigo-300/[0.025] text-indigo-200/60"
      }`}
    >
      {status}
    </span>
  );
}