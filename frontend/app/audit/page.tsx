"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileCheck2,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  TerminalSquare,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AgentRunResponse } from "@/lib/api/client";

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

type AuditType =
  | "request"
  | "decision"
  | "policy"
  | "tool"
  | "state"
  | "verification"
  | "outcome";

type AuditResult = "success" | "blocked" | "pending";

type AuditEvent = {
  id: string;
  time: string;
  timestamp: string;
  runId: string;
  ticketId: string;
  type: AuditType;
  title: string;
  description: string;
  actor: string;
  risk: "low" | "medium" | "high";
  result: AuditResult;
  metadata: {
    key: string;
    value: string;
  }[];
};

const demoEvents: AuditEvent[] = [
  {
    id: "AUD-9821",
    time: "14:32:08",
    timestamp: "08 Sep 2026 · 14:32:08",
    runId: "RUN-1284",
    ticketId: "INC-1042",
    type: "request",
    title: "Request received",
    description:
      "User reported that the VPN client was disconnected and requested connectivity assistance.",
    actor: "End user",
    risk: "low",
    result: "success",
    metadata: [
      { key: "Intent", value: "troubleshoot_vpn" },
      { key: "Category", value: "Network" },
      { key: "Confidence", value: "96%" },
    ],
  },
  {
    id: "AUD-9820",
    time: "14:32:09",
    timestamp: "08 Sep 2026 · 14:32:09",
    runId: "RUN-1284",
    ticketId: "INC-1042",
    type: "decision",
    title: "Agent plan selected",
    description:
      "The agent selected the controlled VPN restart workflow based on retrieved knowledge and observed state.",
    actor: "Autonomous agent",
    risk: "low",
    result: "success",
    metadata: [
      { key: "Action", value: "restart_vpn_client" },
      { key: "Target", value: "VPN Client" },
      { key: "Expected state", value: "connected" },
    ],
  },
  {
    id: "AUD-9819",
    time: "14:32:09",
    timestamp: "08 Sep 2026 · 14:32:09",
    runId: "RUN-1284",
    ticketId: "INC-1042",
    type: "policy",
    title: "Policy evaluation passed",
    description:
      "The requested action was evaluated against the applicable Level-1 automation policy and permitted.",
    actor: "Policy engine",
    risk: "low",
    result: "success",
    metadata: [
      { key: "Policy", value: "POL-002" },
      { key: "Decision", value: "allowed" },
      { key: "Authorization", value: "Not required" },
    ],
  },
  {
    id: "AUD-9818",
    time: "14:32:10",
    timestamp: "08 Sep 2026 · 14:32:10",
    runId: "RUN-1284",
    ticketId: "INC-1042",
    type: "tool",
    title: "Controlled tool executed",
    description:
      "The tool gateway executed the approved VPN restart operation and returned a successful result.",
    actor: "Tool gateway",
    risk: "medium",
    result: "success",
    metadata: [
      { key: "Tool", value: "restart_vpn_client" },
      { key: "Execution", value: "successful" },
      { key: "State change", value: "disconnected → connected" },
    ],
  },
  {
    id: "AUD-9817",
    time: "14:32:11",
    timestamp: "08 Sep 2026 · 14:32:11",
    runId: "RUN-1284",
    ticketId: "INC-1042",
    type: "verification",
    title: "Expected state verified",
    description:
      "The observed VPN state matched the expected post-execution state.",
    actor: "Verification engine",
    risk: "low",
    result: "success",
    metadata: [
      { key: "Expected", value: "connected" },
      { key: "Observed", value: "connected" },
      { key: "Verification", value: "verified" },
    ],
  },
  {
    id: "AUD-9816",
    time: "14:32:12",
    timestamp: "08 Sep 2026 · 14:32:12",
    runId: "RUN-1284",
    ticketId: "INC-1042",
    type: "outcome",
    title: "Incident resolved",
    description:
      "The workflow completed successfully after verification and the incident was marked resolved.",
    actor: "Autonomous agent",
    risk: "low",
    result: "success",
    metadata: [
      { key: "Status", value: "resolved" },
      { key: "Verification", value: "passed" },
      { key: "Run", value: "RUN-1284" },
    ],
  },
  {
    id: "AUD-9815",
    time: "14:28:41",
    timestamp: "08 Sep 2026 · 14:28:41",
    runId: "RUN-1283",
    ticketId: "INC-1041",
    type: "tool",
    title: "Password reset executed",
    description:
      "The approved password reset operation was executed through the controlled tool gateway.",
    actor: "Tool gateway",
    risk: "medium",
    result: "success",
    metadata: [
      { key: "Tool", value: "reset_password" },
      { key: "Policy", value: "POL-001" },
      { key: "Execution", value: "successful" },
    ],
  },
  {
    id: "AUD-9814",
    time: "14:27:58",
    timestamp: "08 Sep 2026 · 14:27:58",
    runId: "RUN-1282",
    ticketId: "INC-1040",
    type: "policy",
    title: "Policy evaluation passed",
    description:
      "Software installation was evaluated against the controlled Level-1 policy and permitted for the approved software request.",
    actor: "Policy engine",
    risk: "medium",
    result: "success",
    metadata: [
      { key: "Policy", value: "POL-003" },
      { key: "Decision", value: "allowed" },
      { key: "Tool", value: "install_software" },
    ],
  },
  {
    id: "AUD-9813",
    time: "14:27:14",
    timestamp: "08 Sep 2026 · 14:27:14",
    runId: "RUN-1281",
    ticketId: "INC-1039",
    type: "policy",
    title: "Action blocked",
    description:
      "A privileged access operation was blocked by policy and no unregistered permission-changing tool was executed.",
    actor: "Policy engine",
    risk: "high",
    result: "blocked",
    metadata: [
      { key: "Policy", value: "POL-004" },
      { key: "Decision", value: "blocked" },
      { key: "Tool", value: "grant_access" },
    ],
  },
  {
    id: "AUD-9812",
    time: "14:26:51",
    timestamp: "08 Sep 2026 · 14:26:51",
    runId: "RUN-1281",
    ticketId: "INC-1039",
    type: "outcome",
    title: "Escalation created",
    description:
      "The agent stopped execution and routed the request for human review after the policy boundary was reached.",
    actor: "Autonomous agent",
    risk: "high",
    result: "blocked",
    metadata: [
      { key: "Status", value: "escalated" },
      { key: "Reason", value: "Policy restriction" },
      { key: "Execution", value: "not performed" },
    ],
  },
];

const typeConfig: Record<
  AuditType,
  { label: string; icon: typeof Activity }
> = {
  request: { label: "Request", icon: UserRound },
  decision: { label: "Decision", icon: Activity },
  policy: { label: "Policy", icon: ShieldCheck },
  tool: { label: "Tool", icon: TerminalSquare },
  state: { label: "State", icon: Database },
  verification: { label: "Verification", icon: FileCheck2 },
  outcome: { label: "Outcome", icon: CheckCircle2 },
};

const resultConfig = {
  success: {
    label: "Success",
    icon: CheckCircle2,
  },
  blocked: {
    label: "Blocked",
    icon: XCircle,
  },
  pending: {
    label: "Pending",
    icon: Clock3,
  },
};

export default function AuditPage() {
  const [selectedId, setSelectedId] = useState(demoEvents[0].id);
  const [filter, setFilter] = useState<"all" | AuditType>("all");
  const [search, setSearch] = useState("");
  const [latestRun, setLatestRun] =
    useState<AgentRunResponse | null>(null);

  const loadLatestRun = () => {
    try {
      const stored =
        window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setLatestRun(null);
        return;
      }

      setLatestRun(
        JSON.parse(stored) as AgentRunResponse,
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

    const frame = window.requestAnimationFrame(() => {
      loadLatestRun();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(
        AGENT_RUN_EVENT,
        handleAgentRun,
      );
    };
  }, []);

  const liveEvents = useMemo(
    () =>
      latestRun
        ? buildLiveAuditEvents(latestRun)
        : [],
    [latestRun],
  );

  const events = useMemo(() => {
    if (!latestRun || liveEvents.length === 0) {
      return demoEvents;
    }

    return [
      ...liveEvents,
      ...demoEvents.filter(
        (event) =>
          event.ticketId !== latestRun.ticket_id,
      ),
    ];
  }, [latestRun, liveEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        filter === "all" ||
        event.type === filter;

      const query = search
        .toLowerCase()
        .trim();

      if (!query) {
        return matchesFilter;
      }

      const matchesSearch =
        event.id
          .toLowerCase()
          .includes(query) ||
        event.runId
          .toLowerCase()
          .includes(query) ||
        event.ticketId
          .toLowerCase()
          .includes(query) ||
        event.title
          .toLowerCase()
          .includes(query) ||
        event.description
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search]);

  const selectedEvent =
    events.find(
      (event) => event.id === selectedId,
    ) ??
    filteredEvents[0] ??
    events[0];

  const successful = events.filter(
    (event) => event.result === "success",
  ).length;

  const blocked = events.filter(
    (event) => event.result === "blocked",
  ).length;

  const pending = events.filter(
    (event) => event.result === "pending",
  ).length;

  if (!selectedEvent) {
    return null;
  }

  return (
    <div className="min-h-full bg-[#060708]">
      <div className="mx-auto max-w-[1800px] px-6 py-7 lg:px-8">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              <span>Governance</span>
              <ChevronRight className="h-3 w-3" />
              <span>Audit trail</span>

              {latestRun && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-emerald-300/60">
                    Live
                  </span>
                </>
              )}
            </div>

            <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-white">
              Audit
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/45">
              A complete execution trail for autonomous
              decisions, policy checks, tool actions, state
              changes and verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-white/55">
              <LockKeyhole className="h-3.5 w-3.5 text-white/35" />
              <span>Audit logging active</span>
            </div>

            <div className="flex h-9 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 text-xs text-emerald-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                {latestRun
                  ? "Live stream"
                  : "Prototype stream"}
              </span>
            </div>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric
            label="Events"
            value={String(events.length)}
            detail="Recorded execution events"
            icon={Activity}
          />

          <Metric
            label="Successful"
            value={String(successful)}
            detail="Completed without exception"
            icon={CheckCircle2}
          />

          <Metric
            label="Policy blocks"
            value={String(blocked)}
            detail="Actions stopped before execution"
            icon={ShieldCheck}
          />

          <Metric
            label="Pending review"
            value={String(pending)}
            detail="Awaiting human authorization"
            icon={Clock3}
          />
        </section>

        <section className="mb-4 rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-[520px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search audit events, tickets or runs..."
                className="h-10 w-full rounded-lg border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-white/[0.14]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="mr-1 flex items-center gap-1.5 text-xs text-white/30">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </div>

              {[
                ["all", "All"],
                ["request", "Requests"],
                ["decision", "Decisions"],
                ["policy", "Policy"],
                ["tool", "Tools"],
                ["state", "State"],
                ["verification", "Verification"],
                ["outcome", "Outcomes"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFilter(
                      value as "all" | AuditType,
                    )
                  }
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition ${
                    filter === value
                      ? "bg-white/[0.09] text-white"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-h-[680px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Execution trail
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  {filteredEvents.length} events matching
                  current view
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/25">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {latestRun ? "Streaming" : "Prototype"}
              </div>
            </div>

            <div className="divide-y divide-white/[0.045]">
              {filteredEvents.map((event) => {
                const config = typeConfig[event.type];
                const Icon = config.icon;
                const ResultIcon =
                  resultConfig[event.result].icon;
                const selected =
                  event.id === selectedId;

                const isLive =
                  latestRun !== null &&
                  event.ticketId ===
                    latestRun.ticket_id;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(event.id)
                    }
                    className={`group flex w-full items-start gap-4 px-5 py-4 text-left transition ${
                      selected
                        ? "bg-white/[0.045]"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        selected
                          ? "border-white/[0.12] bg-white/[0.07]"
                          : "border-white/[0.06] bg-white/[0.025]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 text-white/55" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white/90">
                          {event.title}
                        </span>

                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/35">
                          {config.label}
                        </span>

                        {isLive && (
                          <span className="rounded bg-emerald-400/[0.07] px-1.5 py-0.5 text-[10px] text-emerald-300/70">
                            LIVE
                          </span>
                        )}

                        {event.risk === "high" && (
                          <span className="rounded bg-red-400/[0.08] px-1.5 py-0.5 text-[10px] text-red-300/75">
                            High risk
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-white/35">
                        {event.description}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/25">
                        <span className="font-mono">
                          {event.id}
                        </span>

                        <span>{event.runId}</span>

                        <span>{event.ticketId}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-mono text-[10px] text-white/25">
                        {event.time}
                      </span>

                      <ResultIcon
                        className={`h-3.5 w-3.5 ${
                          event.result === "success"
                            ? "text-emerald-400/75"
                            : event.result === "blocked"
                              ? "text-red-400/75"
                              : "text-amber-300/75"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredEvents.length === 0 && (
              <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
                <div>
                  <Search className="mx-auto mb-3 h-5 w-5 text-white/20" />

                  <p className="text-sm text-white/50">
                    No audit events found
                  </p>

                  <p className="mt-1 text-xs text-white/25">
                    Try another search or filter.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/30">
                      {selectedEvent.id}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-white/20" />

                    <span className="text-[10px] text-white/30">
                      {selectedEvent.timestamp}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-white">
                    {selectedEvent.title}
                  </h2>
                </div>

                <div
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] ${
                    selectedEvent.result === "success"
                      ? "bg-emerald-400/[0.07] text-emerald-300/80"
                      : selectedEvent.result === "blocked"
                        ? "bg-red-400/[0.07] text-red-300/80"
                        : "bg-amber-400/[0.07] text-amber-300/80"
                  }`}
                >
                  {(() => {
                    const ResultIcon =
                      resultConfig[
                        selectedEvent.result
                      ].icon;

                    return (
                      <ResultIcon className="h-3 w-3" />
                    );
                  })()}

                  {
                    resultConfig[
                      selectedEvent.result
                    ].label
                  }
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/25">
                  Event description
                </div>

                <p className="text-sm leading-6 text-white/55">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Detail
                  label="Run ID"
                  value={selectedEvent.runId}
                  mono
                />

                <Detail
                  label="Ticket"
                  value={selectedEvent.ticketId}
                  mono
                />

                <Detail
                  label="Actor"
                  value={selectedEvent.actor}
                />

                <Detail
                  label="Risk level"
                  value={selectedEvent.risk}
                />
              </div>

              <div>
                <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/25">
                  Event metadata
                </div>

                <div className="divide-y divide-white/[0.05] rounded-lg border border-white/[0.06] bg-white/[0.015]">
                  {selectedEvent.metadata.map(
                    (item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-5 px-3.5 py-3"
                      >
                        <span className="text-xs text-white/30">
                          {item.key}
                        </span>

                        <span className="max-w-[60%] text-right font-mono text-[11px] text-white/65">
                          {item.value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/25">
                  Governance chain
                </div>

                <div className="space-y-0">
                  <ChainItem
                    icon={UserRound}
                    label="Request"
                    value={selectedEvent.ticketId}
                    status="complete"
                  />

                  <ChainConnector />

                  <ChainItem
                    icon={Activity}
                    label="Agent decision"
                    value={selectedEvent.runId}
                    status="complete"
                  />

                  <ChainConnector />

                  <ChainItem
                    icon={ShieldCheck}
                    label="Policy"
                    value={
                      selectedEvent.type ===
                        "policy" &&
                      selectedEvent.result ===
                        "blocked"
                        ? "Blocked"
                        : "Evaluated"
                    }
                    status={
                      selectedEvent.result ===
                      "blocked"
                        ? "blocked"
                        : "complete"
                    }
                  />

                  <ChainConnector />

                  <ChainItem
                    icon={TerminalSquare}
                    label="Controlled execution"
                    value={
                      selectedEvent.result ===
                        "blocked"
                        ? "Not executed"
                        : "Recorded"
                    }
                    status={
                      selectedEvent.result ===
                      "blocked"
                        ? "blocked"
                        : "complete"
                    }
                  />

                  <ChainConnector />

                  <ChainItem
                    icon={FileCheck2}
                    label="Verification"
                    value={
                      selectedEvent.result ===
                      "success"
                        ? "Verified"
                        : "Pending / skipped"
                    }
                    status={
                      selectedEvent.result ===
                      "success"
                        ? "complete"
                        : "pending"
                    }
                  />
                </div>
              </div>

              {latestRun &&
                selectedEvent.ticketId ===
                  latestRun.ticket_id && (
                  <LiveAuditContext
                    result={latestRun}
                  />
                )}

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />

                  <div>
                    <p className="text-xs font-medium text-white/60">
                      Immutable audit principle
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-white/30">
                      Autonomous actions must remain
                      attributable, policy-evaluable and
                      independently verifiable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Summary
            icon={ArrowDownRight}
            label="Blocked before execution"
            value={String(blocked)}
            detail="No prohibited autonomous action was performed."
          />

          <Summary
            icon={ArrowUpRight}
            label="Verified outcomes"
            value={String(
              events.filter(
                (event) =>
                  event.type ===
                    "verification" &&
                  event.result === "success",
              ).length,
            )}
            detail="Successful verification events recorded."
          />

          <Summary
            icon={FileCheck2}
            label="Traceability"
            value="100%"
            detail={
              latestRun
                ? "Latest agent run is represented in the audit stream."
                : "Displayed prototype runs have associated audit events."
            }
          />
        </section>

        <footer className="mt-7 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-white/20 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Autonomous IT Operations · Audit Center
          </span>

          <span>
            {latestRun
              ? "Live agent execution telemetry"
              : "Prototype audit telemetry · Designed for controlled agent execution"}
          </span>
        </footer>
      </div>
    </div>
  );
}

function buildLiveAuditEvents(
  result: AgentRunResponse,
): AuditEvent[] {
  const confidence = result.understanding
    ? `${Math.round(
        result.understanding.confidence * 100,
      )}%`
    : "—";

  const events: AuditEvent[] = [];

  events.push({
    id: `AUD-LIVE-${result.ticket_id}-01`,
    time: "live",
    timestamp: "Latest agent execution",
    runId: `RUN-${result.ticket_id}`,
    ticketId: result.ticket_id,
    type: "request",
    title: "Request received",
    description:
      "User request entered the autonomous helpdesk workflow.",
    actor: "End user",
    risk: "low",
    result: "success",
    metadata: [
      {
        key: "Intent",
        value:
          result.understanding?.intent ??
          "unknown",
      },
      {
        key: "Category",
        value:
          result.understanding?.category ??
          "unknown",
      },
      {
        key: "Confidence",
        value: confidence,
      },
    ],
  });

  if (result.plan) {
    events.push({
      id: `AUD-LIVE-${result.ticket_id}-02`,
      time: "live",
      timestamp: "Latest agent execution",
      runId: `RUN-${result.ticket_id}`,
      ticketId: result.ticket_id,
      type: "decision",
      title: "Agent plan selected",
      description:
        result.plan.rationale,
      actor: "Autonomous agent",
      risk:
        normalizeRisk(result.plan.risk),
      result: "success",
      metadata: [
        {
          key: "Action",
          value: result.plan.action,
        },
        {
          key: "Target",
          value: result.plan.target,
        },
        {
          key: "Confidence",
          value: `${Math.round(
            result.plan.confidence * 100,
          )}%`,
        },
      ],
    });
  }

  if (result.policy) {
    const policyBlocked =
      result.policy.decision === "blocked";

    events.push({
      id: `AUD-LIVE-${result.ticket_id}-03`,
      time: "live",
      timestamp: "Latest agent execution",
      runId: `RUN-${result.ticket_id}`,
      ticketId: result.ticket_id,
      type: "policy",
      title: policyBlocked
        ? "Policy blocked action"
        : "Policy evaluation passed",
      description:
        result.policy.reason,
      actor: "Policy engine",
      risk:
        normalizeRisk(result.policy.risk),
      result: policyBlocked
        ? "blocked"
        : "success",
      metadata: [
        {
          key: "Policy",
          value: result.policy.policy_id,
        },
        {
          key: "Decision",
          value: result.policy.decision,
        },
        {
          key: "Authorization",
          value:
            result.policy.authorization_required
              ? "Required"
              : "Not required",
        },
      ],
    });
  }

  if (result.tool) {
    events.push({
      id: `AUD-LIVE-${result.ticket_id}-04`,
      time: "live",
      timestamp: "Latest agent execution",
      runId: `RUN-${result.ticket_id}`,
      ticketId: result.ticket_id,
      type: "tool",
      title: result.tool.success
        ? "Controlled tool executed"
        : "Controlled tool failed",
      description:
        result.tool.message,
      actor: "Tool gateway",
      risk: "medium",
      result: result.tool.success
        ? "success"
        : "blocked",
      metadata: [
        {
          key: "Tool",
          value: result.tool.tool,
        },
        {
          key: "Execution",
          value: result.tool.success
            ? "successful"
            : "failed",
        },
        {
          key: "State changes",
          value:
            Object.entries(
              result.tool.state_changes,
            )
              .map(
                ([key, value]) =>
                  `${key} → ${value}`,
              )
              .join(", ") || "none",
        },
      ],
    });
  }

  if (result.verification) {
    events.push({
      id: `AUD-LIVE-${result.ticket_id}-05`,
      time: "live",
      timestamp: "Latest agent execution",
      runId: `RUN-${result.ticket_id}`,
      ticketId: result.ticket_id,
      type: "verification",
      title: result.verification.verified
        ? "Expected state verified"
        : "Verification failed",
      description:
        result.verification.message,
      actor: "Verification engine",
      risk: result.verification.verified
        ? "low"
        : "medium",
      result: result.verification.verified
        ? "success"
        : "blocked",
      metadata: [
        {
          key: "Expected",
          value: formatState(
            result.verification
              .expected_state,
          ),
        },
        {
          key: "Observed",
          value: formatState(
            result.verification
              .observed_state,
          ),
        },
        {
          key: "Verification",
          value: result.verification
            .status,
        },
      ],
    });
  }

  events.push({
    id: `AUD-LIVE-${result.ticket_id}-06`,
    time: "live",
    timestamp: "Latest agent execution",
    runId: `RUN-${result.ticket_id}`,
    ticketId: result.ticket_id,
    type: "outcome",
    title:
      result.status === "resolved"
        ? "Incident resolved"
        : result.status === "escalated"
          ? "Escalation created"
          : "Execution completed",
    description:
      result.message,
    actor: "Autonomous agent",
    risk:
      result.policy?.risk
        ? normalizeRisk(result.policy.risk)
        : "low",
    result:
      result.status === "escalated"
        ? "blocked"
        : result.status === "resolved"
          ? "success"
          : "pending",
    metadata: [
      {
        key: "Status",
        value: result.status,
      },
      {
        key: "Tool",
        value:
          result.tool?.tool ??
          "not executed",
      },
      {
        key: "Verification",
        value:
          result.verification
            ?.status ?? "pending",
      },
    ],
  });

  return events.reverse();
}

function normalizeRisk(
  value: string,
): "low" | "medium" | "high" {
  const normalized =
    value.toLowerCase();

  if (normalized.includes("high")) {
    return "high";
  }

  if (normalized.includes("medium")) {
    return "medium";
  }

  return "low";
}

function formatState(
  state: Record<string, string>,
): string {
  const entries = Object.entries(state);

  if (entries.length === 0) {
    return "none";
  }

  return entries
    .map(
      ([key, value]) =>
        `${key}=${value}`,
    )
    .join(", ");
}

function LiveAuditContext({
  result,
}: {
  result: AgentRunResponse;
}) {
  return (
    <div className="rounded-lg border border-emerald-400/[0.08] bg-emerald-400/[0.018] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-300/60">
          Live agent context
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LiveContextItem
          label="Intent"
          value={
            result.understanding
              ?.intent ?? "—"
          }
        />

        <LiveContextItem
          label="Knowledge"
          value={`${result.retrieved_knowledge.length} sources`}
        />

        <LiveContextItem
          label="Policy"
          value={
            result.policy
              ? `${result.policy.policy_id} · ${result.policy.decision}`
              : "—"
          }
        />

        <LiveContextItem
          label="Tool"
          value={
            result.tool?.tool ??
            "Not executed"
          }
        />
      </div>
    </div>
  );
}

function LiveContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/[0.05] bg-black/10 p-2.5">
      <p className="text-[8px] uppercase tracking-[0.08em] text-white/25">
        {label}
      </p>

      <p className="mt-1 truncate font-mono text-[9px] text-white/60">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0a0c0e] p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-white/30">
          {label}
        </span>

        <Icon className="h-4 w-4 text-white/25" />
      </div>

      <div className="text-2xl font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>

      <p className="mt-1 text-[11px] text-white/25">
        {detail}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-white/25">
        {label}
      </div>

      <div
        className={`mt-1.5 truncate text-xs text-white/60 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ChainItem({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  status:
    | "complete"
    | "blocked"
    | "pending";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
          status === "complete"
            ? "border-emerald-400/10 bg-emerald-400/[0.04]"
            : status === "blocked"
              ? "border-red-400/10 bg-red-400/[0.04]"
              : "border-amber-400/10 bg-amber-400/[0.04]"
        }`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${
            status === "complete"
              ? "text-emerald-300/65"
              : status === "blocked"
                ? "text-red-300/65"
                : "text-amber-300/65"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs text-white/55">
          {label}
        </div>

        <div className="truncate font-mono text-[10px] text-white/25">
          {value}
        </div>
      </div>

      <div
        className={`h-1.5 w-1.5 rounded-full ${
          status === "complete"
            ? "bg-emerald-400/70"
            : status === "blocked"
              ? "bg-red-400/70"
              : "bg-amber-300/70"
        }`}
      />
    </div>
  );
}

function ChainConnector() {
  return (
    <div className="ml-[13px] h-3.5 border-l border-dashed border-white/[0.08]" />
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0a0c0e] px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
        <Icon className="h-4 w-4 text-white/35" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/70">
            {label}
          </span>

          <span className="font-mono text-xs text-white/35">
            {value}
          </span>
        </div>

        <p className="mt-0.5 truncate text-[10px] text-white/25">
          {detail}
        </p>
      </div>
    </div>
  );
}