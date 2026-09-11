"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bot,
  ChevronRight,
  Clock3,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getTickets, type Ticket } from "@/lib/api/client";

const statusConfig = {
  resolved: {
    label: "Resolved",
    className: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  verifying: {
    label: "Verifying",
    className: "text-indigo-300",
    dot: "bg-indigo-300",
  },
  waiting: {
    label: "Waiting",
    className: "text-amber-400",
    dot: "bg-amber-400",
  },
  open: {
    label: "Open",
    className: "text-zinc-400",
    dot: "bg-zinc-500",
  },
} as const;

export function RecentTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTickets();

        if (!cancelled) {
          setTickets(data.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load live ticket activity.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <span className="text-[12px] font-medium text-zinc-300">
            Recent tickets
          </span>

          <p className="mt-1 text-[12px] text-zinc-600">
            Latest Level-1 helpdesk activity
          </p>
        </div>

        <Link
          href="/tickets"
          className="group flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="divide-y divide-white/[0.045]">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`ticket-skeleton-${index}`}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.035]" />

              <div className="min-w-0 flex-1">
                <div className="h-3 w-52 max-w-[70%] animate-pulse rounded bg-white/[0.05]" />
                <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-white/[0.035]" />
              </div>

              <div className="hidden h-2.5 w-14 animate-pulse rounded bg-white/[0.04] sm:block" />

              <div className="h-3.5 w-3.5 shrink-0 rounded bg-white/[0.025]" />
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
            No recent tickets found.
          </div>
        ) : (
          tickets.map((ticket, index) => {
            const status = statusConfig[ticket.status];

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.04,
                }}
              >
                <Link
                  href={`/tickets/${encodeURIComponent(ticket.id)}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.018]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20">
                    {ticket.assignee === "AI Agent" ? (
                      <Bot className="h-3.5 w-3.5 text-indigo-300" />
                    ) : (
                      <UserRound className="h-3.5 w-3.5 text-zinc-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
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
                      <span className="text-[10px] text-zinc-600">
                        {ticket.category}
                      </span>

                      <span className="text-zinc-800">·</span>

                      <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                        <Clock3 className="h-2.5 w-2.5" />
                        {ticket.updated}
                      </span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />

                    <span className={`text-[10px] ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-800 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-600" />
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}