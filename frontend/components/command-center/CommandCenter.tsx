"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  Command,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  commandCenterMetrics,
} from "@/lib/command-center-data";

import { AgentActivity } from "./AgentActivity";
import { ITWorldState } from "./ITWorldState";
import { MetricCard } from "./MetricCard";
import { RecentTickets } from "./RecentTickets";

export function CommandCenter() {
  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1600px] px-6 py-7 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="status-live text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Operations
                </span>

                <span className="text-zinc-800">/</span>

                <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-700">
                  Command Center
                </span>
              </div>

              <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.035em] text-zinc-100">
                Autonomous IT
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-500">
                Monitor agent activity, IT state, ticket operations and
                autonomous decision-making from one operational workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-[11px] font-medium text-zinc-400 transition-all hover:border-white/[0.13] hover:bg-white/[0.045] hover:text-zinc-200"
              >
                <Activity className="h-3.5 w-3.5" />
                Live activity
              </button>

              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-3 text-[11px] font-semibold text-zinc-900 transition-all hover:bg-white"
              >
                <Play className="h-3 w-3 fill-current" />
                New request
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {commandCenterMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              direction={metric.direction}
            />
          ))}
        </motion.div>

        {/* Agent command strip */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-3 overflow-hidden rounded-xl border border-indigo-400/[0.12] bg-indigo-400/[0.035]"
        >
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/[0.15] bg-indigo-400/[0.06]">
                <Bot className="h-4 w-4 text-indigo-300" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-zinc-200">
                    Autonomous agent
                  </span>

                  <span className="rounded-full border border-emerald-400/[0.15] bg-emerald-400/[0.05] px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                    READY
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-zinc-600">
                  Understand · Retrieve · Reason · Control · Execute · Verify
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-[10px] text-zinc-600">
                  Policy enforcement active
                </span>
              </div>

              <div className="hidden h-4 w-px bg-white/[0.07] sm:block" />

              <button
                type="button"
                className="group flex items-center gap-2 text-[11px] font-medium text-indigo-300 transition-colors hover:text-indigo-200"
              >
                Open agent workspace
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Main operational grid */}
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <AgentActivity />
          <ITWorldState />
        </div>

        {/* Tickets */}
        <div className="mt-3">
          <RecentTickets />
        </div>

        {/* Architecture signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex flex-col gap-3 border-t border-white/[0.05] pt-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5 text-zinc-700" />

            <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-700">
              Autonomous IT Operations
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Agent reasoning
            </span>

            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Policy controlled
            </span>

            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Verified execution
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}