"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";

import type { AgentRunResponse } from "@/lib/api/client";

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

const knowledgeDocuments = [
  {
    id: "KB-021",
    title: "VPN connectivity troubleshooting",
    category: "Network",
    type: "Procedure",
    status: "Indexed",
    updated: "2 days ago",
  },
  {
    id: "KB-014",
    title: "VPN client connection procedure",
    category: "Network",
    type: "Procedure",
    status: "Indexed",
    updated: "4 days ago",
  },
  {
    id: "KB-008",
    title: "Remote access service requirements",
    category: "Access",
    type: "Policy",
    status: "Indexed",
    updated: "1 week ago",
  },
  {
    id: "KB-031",
    title: "Password reset and account recovery",
    category: "Identity",
    type: "Procedure",
    status: "Indexed",
    updated: "3 days ago",
  },
  {
    id: "KB-042",
    title: "Software installation approval process",
    category: "Software",
    type: "Policy",
    status: "Indexed",
    updated: "5 days ago",
  },
  {
    id: "KB-055",
    title: "Access request authorization rules",
    category: "Access",
    type: "Policy",
    status: "Indexed",
    updated: "1 week ago",
  },
];

function loadLatestRun(): AgentRunResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as AgentRunResponse;
  } catch {
    return null;
  }
}

function formatQuery(result: AgentRunResponse | null): string {
  if (!result) {
    return "No agent request available";
  }

  const intent = result.understanding?.intent;

  if (intent === "troubleshoot_vpn") {
    return "VPN connectivity troubleshooting";
  }

  if (intent === "reset_password") {
    return "Password reset";
  }

  if (intent === "install_software") {
    return "Software installation";
  }

  if (intent === "request_access") {
    return "Application access request";
  }

  return result.message || "Latest autonomous agent request";
}

export default function KnowledgePage() {
  const [latestRun, setLatestRun] = useState<AgentRunResponse | null>(null);

  useEffect(() => {
    const load = () => {
      setLatestRun(loadLatestRun());
    };

    load();

    window.addEventListener(AGENT_RUN_EVENT, load);

    return () => {
      window.removeEventListener(AGENT_RUN_EVENT, load);
    };
  }, []);

  const retrievedSources = latestRun?.retrieved_knowledge ?? [];

  const query = useMemo(() => formatQuery(latestRun), [latestRun]);

  const retrievalStatus = latestRun
    ? retrievedSources.length > 0
      ? "Live retrieval"
      : "No sources retrieved"
    : "Awaiting agent run";

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1600px] px-6 py-7 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <span className="status-live text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Intelligence / Knowledge
              </span>

              <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.035em] text-zinc-100">
                Knowledge Center
              </h1>

              <p className="mt-2 max-w-2xl text-[12px] leading-6 text-zinc-500">
                Manage the knowledge base and inspect the context retrieved by
                the autonomous agent during request resolution.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-400/[0.1] bg-emerald-400/[0.025] px-3 py-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />

              <span className="text-[10px] font-medium text-emerald-400">
                {retrievalStatus}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
        {/* Overview */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Indexed documents",
              value: "126",
              icon: FileText,
            },
            {
              label: "Knowledge categories",
              value: "8",
              icon: BookOpen,
            },
            {
              label: "Latest retrieval",
              value: retrievedSources.length
                ? String(retrievedSources.length)
                : "—",
              icon: Search,
            },
            {
              label: "Index status",
              value: "Ready",
              icon: Database,
            },
          ].map((metric, index) => {
            const Icon = metric.icon;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.04,
                }}
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">
                    {metric.label}
                  </span>

                  <Icon className="h-3.5 w-3.5 text-zinc-700" />
                </div>

                <div className="mt-3 text-[22px] font-semibold tracking-tight text-zinc-200">
                  {metric.value}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Retrieval pipeline */}
        <div className="mt-3 rounded-xl border border-indigo-400/[0.08] bg-indigo-400/[0.018] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              "Request",
              "Query",
              "RAG Retrieval",
              "Ranked Sources",
              "Agent Context",
            ].map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <div
                  className={`rounded-md border px-3 py-2 ${
                    index === 2
                      ? "border-indigo-300/[0.15] bg-indigo-400/[0.06] text-indigo-200"
                      : "border-white/[0.06] bg-black/20 text-zinc-500"
                  }`}
                >
                  <span className="text-[9px] font-medium uppercase tracking-[0.1em]">
                    {stage}
                  </span>
                </div>

                {index < 4 && (
                  <span className="text-[10px] text-zinc-800">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/20 px-4 py-3">
            <Search className="h-4 w-4 text-zinc-700" />

            <span className="text-[11px] text-zinc-600">
              Search the knowledge base...
            </span>

            <span className="ml-auto hidden rounded-md border border-white/[0.06] px-2 py-1 font-mono text-[8px] text-zinc-700 sm:block">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* Documents */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <span className="text-[12px] font-medium text-zinc-300">
                  Knowledge base
                </span>

                <p className="mt-1 text-[11px] text-zinc-600">
                  Documents available for retrieval
                </p>
              </div>

              <button
                type="button"
                className="text-[10px] font-medium text-zinc-600 transition hover:text-zinc-300"
              >
                Manage sources
              </button>
            </div>

            <div className="divide-y divide-white/[0.045]">
              {knowledgeDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.04,
                  }}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.018]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20">
                    <FileText className="h-3.5 w-3.5 text-zinc-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-zinc-700">
                        {document.id}
                      </span>

                      <span className="truncate text-[11px] font-medium text-zinc-300">
                        {document.title}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[9px] text-zinc-600">
                        {document.category}
                      </span>

                      <span className="text-zinc-800">·</span>

                      <span className="text-[9px] text-zinc-700">
                        {document.type}
                      </span>
                    </div>
                  </div>

                  <div className="hidden text-right sm:block">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      <span className="text-[9px] text-emerald-400">
                        {document.status}
                      </span>
                    </div>

                    <span className="mt-1 block text-[8px] text-zinc-800">
                      Updated {document.updated}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Retrieval inspector */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />

                <span className="text-[12px] font-medium text-zinc-300">
                  Retrieval inspector
                </span>
              </div>

              <p className="mt-1 text-[11px] text-zinc-600">
                Latest context supplied to the agent
              </p>
            </div>

            <div className="p-4">
              <div className="rounded-lg border border-indigo-400/[0.08] bg-indigo-400/[0.025] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                    Query
                  </span>

                  {latestRun?.ticket_id && (
                    <span className="font-mono text-[8px] text-zinc-700">
                      {latestRun.ticket_id}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[10px] leading-5 text-zinc-400">
                  {query}
                </p>

                {latestRun?.understanding && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-md border border-white/[0.05] bg-black/20 px-2 py-1 text-[8px] text-zinc-600">
                      {latestRun.understanding.category}
                    </span>

                    <span className="rounded-md border border-white/[0.05] bg-black/20 px-2 py-1 font-mono text-[8px] text-zinc-600">
                      {Math.round(
                        latestRun.understanding.confidence * 100,
                      )}
                      % intent confidence
                    </span>
                  </div>
                )}
              </div>

              {retrievedSources.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {retrievedSources.map((source, index) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.05,
                      }}
                      className="rounded-lg border border-white/[0.05] bg-black/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-mono text-[8px] text-zinc-700">
                            {source.id}
                          </span>

                          <h3 className="mt-1 text-[10px] font-medium text-zinc-300">
                            {source.title}
                          </h3>
                        </div>

                        <span className="shrink-0 font-mono text-[10px] text-indigo-300">
                          {Math.round(source.relevance * 100)}%
                        </span>
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full bg-indigo-400/50"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, source.relevance * 100),
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="mt-2 block text-[8px] text-zinc-700">
                        {source.category}
                      </span>

                      <p className="mt-2 line-clamp-3 text-[9px] leading-4 text-zinc-600">
                        {source.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-white/[0.06] bg-black/10 p-5 text-center">
                  <Search className="mx-auto h-4 w-4 text-zinc-800" />

                  <p className="mt-2 text-[10px] text-zinc-600">
                    Run the AI Agent to populate live retrieval results.
                  </p>

                  <p className="mt-1 text-[8px] leading-4 text-zinc-800">
                    Retrieved knowledge will appear here as ranked agent
                    context.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />

                <span className="text-[9px] text-zinc-700">
                  {retrievedSources.length > 0
                    ? "Retrieved context ready for reasoning"
                    : "Retrieval context awaiting agent execution"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Agent context */}
        <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-zinc-600" />

              <span className="text-[12px] font-medium text-zinc-300">
                Agent context
              </span>
            </div>

            <p className="mt-1 text-[11px] text-zinc-600">
              Knowledge retrieved before autonomous reasoning and planning.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.045] md:grid-cols-4">
            <div className="bg-[#090a0c] p-4">
              <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-700">
                Ticket
              </span>

              <p className="mt-2 font-mono text-[11px] text-zinc-300">
                {latestRun?.ticket_id ?? "—"}
              </p>
            </div>

            <div className="bg-[#090a0c] p-4">
              <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-700">
                Intent
              </span>

              <p className="mt-2 text-[10px] text-zinc-400">
                {latestRun?.understanding?.intent ?? "—"}
              </p>
            </div>

            <div className="bg-[#090a0c] p-4">
              <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-700">
                Sources
              </span>

              <p className="mt-2 font-mono text-[11px] text-zinc-300">
                {retrievedSources.length}
              </p>
            </div>

            <div className="bg-[#090a0c] p-4">
              <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-700">
                Next stage
              </span>

              <p className="mt-2 text-[10px] text-zinc-400">
                Reasoning &amp; Planning
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3 w-3 text-zinc-700" />

            <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
              Retrieval-Augmented Knowledge
            </span>
          </div>

          <span className="text-[9px] text-zinc-800">
            Prototype knowledge environment
          </span>
        </div>
      </div>
    </div>
  );
}
