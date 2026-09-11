"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react";

import { retrievedSources } from "@/lib/agent-data";

export function KnowledgeRetrieval() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-zinc-500" />

            <span className="text-[12px] font-medium text-zinc-300">
              Knowledge retrieval
            </span>
          </div>

          <p className="mt-1 text-[11px] text-zinc-600">
            Retrieved context for the current request
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Context ready
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-700" />

          <span className="truncate text-[10px] text-zinc-500">
            VPN connectivity troubleshooting
          </span>

          <span className="ml-auto shrink-0 font-mono text-[9px] text-zinc-700">
            semantic search
          </span>
        </div>

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
              className="group flex items-center gap-3 rounded-lg border border-white/[0.045] bg-white/[0.015] px-3 py-3 transition-colors duration-200 hover:border-white/[0.08] hover:bg-white/[0.025]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.05] bg-black/20">
                <FileText className="h-3.5 w-3.5 text-zinc-600" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[11px] font-medium text-zinc-300">
                    {source.title}
                  </span>

                  <span className="hidden rounded-md bg-white/[0.035] px-1.5 py-0.5 text-[8px] text-zinc-600 sm:inline">
                    {source.category}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[9px] text-zinc-700">
                    {source.id}
                  </span>

                  <span className="text-zinc-800">·</span>

                  <span className="text-[9px] text-zinc-600">
                    Retrieved as relevant context
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[10px] text-zinc-400">
                    {source.relevance}
                  </div>

                  <div className="text-[8px] uppercase tracking-[0.1em] text-zinc-700">
                    relevance
                  </div>
                </div>

                <ChevronRight className="h-3 w-3 text-zinc-800 transition-colors group-hover:text-zinc-600" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
        <span className="text-[9px] text-zinc-700">
          Retrieval-augmented context
        </span>

        <span className="font-mono text-[9px] text-zinc-700">
          3 sources
        </span>
      </div>
    </section>
  );
}