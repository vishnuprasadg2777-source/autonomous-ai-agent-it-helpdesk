"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GitCompareArrows,
  Server,
} from "lucide-react";

export function StateTransition() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-3.5 w-3.5 text-zinc-500" />

            <span className="text-[12px] font-medium text-zinc-300">
              State transition
            </span>
          </div>

          <p className="mt-1 text-[11px] text-zinc-600">
            Expected versus observed IT state
          </p>
        </div>

        <span className="font-mono text-[9px] text-zinc-700">
          WORLD.MODEL
        </span>
      </div>

      <div className="p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          {/* Current state */}
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg border border-white/[0.06] bg-black/20 p-4"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-zinc-600" />

              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-700">
                Observed state
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/[0.1] bg-amber-400/[0.035]">
                <Server className="h-4 w-4 text-amber-400" />
              </div>

              <div>
                <span className="text-[12px] font-medium text-zinc-300">
                  VPN
                </span>

                <p className="mt-0.5 text-[10px] text-amber-400">
                  Connection unavailable
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-white/[0.045] bg-white/[0.015] px-2.5 py-2">
              <span className="font-mono text-[9px] text-zinc-600">
                vpn.connected = false
              </span>
            </div>
          </motion.div>

          {/* Transition */}
          <div className="flex items-center justify-center py-1 md:px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025]">
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
            </div>
          </div>

          {/* Expected state */}
          <motion.div
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg border border-emerald-400/[0.08] bg-emerald-400/[0.018] p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />

              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-700">
                Target state
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/[0.1] bg-emerald-400/[0.035]">
                <Server className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <span className="text-[12px] font-medium text-zinc-300">
                  VPN
                </span>

                <p className="mt-0.5 text-[10px] text-emerald-400">
                  Connection restored
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-emerald-400/[0.06] bg-emerald-400/[0.018] px-2.5 py-2">
              <span className="font-mono text-[9px] text-zinc-600">
                vpn.connected = true
              </span>
            </div>
          </motion.div>
        </div>

        {/* Verification logic */}
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-indigo-400/[0.08] bg-indigo-400/[0.025] px-3 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-indigo-400/[0.1] bg-indigo-400/[0.04]">
            <GitCompareArrows className="h-3.5 w-3.5 text-indigo-300" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-medium text-indigo-200">
              Verification rule
            </span>

            <p className="mt-0.5 text-[9px] leading-5 text-zinc-600">
              Compare the observed VPN state against the expected post-action
              state before declaring the request resolved.
            </p>
          </div>

          <span className="hidden shrink-0 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 font-mono text-[8px] text-zinc-600 sm:block">
            VERIFY()
          </span>
        </div>
      </div>
    </section>
  );
}