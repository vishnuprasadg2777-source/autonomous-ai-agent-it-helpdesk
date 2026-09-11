"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { policyDecision } from "@/lib/agent-data";

export function PolicyDecision() {
  const isPending = policyDecision.decision === "Pending";

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />

            <span className="text-[12px] font-medium text-zinc-300">
              Policy decision
            </span>
          </div>

          <p className="mt-1 text-[11px] text-zinc-600">
            Authorization and risk control
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
            isPending
              ? "border-amber-400/[0.12] bg-amber-400/[0.04] text-amber-400"
              : "border-emerald-400/[0.12] bg-emerald-400/[0.04] text-emerald-400"
          }`}
        >
          {isPending ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}

          <span className="text-[9px] font-medium uppercase tracking-[0.1em]">
            {policyDecision.decision}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-lg border border-white/[0.05] bg-black/20">
          <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
            <div className="p-3">
              <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Candidate action
              </span>

              <div className="mt-2 flex items-center gap-2">
                <LockKeyhole className="h-3 w-3 text-zinc-600" />

                <span className="font-mono text-[10px] text-zinc-300">
                  {policyDecision.action}
                </span>
              </div>
            </div>

            <div className="p-3">
              <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Risk level
              </span>

              <div className="mt-2">
                <span className="text-[10px] text-emerald-400">
                  {policyDecision.risk}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Authorization
              </span>

              <span className="text-[10px] text-amber-400">
                {policyDecision.authorization}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-3 rounded-lg border border-amber-400/[0.08] bg-amber-400/[0.025] p-3"
        >
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />

            <div>
              <span className="text-[10px] font-medium text-amber-300">
                Policy evaluation required
              </span>

              <p className="mt-1 text-[10px] leading-5 text-zinc-600">
                {policyDecision.reason}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
        <ShieldCheck className="h-3 w-3 text-zinc-700" />

        <span className="text-[10px] text-zinc-700">
          Controlled actions require authorization before execution
        </span>
      </div>
    </section>
  );
}