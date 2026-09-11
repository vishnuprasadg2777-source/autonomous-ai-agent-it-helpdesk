"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Clock3,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function AgentStatusBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-indigo-400/[0.1] bg-indigo-400/[0.025]"
    >
      <div className="flex flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-400/[0.12] bg-indigo-400/[0.045]">
            <BrainCircuit className="h-4 w-4 text-indigo-300" />

            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-indigo-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-300">
                Agent is observing the IT environment
              </span>

              <span className="rounded-full border border-indigo-400/[0.1] bg-indigo-400/[0.04] px-1.5 py-0.5 text-[8px] font-medium text-indigo-300">
                RUNNING
              </span>
            </div>

            <p className="mt-0.5 text-[9px] text-zinc-600">
              Evaluating current state before selecting the next action
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-zinc-700" />

            <span className="text-[9px] text-zinc-600">
              Execution stream
            </span>

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          </div>

          <div className="hidden h-4 w-px bg-white/[0.06] sm:block" />

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-zinc-700" />

            <span className="text-[9px] text-zinc-600">
              Policy active
            </span>
          </div>

          <div className="hidden h-4 w-px bg-white/[0.06] sm:block" />

          <div className="flex items-center gap-1.5">
            <Clock3 className="h-3 w-3 text-zinc-700" />

            <span className="font-mono text-[9px] text-zinc-600">
              2.0s
            </span>
          </div>

          <Zap className="hidden h-3 w-3 text-indigo-300/60 sm:block" />
        </div>
      </div>
    </motion.div>
  );
}