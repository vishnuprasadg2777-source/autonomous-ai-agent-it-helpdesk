"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleSlash2,
  Clock3,
  GitBranch,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import { toolExecutions } from "@/lib/agent-data";

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-emerald-400",
  },
  running: {
    label: "Running",
    icon: Loader2,
    className: "text-indigo-300",
  },
  blocked: {
    label: "Blocked",
    icon: CircleSlash2,
    className: "text-red-400",
  },
} as const;

export function ToolExecution() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-zinc-500" />

            <span className="text-[12px] font-medium text-zinc-300">
              Controlled tools
            </span>
          </div>

          <p className="mt-1 text-[11px] text-zinc-600">
            Actions available through the tool gateway
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <LockKeyhole className="h-3 w-3 text-zinc-700" />
          <span className="text-[9px] uppercase tracking-[0.1em] text-zinc-700">
            Restricted
          </span>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {toolExecutions.map((tool, index) => {
          const config = statusConfig[tool.status];
          const StatusIcon = config.icon;

          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05,
              }}
              className="rounded-lg border border-white/[0.045] bg-black/20 p-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.02]">
                  <StatusIcon
                    className={`h-3.5 w-3.5 ${
                      tool.status === "running"
                        ? `${config.className} animate-spin`
                        : config.className
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] font-medium text-zinc-300">
                      {tool.name}
                    </span>

                    <span className={`text-[9px] ${config.className}`}>
                      {config.label}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] leading-5 text-zinc-600">
                    {tool.description}
                  </p>

                  {tool.result && (
                    <div className="mt-2 rounded-md border border-white/[0.045] bg-white/[0.018] px-2.5 py-2">
                      <span className="text-[9px] text-zinc-600">
                        {tool.result}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {tool.status === "running" && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px flex-1 overflow-hidden bg-white/[0.05]">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "58%" }}
                      transition={{ duration: 1 }}
                      className="h-full bg-indigo-400/60"
                    />
                  </div>

                  <span className="text-[8px] uppercase tracking-[0.08em] text-zinc-700">
                    executing
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
        <Clock3 className="h-3 w-3 text-zinc-700" />

        <span className="text-[10px] text-zinc-700">
          Tool calls are subject to policy and authorization
        </span>
      </div>
    </section>
  );
}