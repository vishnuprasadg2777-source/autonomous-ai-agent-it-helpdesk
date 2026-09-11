"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Circle,
  Clock3,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getTickets, type Ticket } from "@/lib/api/client";

const statusConfig = {
  resolved: {
    label: "Completed",
    icon: Check,
    className: "text-emerald-400",
    progress: "100%",
  },
  verifying: {
    label: "Running",
    icon: Sparkles,
    className: "text-indigo-300",
    progress: "64%",
  },
  waiting: {
    label: "Waiting",
    icon: Clock3,
    className: "text-amber-400",
    progress: "42%",
  },
  open: {
    label: "Blocked",
    icon: ShieldAlert,
    className: "text-red-400",
    progress: "28%",
  },
} as const;

function getStage(ticket: Ticket) {
  switch (ticket.status) {
    case "resolved":
      return "Verified resolution";
    case "verifying":
      return "IT state observation";
    case "waiting":
      return "Policy evaluation";
    case "open":
      return "Authorization required";
    default:
      return "Request processing";
  }
}

export function AgentActivity() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTickets();

        if (!cancelled) {
          setTickets(data.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load agent activity.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  function openTicket(ticketId: string) {
    router.push(`/tickets/${encodeURIComponent(ticketId)}`);
  }

  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <span className="status-live text-[11px] font-medium text-zinc-300">
            Agent activity
          </span>

          <p className="mt-1 text-[12px] text-zinc-600">
            Autonomous executions across the helpdesk
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/observatory")}
          className="group flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
        >
          View observatory
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="divide-y divide-white/[0.045]">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`activity-skeleton-${index}`}
              className="px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.035]" />

                <div className="min-w-0 flex-1">
                  <div className="h-3 w-56 max-w-[70%] animate-pulse rounded bg-white/[0.05]" />

                  <div className="mt-2 h-2.5 w-36 animate-pulse rounded bg-white/[0.035]" />

                  <div className="mt-3 h-px w-full bg-white/[0.035]" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="px-5 py-8 text-center">
            <div className="text-[11px] font-medium text-zinc-400">
              {error}
            </div>

            <p className="mt-1 text-[10px] text-zinc-700">
              Check that the FastAPI backend is running on port 8000.
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-[11px] text-zinc-600">
            No active ticket activity found.
          </div>
        ) : (
          tickets.map((ticket, index) => {
            const config = statusConfig[ticket.status];
            const StatusIcon = config.icon;

            return (
              <motion.button
                key={ticket.id}
                type="button"
                onClick={() => openTicket(ticket.id)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                }}
                className="group block w-full px-5 py-4 text-left transition-colors duration-200 hover:bg-white/[0.018] focus:outline-none focus-visible:bg-white/[0.03]"
              >
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20">
                    <StatusIcon
                      className={`h-3.5 w-3.5 ${config.className}`}
                    />

                    {ticket.status === "verifying" && (
                      <span className="absolute inset-0 animate-pulse rounded-lg border border-indigo-400/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-600">
                            {ticket.id}
                          </span>

                          <span className="h-0.5 w-0.5 rounded-full bg-zinc-700" />

                          <span className="truncate text-[12px] font-medium text-zinc-300 transition-colors group-hover:text-zinc-100">
                            {ticket.title}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={`text-[11px] ${config.className}`}
                          >
                            {config.label}
                          </span>

                          <span className="text-zinc-700">·</span>

                          <span className="text-[11px] text-zinc-600">
                            {getStage(ticket)}
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 text-[10px] text-zinc-700">
                        {ticket.updated}
                      </span>
                    </div>

                    <div className="mt-3 h-px w-full overflow-hidden bg-white/[0.035]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: config.progress }}
                        transition={{
                          duration: 0.7,
                          delay: index * 0.08,
                        }}
                        className={`h-full ${
                          ticket.status === "resolved"
                            ? "bg-emerald-400/60"
                            : ticket.status === "verifying"
                              ? "bg-indigo-400/70"
                              : ticket.status === "waiting"
                                ? "bg-amber-400/60"
                                : "bg-red-400/60"
                        }`}
                      />
                    </div>
                  </div>

                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-800 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
        <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />

        <span className="text-[10px] text-zinc-600">
          Ticket activity synchronized with FastAPI
        </span>
      </div>
    </section>
  );
}