"use client";

import Link from "next/link";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getTickets, type Ticket } from "@/lib/api/client";

const statusConfig: Record<
  string,
  {
    label: string;
    description: string;
    className: string;
    dotClass: string;
    icon: typeof AlertCircle;
  }
> = {
  open: {
    label: "Open",
    description: "Awaiting agent action",
    className: "bg-amber-400/[0.07] text-amber-300/80",
    dotClass: "bg-amber-400",
    icon: AlertCircle,
  },
  verifying: {
    label: "Verifying",
    description: "Checking expected state",
    className: "bg-blue-400/[0.07] text-blue-300/80",
    dotClass: "bg-blue-400",
    icon: Loader2,
  },
  waiting: {
    label: "Waiting",
    description: "Human action required",
    className: "bg-purple-400/[0.07] text-purple-300/80",
    dotClass: "bg-purple-400",
    icon: Clock3,
  },
  resolved: {
    label: "Resolved",
    description: "Resolution verified",
    className: "bg-emerald-400/[0.07] text-emerald-300/80",
    dotClass: "bg-emerald-400",
    icon: CheckCircle2,
  },
  escalated: {
    label: "Escalated",
    description: "Human intervention required",
    className: "bg-red-400/[0.07] text-red-300/80",
    dotClass: "bg-red-400",
    icon: ShieldAlert,
  },
};

const fallbackStatusConfig = {
  label: "Unknown",
  description: "Status requires review",
  className: "bg-white/[0.07] text-white/50",
  dotClass: "bg-white/40",
  icon: AlertCircle,
};

const filterOptions: Array<{
  value: "all" | Ticket["status"];
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "verifying", label: "Verifying" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Ticket["status"]
  >("all");

  async function loadTickets(refresh = false) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tickets from the backend.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setError("");

      try {
        const data = await getTickets();

        if (!cancelled) {
          setTickets(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load tickets from the backend.",
          );
          setLoading(false);
        }
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      if (!query) {
        return matchesStatus;
      }

      const matchesSearch =
        ticket.id.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query) ||
        ticket.assignee.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      verifying: tickets.filter(
        (ticket) => ticket.status === "verifying",
      ).length,
      waiting: tickets.filter(
        (ticket) => ticket.status === "waiting",
      ).length,
      resolved: tickets.filter(
        (ticket) => ticket.status === "resolved",
      ).length,
    }),
    [tickets],
  );

  const aiHandled = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.assignee.toLowerCase().includes("ai") ||
          ticket.assignee.toLowerCase().includes("agent"),
      ).length,
    [tickets],
  );

  const humanHandled = tickets.length - aiHandled;

  const automationRate =
    tickets.length > 0 ? Math.round((aiHandled / tickets.length) * 100) : 0;

  return (
    <div className="min-h-full bg-[#060708]">
      <div className="mx-auto max-w-[1800px] px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
        <header className="mb-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">
                <span>Operations</span>
                <ChevronRight className="h-3 w-3 text-white/15" />
                <span>Ticket Center</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
                  <FileText className="h-[17px] w-[17px] text-white/65" />
                </div>

                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[30px]">
                    Ticket Center
                  </h1>

                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-white/30">
                      Autonomous IT operations queue
                    </span>

                    <span className="h-1 w-1 rounded-full bg-white/15" />

                    <span className="font-mono text-[10px] text-white/25">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">
                Monitor incidents, autonomous remediation, verification and
                human escalation from a single operational queue.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.035] px-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[11px] font-medium text-emerald-300/75">
                  API connected
                </span>
              </div>

              <button
                type="button"
                onClick={() => void loadTickets(true)}
                disabled={loading || refreshing}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-white/45 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-4 xl:grid-cols-6">
          <Metric
            label="Total"
            value={counts.all}
            detail="Live queue"
            icon={FileText}
          />

          <Metric
            label="Active"
            value={counts.open}
            detail="Awaiting action"
            icon={Workflow}
          />

          <Metric
            label="Verifying"
            value={counts.verifying}
            detail="State validation"
            icon={Loader2}
            spin={counts.verifying > 0}
          />

          <Metric
            label="Human"
            value={counts.waiting}
            detail="Escalated"
            icon={UserRound}
          />

          <Metric
            label="Resolved"
            value={counts.resolved}
            detail="Verified outcome"
            icon={CheckCircle2}
          />

          <Metric
            label="AI handled"
            value={`${automationRate}%`}
            detail={`${aiHandled} of ${tickets.length} tickets`}
            icon={Bot}
          />
        </section>

        <section className="mb-4 rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-[560px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ticket ID, title, category or assignee..."
                aria-label="Search tickets"
                className="h-10 w-full rounded-lg border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-white/[0.14] focus:bg-white/[0.035]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              <div className="mr-2 flex shrink-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/25">
                <Filter className="h-3.5 w-3.5" />
                Status
              </div>

              {filterOptions.map((option) => {
                const active = statusFilter === option.value;
                const count =
                  option.value === "all"
                    ? counts.all
                    : counts[option.value];

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition ${
                      active
                        ? "bg-white/[0.09] text-white"
                        : "text-white/35 hover:bg-white/[0.04] hover:text-white/65"
                    }`}
                  >
                    {option.label}

                    <span
                      className={`font-mono text-[9px] ${
                        active ? "text-white/45" : "text-white/20"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {error && (
          <section className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/10 bg-red-400/[0.025] px-4 py-3.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300/60" />

            <div className="min-w-0">
              <p className="text-xs font-medium text-red-200/70">
                Ticket API unavailable
              </p>

              <p className="mt-1 text-[11px] leading-5 text-red-200/40">
                {error}
              </p>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    Incident queue
                  </h2>

                  <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[9px] text-white/30">
                    {filteredTickets.length}
                  </span>
                </div>

                <p className="mt-1 text-xs text-white/25">
                  Live records from the FastAPI ticket service.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-white/20">
                <span className="hidden sm:inline">
                  AI handled:{" "}
                  <span className="font-mono text-white/35">
                    {aiHandled}
                  </span>
                </span>

                <span className="hidden h-3 w-px bg-white/[0.07] sm:block" />

                <span className="hidden sm:inline">
                  Human:{" "}
                  <span className="font-mono text-white/35">
                    {humanHandled}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(search.trim()) || statusFilter !== "all"}
            />
          ) : (
            <>
              <div className="hidden border-b border-white/[0.05] bg-white/[0.012] px-5 py-2.5 lg:grid lg:grid-cols-[minmax(320px,1fr)_150px_180px_125px_34px] lg:items-center lg:gap-4">
                <QueueHeader label="Ticket" />
                <QueueHeader label="Category" />
                <QueueHeader label="Owner" />
                <QueueHeader label="Updated" />
                <span />
              </div>

              <div className="divide-y divide-white/[0.045]">
                {filteredTickets.map((ticket) => {
                  const config =
                    statusConfig[ticket.status] ?? fallbackStatusConfig;

                  const StatusIcon = config.icon;

                  const isAI =
                    ticket.assignee.toLowerCase().includes("ai") ||
                    ticket.assignee.toLowerCase().includes("agent");

                  return (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="group block transition hover:bg-white/[0.025] focus:outline-none focus-visible:bg-white/[0.035]"
                    >
                      <div className="flex flex-col gap-4 px-5 py-4 lg:grid lg:grid-cols-[minmax(320px,1fr)_150px_180px_125px_34px] lg:items-center lg:gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] ${config.className}`}
                          >
                            <StatusIcon
                              className={`h-3.5 w-3.5 ${
                                ticket.status === "verifying"
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-medium text-white/35">
                                {ticket.id}
                              </span>

                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] ${config.className}`}
                              >
                                {config.label}
                              </span>
                            </div>

                            <h3 className="mt-1.5 truncate text-sm font-medium text-white/75 transition group-hover:text-white">
                              {ticket.title}
                            </h3>

                            <p className="mt-1 truncate text-[10px] text-white/20">
                              {config.description}
                            </p>
                          </div>
                        </div>

                        <div className="hidden lg:block">
                          <QueueCellLabel label="Category" />

                          <div className="mt-1.5 truncate text-xs text-white/45">
                            {ticket.category}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:w-auto">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.05] ${
                              isAI
                                ? "bg-white/[0.035]"
                                : "bg-purple-400/[0.035]"
                            }`}
                          >
                            {isAI ? (
                              <Bot className="h-3.5 w-3.5 text-white/45" />
                            ) : (
                              <UserRound className="h-3.5 w-3.5 text-purple-300/55" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <QueueCellLabel label="Owner" />

                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="truncate text-xs text-white/45">
                                {ticket.assignee}
                              </span>

                              <span
                                className={`hidden rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] xl:inline ${
                                  isAI
                                    ? "bg-white/[0.045] text-white/30"
                                    : "bg-purple-400/[0.06] text-purple-300/45"
                                }`}
                              >
                                {isAI ? "AI" : "Human"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:block">
                          <Clock3 className="h-3.5 w-3.5 text-white/20 lg:hidden" />

                          <div>
                            <QueueCellLabel label="Updated" />

                            <div className="mt-1.5 text-[10px] text-white/30">
                              {ticket.updated}
                            </div>
                          </div>
                        </div>

                        <div className="hidden items-center justify-end lg:flex">
                          <ChevronRight className="h-4 w-4 text-white/10 transition group-hover:translate-x-0.5 group-hover:text-white/35" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="mt-4 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.012] px-4 py-3.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />

          <div>
            <p className="text-xs font-medium text-white/40">
              Controlled operations
            </p>

            <p className="mt-1 max-w-4xl text-[10px] leading-5 text-white/22">
              Autonomous remediation is governed by policy and followed by
              verification. Requests outside the approved Level-1 scope remain
              available for human escalation.
            </p>
          </div>
        </section>

        <footer className="mt-7 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-white/18 sm:flex-row sm:items-center sm:justify-between">
          <span>PHOENIX IT HELPDESK · Ticket Center</span>

          <span>
            FastAPI ticket service · Controlled autonomous workflow
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
  spin = false,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof FileText;
  spin?: boolean;
}) {
  return (
    <div className="min-w-0 bg-[#0a0c0e] p-4 transition hover:bg-[#0d0f11]">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-white/25">
          {label}
        </div>

        <Icon
          className={`h-3.5 w-3.5 shrink-0 text-white/20 ${
            spin ? "animate-spin" : ""
          }`}
        />
      </div>

      <div className="mt-3 text-[23px] font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>

      <p className="mt-1 truncate text-[9px] text-white/20">{detail}</p>
    </div>
  );
}

function QueueHeader({ label }: { label: string }) {
  return (
    <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/20">
      {label}
    </div>
  );
}

function QueueCellLabel({ label }: { label: string }) {
  return (
    <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/18">
      {label}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <Loader2 className="h-4 w-4 animate-spin text-white/30" />
      </div>

      <p className="mt-4 text-sm text-white/35">
        Loading live tickets...
      </p>

      <p className="mt-1 text-[10px] text-white/18">
        Connecting to the ticket service
      </p>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
        <Search className="h-4 w-4 text-white/25" />
      </div>

      <p className="mt-4 text-sm text-white/40">
        {hasFilters ? "No matching tickets" : "No tickets available"}
      </p>

      <p className="mt-1 max-w-sm text-[10px] leading-5 text-white/20">
        {hasFilters
          ? "Try another search term or select a different status filter."
          : "The ticket service returned an empty operational queue."}
      </p>
    </div>
  );
}