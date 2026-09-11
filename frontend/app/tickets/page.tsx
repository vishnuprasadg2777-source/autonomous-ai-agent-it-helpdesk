"use client";

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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getTickets, type Ticket } from "@/lib/api/client";

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-amber-400/[0.07] text-amber-300/75",
    icon: AlertCircle,
  },
  verifying: {
    label: "Verifying",
    className: "bg-blue-400/[0.07] text-blue-300/75",
    icon: Loader2,
  },
  waiting: {
    label: "Waiting",
    className: "bg-purple-400/[0.07] text-purple-300/75",
    icon: Clock3,
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-400/[0.07] text-emerald-300/75",
    icon: CheckCircle2,
  },
};

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

  const counts = {
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
  };

  return (
    <div className="min-h-full bg-[#060708]">
      <div className="mx-auto max-w-[1800px] px-6 py-7 lg:px-8">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              <span>Operations</span>
              <ChevronRight className="h-3 w-3" />
              <span>Ticket Center</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <FileText className="h-4 w-4 text-white/60" />
              </div>

              <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-white">
                Tickets
              </h1>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
              Monitor IT incidents, autonomous remediation, verification and
              human escalation from a single operational queue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.035] px-3 text-xs text-emerald-300/75">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              API connected
            </div>

            <button
              type="button"
              onClick={() => void loadTickets(true)}
              disabled={loading || refreshing}
              className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-white/45 transition hover:bg-white/[0.05] hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
          <Metric label="Total" value={counts.all} detail="Live tickets" />
          <Metric label="Open" value={counts.open} detail="Awaiting action" />
          <Metric
            label="Verifying"
            value={counts.verifying}
            detail="Checking outcome"
          />
          <Metric
            label="Waiting"
            value={counts.waiting}
            detail="Human action"
          />
          <Metric
            label="Resolved"
            value={counts.resolved}
            detail="Completed"
          />
        </section>

        <section className="mb-4 rounded-xl border border-white/[0.07] bg-[#0a0c0e]">
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-[520px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ticket ID, title, category or assignee..."
                className="h-10 w-full rounded-lg border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-white/[0.14]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="mr-1 flex items-center gap-1.5 text-xs text-white/30">
                <Filter className="h-3.5 w-3.5" />
                Status
              </div>

              {[
                ["all", "All"],
                ["open", "Open"],
                ["verifying", "Verifying"],
                ["waiting", "Waiting"],
                ["resolved", "Resolved"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      value as "all" | Ticket["status"],
                    )
                  }
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition ${
                    statusFilter === value
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

        {error && (
          <section className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/10 bg-red-400/[0.025] px-4 py-3.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300/60" />

            <div>
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
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Incident queue
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Live data from the FastAPI ticket service.
              </p>
            </div>

            <span className="font-mono text-[10px] text-white/25">
              {filteredTickets.length} records
            </span>
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredTickets.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-white/[0.045]">
              {filteredTickets.map((ticket) => {
                const config = statusConfig[ticket.status];
                const StatusIcon = config.icon;

                return (
                  <a
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.025] lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 lg:min-w-[320px]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
                        <FileText className="h-3.5 w-3.5 text-white/35" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-white/35">
                            {ticket.id}
                          </span>

                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${config.className}`}
                          >
                            {config.label}
                          </span>
                        </div>

                        <h3 className="mt-1 truncate text-sm font-medium text-white/75 group-hover:text-white">
                          {ticket.title}
                        </h3>
                      </div>
                    </div>

                    <div className="hidden w-[150px] lg:block">
                      <div className="text-[9px] uppercase tracking-[0.1em] text-white/20">
                        Category
                      </div>

                      <div className="mt-1 text-xs text-white/45">
                        {ticket.category}
                      </div>
                    </div>

                    <div className="flex w-[180px] items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.025]">
                        {ticket.assignee === "AI Agent" ? (
                          <Bot className="h-3.5 w-3.5 text-white/35" />
                        ) : (
                          <UserRound className="h-3.5 w-3.5 text-white/35" />
                        )}
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-[0.1em] text-white/20">
                          Assignee
                        </div>

                        <div className="mt-1 text-xs text-white/45">
                          {ticket.assignee}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-[110px] items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5 text-white/20" />

                      <div>
                        <div className="text-[9px] uppercase tracking-[0.1em] text-white/20">
                          Updated
                        </div>

                        <div className="mt-1 text-[10px] text-white/35">
                          {ticket.updated}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:w-[100px] lg:justify-end">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-md ${config.className}`}
                      >
                        <StatusIcon
                          className={`h-3.5 w-3.5 ${
                            ticket.status === "verifying"
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      </div>

                      <ChevronRight className="h-4 w-4 text-white/15 transition group-hover:translate-x-0.5 group-hover:text-white/35" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-4 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />

          <div>
            <p className="text-xs font-medium text-white/45">
              Controlled operations
            </p>

            <p className="mt-1 text-[10px] leading-5 text-white/25">
              Autonomous remediation is governed by policy and followed by
              verification. Requests outside the approved Level-1 scope
              remain available for human escalation.
            </p>
          </div>
        </section>

        <footer className="mt-7 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[10px] text-white/20 sm:flex-row sm:items-center sm:justify-between">
          <span>Autonomous IT Operations · Ticket Center</span>
          <span>Live FastAPI ticket data · Controlled agent workflow</span>
        </footer>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0a0c0e] p-4">
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">
        {label}
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>

      <p className="mt-1 text-[10px] text-white/25">{detail}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-white/30" />

      <p className="mt-3 text-sm text-white/35">
        Loading live tickets...
      </p>

      <p className="mt-1 text-[10px] text-white/20">
        Connecting to the ticket service
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
        <Search className="h-4 w-4 text-white/25" />
      </div>

      <p className="mt-4 text-sm text-white/40">
        No matching tickets
      </p>

      <p className="mt-1 text-[10px] text-white/20">
        Try another search term or status filter.
      </p>
    </div>
  );
}