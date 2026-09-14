"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Layers3,
  Search,
  Sparkles,
  X,
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

function formatIntent(intent: string | undefined) {
  if (!intent) {
    return "—";
  }

  return intent.replaceAll("_", " ");
}

function getRetrievalLabel(count: number) {
  if (count === 0) {
    return "Awaiting retrieval";
  }

  return `${count} source${count === 1 ? "" : "s"} retrieved`;
}

export default function KnowledgePage() {
  const [latestRun, setLatestRun] = useState<AgentRunResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  /*
   * Keyboard shortcut:
   * Cmd + K on macOS
   * Ctrl + K on Windows/Linux
   */
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const retrievedSources = latestRun?.retrieved_knowledge ?? [];

  const query = useMemo(() => formatQuery(latestRun), [latestRun]);

  /*
   * Real-time knowledge search.
   *
   * Searches:
   * - Knowledge ID
   * - Document title
   * - Category
   * - Document type
   */
  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return knowledgeDocuments;
    }

    return knowledgeDocuments.filter((document) => {
      const searchableText = [
        document.id,
        document.title,
        document.category,
        document.type,
        document.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery]);

  const averageRelevance =
    retrievedSources.length > 0
      ? Math.round(
          (retrievedSources.reduce(
            (sum, source) => sum + source.relevance,
            0,
          ) /
            retrievedSources.length) *
            100,
        )
      : 0;

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

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
                Intelligence / Retrieval
              </span>

              <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.035em] text-zinc-100">
                Knowledge Center
              </h1>

              <p className="mt-2 max-w-2xl text-[12px] leading-6 text-zinc-500">
                Enterprise knowledge infrastructure for retrieval-augmented
                reasoning, ranked context, and grounded autonomous decisions.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-400/[0.1] bg-emerald-400/[0.025] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[10px] font-medium text-emerald-400">
                {latestRun
                  ? getRetrievalLabel(retrievedSources.length)
                  : "Index ready"}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
              label: "Retrieved sources",
              value: retrievedSources.length
                ? String(retrievedSources.length)
                : "—",
              icon: Search,
            },
            {
              label: "Avg. relevance",
              value: retrievedSources.length
                ? `${averageRelevance}%`
                : "—",
              icon: Sparkles,
            },
            {
              label: "Vector index",
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

        {/* RAG pipeline */}
        <section className="mt-3 overflow-hidden rounded-xl border border-indigo-400/[0.09] bg-indigo-400/[0.018]">
          <div className="border-b border-indigo-400/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5 text-indigo-300" />

              <span className="text-[12px] font-medium text-zinc-300">
                Retrieval pipeline
              </span>

              <span className="ml-1 rounded-md border border-indigo-300/[0.1] bg-indigo-300/[0.035] px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] text-indigo-300">
                RAG
              </span>
            </div>

            <p className="mt-1 text-[10px] text-zinc-600">
              Knowledge is retrieved before autonomous reasoning and planning.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-5">
            {[
              {
                step: "01",
                title: "Request",
                detail: "User intent",
              },
              {
                step: "02",
                title: "Query",
                detail: "Retrieval query",
              },
              {
                step: "03",
                title: "Retrieve",
                detail: "Semantic search",
              },
              {
                step: "04",
                title: "Rank",
                detail: "Relevance scoring",
              },
              {
                step: "05",
                title: "Context",
                detail: "Agent grounding",
              },
            ].map((stage, index) => (
              <div
                key={stage.step}
                className="relative bg-[#090a0c] px-5 py-4"
              >
                <span className="font-mono text-[8px] text-zinc-700">
                  {stage.step}
                </span>

                <div className="mt-2 text-[11px] font-medium text-zinc-300">
                  {stage.title}
                </div>

                <div className="mt-1 text-[9px] text-zinc-600">
                  {stage.detail}
                </div>

                {index < 4 && (
                  <ArrowRight className="absolute right-3 top-1/2 hidden h-3 w-3 -translate-y-1/2 text-zinc-800 md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Functional search */}
        <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
              searchQuery
                ? "border-indigo-400/[0.22] bg-indigo-400/[0.035]"
                : "border-white/[0.07] bg-black/20"
            }`}
          >
            <Search
              className={`h-4 w-4 shrink-0 ${
                searchQuery ? "text-indigo-300" : "text-zinc-700"
              }`}
            />

            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  clearSearch();
                }
              }}
              placeholder="Search indexed knowledge..."
              aria-label="Search indexed knowledge"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-300 outline-none placeholder:text-zinc-700"
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear knowledge search"
                className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition hover:bg-white/[0.06] hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="hidden rounded-md border border-white/[0.06] px-2 py-1 font-mono text-[8px] text-zinc-700 sm:block">
                ⌘ K
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[9px] text-zinc-700">
              {searchQuery
                ? `Searching for “${searchQuery}”`
                : "Search by document, category, type, or knowledge ID"}
            </span>

            <span className="font-mono text-[9px] text-zinc-600">
              {filteredDocuments.length} / {knowledgeDocuments.length}
            </span>
          </div>
        </section>

        {/* Main */}
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_410px]">
          {/* Knowledge base */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <span className="text-[12px] font-medium text-zinc-300">
                  Knowledge base
                </span>

                <p className="mt-1 text-[11px] text-zinc-600">
                  Indexed procedures, policies, and operational guidance
                </p>
              </div>

              <span className="font-mono text-[9px] text-zinc-700">
                {filteredDocuments.length} visible
              </span>
            </div>

            <div className="divide-y divide-white/[0.045]">
              {filteredDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.035,
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

              {filteredDocuments.length === 0 && (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20">
                    <Search className="h-4 w-4 text-zinc-700" />
                  </div>

                  <p className="mt-3 text-[10px] text-zinc-500">
                    No knowledge sources found
                  </p>

                  <p className="mt-1 text-[9px] text-zinc-700">
                    Try a different document name, category, or knowledge ID.
                  </p>

                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-4 rounded-md border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[9px] font-medium text-zinc-500 transition hover:border-white/[0.12] hover:text-zinc-300"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />

                <span className="text-[9px] text-zinc-700">
                  Vector knowledge index operational
                </span>
              </div>
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
                Ranked sources supplied to the autonomous agent
              </p>
            </div>

            <div className="p-4">
              <div className="rounded-lg border border-indigo-400/[0.08] bg-indigo-400/[0.025] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                    Active query
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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
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
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-zinc-700">
                              #{index + 1}
                            </span>

                            <span className="font-mono text-[8px] text-zinc-700">
                              {source.id}
                            </span>
                          </div>

                          <h3 className="mt-1 text-[10px] font-medium text-zinc-300">
                            {source.title}
                          </h3>
                        </div>

                        <span className="shrink-0 font-mono text-[10px] text-indigo-300">
                          {Math.round(source.relevance * 100)}%
                        </span>
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.max(
                              0,
                              Math.min(100, source.relevance * 100),
                            )}%`,
                          }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.08,
                          }}
                          className="h-full rounded-full bg-indigo-400/50"
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[8px] text-zinc-700">
                          {source.category}
                        </span>

                        <span className="text-[8px] text-zinc-800">
                          semantic relevance
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-3 text-[9px] leading-4 text-zinc-600">
                        {source.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-white/[0.06] bg-black/10 p-6 text-center">
                  <Search className="mx-auto h-4 w-4 text-zinc-800" />

                  <p className="mt-2 text-[10px] text-zinc-600">
                    Run the AI Agent to populate live retrieval results.
                  </p>

                  <p className="mt-1 text-[8px] leading-4 text-zinc-800">
                    Ranked knowledge sources will appear here as agent
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

        {/* Grounded agent context */}
        <section className="mt-3 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-zinc-600" />

              <span className="text-[12px] font-medium text-zinc-300">
                Grounded agent context
              </span>
            </div>

            <p className="mt-1 text-[11px] text-zinc-600">
              The retrieval layer provides evidence before the agent reasons
              about actions.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.045] md:grid-cols-5">
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

              <p className="mt-2 text-[10px] capitalize text-zinc-400">
                {formatIntent(latestRun?.understanding?.intent)}
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
                Avg. relevance
              </span>

              <p className="mt-2 font-mono text-[11px] text-zinc-300">
                {retrievedSources.length ? `${averageRelevance}%` : "—"}
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

        {/* Architecture statement */}
        <section className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-700">
                Knowledge grounding
              </span>

              <p className="mt-1 text-[10px] text-zinc-600">
                Retrieval supplies evidence; the agent uses that evidence with
                IT state, policy, and planning before controlled execution.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.1em] text-zinc-700">
              <span>Retrieve</span>
              <ArrowRight className="h-3 w-3" />
              <span>Ground</span>
              <ArrowRight className="h-3 w-3" />
              <span>Reason</span>
              <ArrowRight className="h-3 w-3" />
              <span>Act</span>
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
            Phoenix knowledge environment
          </span>
        </div>
      </div>
    </div>
  );
}