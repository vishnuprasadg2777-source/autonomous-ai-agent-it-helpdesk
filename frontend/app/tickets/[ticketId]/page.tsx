"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";
import {
  getTicket,
  runAgent,
  type AgentRunResponse,
  type Ticket,
} from "@/lib/api/client";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        const resolvedParams = await params;

        if (cancelled) return;

        setTicketId(resolvedParams.ticketId);
        setError("");

        const data = await getTicket(resolvedParams.ticketId);

        if (!cancelled) {
          setTicket(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load ticket from the backend.",
          );
          setLoading(false);
        }
      }
    }

    void loadTicket();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function refreshTicket() {
    if (!ticketId) return;

    setError("");

    try {
      const data = await getTicket(ticketId);
      setTicket(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh ticket.",
      );
    }
  }

  async function executeAgent() {
    if (!ticket || running) return;

    if (ticket.status === "resolved") {
      const confirmed = window.confirm(
        `Ticket ${ticket.id} is already resolved. Do you want to run the AI Agent again?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await runAgent({
        request: ticket.title,
        ticket_id: ticket.id,
      });

      setResult(response);

      try {
        const updatedTicket = await getTicket(ticket.id);
        setTicket(updatedTicket);
      } catch {
        // Keep the agent result visible even if ticket refresh fails.
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The AI Agent could not process this ticket.",
      );
    } finally {
      setRunning(false);
    }
  }

  const statusLabel = ticket?.status
    ? ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)
    : "Unknown";

  const statusClass =
    ticket?.status === "resolved"
      ? "status-green"
      : ticket?.status === "verifying"
        ? "status-blue"
        : ticket?.status === "waiting"
          ? "status-yellow"
          : "status-red";

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#060708]">
        <div className="flex items-center gap-3 text-sm text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading ticket...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-full bg-[#060708] px-8 py-10">
        <Link
          href="/tickets"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>

        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-[#0b0d0f] p-10 text-center">
          <XCircle className="mx-auto mb-4 h-8 w-8 text-red-400" />

          <h1 className="text-xl font-medium text-white">
            Ticket unavailable
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {error || "The requested ticket could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#060708] px-6 py-7 text-white lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7">
          <Link
            href="/tickets"
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-white/40 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Ticket Center
          </Link>

          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="font-mono text-xs text-white/35">
                  {ticket.id}
                </span>

                <span className={`status-pill ${statusClass}`}>
                  <span className="status-dot" />
                  {statusLabel}
                </span>
              </div>

              <h1 className="max-w-4xl text-2xl font-medium tracking-[-0.03em] text-white md:text-3xl">
                {ticket.title}
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Autonomous IT Helpdesk ticket · AI-assisted operations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshTicket()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-medium text-white/60 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => void executeAgent()}
                disabled={running}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Agent Running
                  </>
                ) : ticket.status === "resolved" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-run AI Agent
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Run AI Agent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] md:grid-cols-4">
          <MetadataItem
            icon={FileText}
            label="Category"
            value={ticket.category}
          />

          <MetadataItem
            icon={UserRound}
            label="Assignee"
            value={ticket.assignee}
          />

          <MetadataItem
            icon={Activity}
            label="Status"
            value={statusLabel}
          />

          <MetadataItem
            icon={Clock3}
            label="Last Updated"
            value={formatLiveTimestamp(ticket.updated, now)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035]">
                    <Bot className="h-4 w-4 text-white/75" />
                  </div>

                  <div>
                    <h2 className="text-sm font-medium text-white">
                      Autonomous Execution
                    </h2>

                    <p className="text-[11px] text-white/35">
                      Controlled agent workflow
                    </p>
                  </div>
                </div>

                {result && (
                  <span
                    className={`status-pill ${
                      result.status === "resolved"
                        ? "status-green"
                        : "status-yellow"
                    }`}
                  >
                    <span className="status-dot" />

                    {result.status === "resolved"
                      ? "Verified Resolution"
                      : "Escalated"}
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="mb-6 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                    <Search className="h-3 w-3" />
                    Incoming Request
                  </div>

                  <p className="text-sm leading-6 text-white/75">
                    {ticket.title}
                  </p>
                </div>

                {!result && !running ? (
                  <EmptyAgentState onRun={() => void executeAgent()} />
                ) : (
                  <ExecutionTimeline
                    result={result}
                    running={running}
                  />
                )}
              </div>
            </section>

            {result && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={Bot}
                  title="Agent Response"
                  subtitle="Reasoning and execution outcome"
                />

                <div className="p-5">
                  <div
                    className={`rounded-xl border p-4 ${
                      result.status === "resolved"
                        ? "border-emerald-400/15 bg-emerald-400/[0.035]"
                        : "border-amber-400/15 bg-amber-400/[0.035]"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      {result.status === "resolved" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-amber-400" />
                      )}

                      <span className="text-xs font-semibold text-white">
                        {result.status === "resolved"
                          ? "Issue resolved and verified"
                          : "Human intervention required"}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-white/60">
                      {result.message}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {result && result.retrieved_knowledge.length > 0 && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={Search}
                  title="Knowledge Retrieval"
                  subtitle={`${result.retrieved_knowledge.length} relevant knowledge sources`}
                />

                <div className="divide-y divide-white/[0.05]">
                  {result.retrieved_knowledge.map((item) => (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-mono text-[10px] text-white/30">
                              {item.id}
                            </span>

                            <span className="text-[10px] text-white/25">
                              {item.category}
                            </span>
                          </div>

                          <h3 className="text-sm font-medium text-white/80">
                            {item.title}
                          </h3>

                          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/35">
                            {item.content}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="font-mono text-xs text-white/60">
                            {(item.relevance * 100).toFixed(0)}%
                          </div>

                          <div className="mt-1 text-[9px] uppercase tracking-wider text-white/25">
                            relevance
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {result?.understanding && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={Search}
                  title="Request Understanding"
                  subtitle="Intent and entity extraction"
                />

                <div className="space-y-3 p-5">
                  <InfoRow
                    label="Intent"
                    value={result.understanding.intent}
                    mono
                  />

                  <InfoRow
                    label="Category"
                    value={result.understanding.category}
                  />

                  <InfoRow
                    label="Priority"
                    value={result.understanding.priority}
                  />

                  <InfoRow
                    label="Confidence"
                    value={`${(result.understanding.confidence * 100).toFixed(0)}%`}
                  />

                  {Object.entries(result.understanding.entities).length > 0 && (
                    <div className="pt-2">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-white/25">
                        Entities
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(result.understanding.entities).map(
                          ([key, value]) => (
                            <span
                              key={key}
                              className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-white/50"
                            >
                              {key}: {value}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {result?.it_state && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={Zap}
                  title="IT World State"
                  subtitle="Observed environment"
                />

                <div className="space-y-2 p-5">
                  {Object.entries(result.it_state)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => (
                      <InfoRow
                        key={key}
                        label={formatKey(key)}
                        value={String(value)}
                      />
                    ))}
                </div>
              </section>
            )}

            {result?.plan && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={Activity}
                  title="Agent Plan"
                  subtitle="Selected action"
                />

                <div className="space-y-4 p-5">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-white/25">
                      Action
                    </div>

                    <div className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 font-mono text-xs text-white/70">
                      {result.plan.action}
                    </div>
                  </div>

                  <InfoRow
                    label="Target"
                    value={result.plan.target}
                  />

                  <InfoRow
                    label="Risk"
                    value={result.plan.risk}
                  />

                  <InfoRow
                    label="Confidence"
                    value={`${(result.plan.confidence * 100).toFixed(0)}%`}
                  />

                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-white/25">
                      Rationale
                    </div>

                    <p className="text-xs leading-5 text-white/40">
                      {result.plan.rationale}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {result?.policy && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={ShieldCheck}
                  title="Policy Decision"
                  subtitle="Governance checkpoint"
                />

                <div className="p-5">
                  <div
                    className={`rounded-xl border p-4 ${
                      result.policy.decision === "allowed"
                        ? "border-emerald-400/15 bg-emerald-400/[0.035]"
                        : result.policy.decision === "approval_required"
                          ? "border-amber-400/15 bg-amber-400/[0.035]"
                          : "border-red-400/15 bg-red-400/[0.035]"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-white/30">
                        {result.policy.policy_id}
                      </span>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          result.policy.decision === "allowed"
                            ? "text-emerald-400"
                            : result.policy.decision === "approval_required"
                              ? "text-amber-400"
                              : "text-red-400"
                        }`}
                      >
                        {result.policy.decision.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mb-2 font-mono text-xs text-white/65">
                      {result.policy.action}
                    </div>

                    <p className="text-xs leading-5 text-white/40">
                      {result.policy.reason}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px]">
                      <span className="text-white/25">Risk</span>

                      <span className="text-white/50">
                        {result.policy.risk}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-white/25">
                        Authorization
                      </span>

                      <span className="text-white/50">
                        {result.policy.authorization_required
                          ? "Required"
                          : "Not required"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {result?.tool && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={Terminal}
                  title="Controlled Tool"
                  subtitle="Gateway execution"
                />

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-white/65">
                      {result.tool.tool}
                    </span>

                    {result.tool.success ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-red-400">
                        <XCircle className="h-3.5 w-3.5" />
                        Failed
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-5 text-white/40">
                    {result.tool.message}
                  </p>

                  {Object.keys(result.tool.state_changes).length > 0 && (
                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-white/25">
                        State Changes
                      </div>

                      <div className="space-y-1.5">
                        {Object.entries(result.tool.state_changes).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="font-mono text-[10px] text-white/30">
                                {key}
                              </span>

                              <span className="font-mono text-[10px] text-white/55">
                                {value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {result?.verification && (
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c0e]">
                <SectionHeader
                  icon={
                    result.verification.verified
                      ? CheckCircle2
                      : XCircle
                  }
                  title="Verification"
                  subtitle="Expected vs observed state"
                />

                <div className="p-5">
                  <div
                    className={`mb-4 rounded-xl border p-4 ${
                      result.verification.verified
                        ? "border-emerald-400/15 bg-emerald-400/[0.035]"
                        : "border-red-400/15 bg-red-400/[0.035]"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {result.verification.verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}

                      <span className="text-xs font-medium text-white">
                        {result.verification.status === "verified"
                          ? "State verified"
                          : "Verification failed"}
                      </span>
                    </div>

                    <p className="text-xs leading-5 text-white/40">
                      {result.verification.message}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <StateComparison
                      label="Expected"
                      values={result.verification.expected_state}
                    />

                    <StateComparison
                      label="Observed"
                      values={result.verification.observed_state}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.06] py-6">
          <div className="flex flex-col justify-between gap-2 text-[10px] text-white/20 md:flex-row">
            <span>
              Autonomous IT Helpdesk · Controlled execution environment
            </span>

            <span className="font-mono">
              {ticket.id} · AI OPERATIONS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0b0d0f] px-4 py-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/25">
        <Icon className="h-3 w-3" />
        {label}
      </div>

      <div className="truncate text-xs font-medium text-white/65">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Bot;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.025]">
        <Icon className="h-3.5 w-3.5 text-white/55" />
      </div>

      <div>
        <h2 className="text-xs font-medium text-white/80">
          {title}
        </h2>

        <p className="text-[10px] text-white/30">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.045] pb-2 last:border-0 last:pb-0">
      <span className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </span>

      <span
        className={`max-w-[65%] truncate text-right text-xs text-white/55 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyAgentState({ onRun }: { onRun: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
        <Bot className="h-5 w-5 text-white/40" />
      </div>

      <h3 className="text-sm font-medium text-white/70">
        Ready for autonomous execution
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/30">
        The controlled AI agent will understand the request, retrieve
        knowledge, inspect IT state, evaluate policy, execute approved
        tools, and verify the result.
      </p>

      <button
        type="button"
        onClick={onRun}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90"
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        Start Agent
      </button>
    </div>
  );
}

function ExecutionTimeline({
  result,
  running,
}: {
  result: AgentRunResponse | null;
  running: boolean;
}) {
  const stages = result?.stages ?? [
    {
      id: "understand",
      label: "Understanding",
      status: "running" as const,
      description: "Interpreting request and extracting intent",
    },
    {
      id: "retrieve",
      label: "Knowledge Retrieval",
      status: "pending" as const,
      description: "Searching relevant operational knowledge",
    },
    {
      id: "observe",
      label: "IT World State",
      status: "pending" as const,
      description: "Inspecting current environment state",
    },
    {
      id: "reason",
      label: "Reasoning & Planning",
      status: "pending" as const,
      description: "Constructing and evaluating candidate action",
    },
    {
      id: "policy",
      label: "Policy & Risk",
      status: "pending" as const,
      description: "Checking authorization and operational risk",
    },
    {
      id: "execute",
      label: "Controlled Execution",
      status: "pending" as const,
      description: "Calling an approved IT tool",
    },
    {
      id: "verify",
      label: "Verification",
      status: "pending" as const,
      description: "Comparing expected and observed state",
    },
  ];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
            Agent Pipeline
          </div>

          <div className="mt-1 text-xs text-white/40">
            {running
              ? "Autonomous workflow in progress"
              : "Execution completed"}
          </div>
        </div>

        {running && (
          <Loader2 className="h-4 w-4 animate-spin text-white/40" />
        )}
      </div>

      <div className="space-y-1">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="relative flex gap-4 rounded-lg px-2 py-3 transition hover:bg-white/[0.02]"
          >
            {index < stages.length - 1 && (
              <div className="absolute left-[17px] top-[34px] h-[calc(100%-4px)] w-px bg-white/[0.07]" />
            )}

            <StageIcon status={stage.status} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`text-xs font-medium ${
                    stage.status === "running"
                      ? "text-white"
                      : stage.status === "completed"
                        ? "text-white/65"
                        : stage.status === "blocked"
                          ? "text-red-400"
                          : "text-white/30"
                  }`}
                >
                  {stage.label}
                </span>

                {stage.duration && (
                  <span className="font-mono text-[9px] text-white/25">
                    {stage.duration}
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-[10px] leading-4 text-white/25">
                {stage.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageIcon({
  status,
}: {
  status: "completed" | "running" | "pending" | "blocked";
}) {
  if (status === "completed") {
    return (
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-[#0a0c0e]">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0a0c0e]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-white/70" />
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-400/20 bg-[#0a0c0e]">
        <XCircle className="h-3.5 w-3.5 text-red-400" />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#0a0c0e]">
      <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
    </div>
  );
}

function StateComparison({
  label,
  values,
}: {
  label: string;
  values: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/15 p-3">
      <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
        {label}
      </div>

      <div className="space-y-1.5">
        {Object.entries(values).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3"
          >
            <span className="font-mono text-[9px] text-white/25">
              {key}
            </span>

            <span className="font-mono text-[9px] text-white/50">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatKey(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatLiveTimestamp(value: string, now: number) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const difference = Math.max(
    0,
    Math.floor((now - timestamp) / 1000),
  );

  let relative = "";

  if (difference < 5) {
    relative = "just now";
  } else if (difference < 60) {
    relative = `${difference} sec ago`;
  } else if (difference < 3600) {
    const minutes = Math.floor(difference / 60);
    relative = `${minutes} min ago`;
  } else if (difference < 86400) {
    const hours = Math.floor(difference / 3600);
    relative = `${hours} hr ago`;
  } else {
    const days = Math.floor(difference / 86400);
    relative = `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const exact = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(timestamp));

  return `${exact} · ${relative}`;
}