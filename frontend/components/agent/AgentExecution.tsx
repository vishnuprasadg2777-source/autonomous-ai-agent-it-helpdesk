"use client";

import { motion } from "framer-motion";
import {
  Check,
  Circle,
  Clock3,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { agentStages } from "@/lib/agent-data";

const statusConfig = {
  completed: {
    icon: Check,
    label: "Completed",
    iconClass: "text-emerald-400",
    indicatorClass: "bg-emerald-400",
  },
  running: {
    icon: Loader2,
    label: "Running",
    iconClass: "text-indigo-300",
    indicatorClass: "bg-indigo-300",
  },
  pending: {
    icon: Circle,
    label: "Pending",
    iconClass: "text-zinc-700",
    indicatorClass: "bg-zinc-700",
  },
  blocked: {
    icon: ShieldAlert,
    label: "Blocked",
    iconClass: "text-red-400",
    indicatorClass: "bg-red-400",
  },
} as const;

export function AgentExecution() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />

            <span className="text-[12px] font-medium text-zinc-300">
              Agent execution
            </span>
          </div>

          <p className="mt-1 text-[11px] text-zinc-600">
            Autonomous decision pipeline
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-indigo-400/[0.12] bg-indigo-400/[0.04] px-2.5 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />
          <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-indigo-300">
            Live
          </span>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="relative">
          <div className="absolute bottom-6 left-[13px] top-6 w-px bg-white/[0.06]" />

          <div className="space-y-1">
            {agentStages.map((stage, index) => {
              const config = statusConfig[stage.status];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.06,
                  }}
                  className="group relative flex gap-4 rounded-lg px-1 py-3 transition-colors duration-200 hover:bg-white/[0.018]"
                >
                  <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#0b0d0f]">
                    <StatusIcon
                      className={`h-3.5 w-3.5 ${
                        stage.status === "running"
                          ? `${config.iconClass} animate-spin`
                          : config.iconClass
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`text-[12px] font-medium ${
                          stage.status === "pending"
                            ? "text-zinc-600"
                            : "text-zinc-300"
                        }`}
                      >
                        {stage.label}
                      </span>

                      <div className="flex shrink-0 items-center gap-2">
                        {stage.duration && (
                          <span className="font-mono text-[9px] text-zinc-700">
                            {stage.duration}
                          </span>
                        )}

                        <span
                          className={`text-[9px] ${
                            stage.status === "completed"
                              ? "text-emerald-400"
                              : stage.status === "running"
                                ? "text-indigo-300"
                                : stage.status === "blocked"
                                  ? "text-red-400"
                                  : "text-zinc-700"
                          }`}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <p
                      className={`mt-1 text-[10px] leading-5 ${
                        stage.status === "pending"
                          ? "text-zinc-800"
                          : "text-zinc-600"
                      }`}
                    >
                      {stage.description}
                    </p>

                    {stage.status === "running" && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "68%" }}
                            transition={{
                              duration: 1.2,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full bg-indigo-400/60"
                          />
                        </div>

                        <span className="text-[9px] text-zinc-700">
                          processing
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
        <Clock3 className="h-3 w-3 text-zinc-700" />

        <span className="text-[10px] text-zinc-700">
          Execution state updates as the agent progresses
        </span>
      </div>
    </section>
  );
}