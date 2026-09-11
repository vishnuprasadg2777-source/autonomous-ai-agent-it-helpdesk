"use client";

import { motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  Paperclip,
  UserRound,
} from "lucide-react";

import { currentAgentRequest } from "@/lib/agent-data";

export function AgentConversation() {
  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-400/[0.12] bg-indigo-400/[0.04]">
            <Bot className="h-4 w-4 text-indigo-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-zinc-300">
                IT Operations Agent
              </span>

              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/[0.1] bg-emerald-400/[0.035] px-2 py-0.5 text-[8px] font-medium text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                ACTIVE
              </span>
            </div>

            <p className="mt-0.5 text-[10px] text-zinc-700">
              Controlled autonomous mode
            </p>
          </div>
        </div>

        <span className="font-mono text-[9px] text-zinc-700">
          {currentAgentRequest.ticketId}
        </span>
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {/* User message */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025]">
            <UserRound className="h-3.5 w-3.5 text-zinc-600" />
          </div>

          <div className="min-w-0 max-w-[85%]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-500">
                {currentAgentRequest.requester}
              </span>

              <span className="text-[9px] text-zinc-800">
                Just now
              </span>
            </div>

            <div className="mt-2 rounded-xl rounded-tl-sm border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <p className="text-[12px] leading-6 text-zinc-300">
                {currentAgentRequest.request}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Agent response */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex gap-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-400/[0.12] bg-indigo-400/[0.04]">
            <Bot className="h-3.5 w-3.5 text-indigo-300" />
          </div>

          <div className="min-w-0 max-w-[90%]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-indigo-200">
                IT Operations Agent
              </span>

              <span className="text-[9px] text-zinc-800">
                Processing
              </span>
            </div>

            <div className="mt-2 rounded-xl rounded-tl-sm border border-indigo-400/[0.08] bg-indigo-400/[0.025] px-4 py-3">
              <p className="text-[12px] leading-6 text-zinc-400">
                I’ll investigate the VPN connection using the available
                knowledge and current IT state. I’ll only execute an approved
                action through the controlled tool gateway and will verify the
                resulting state before marking the request resolved.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-md border border-white/[0.05] bg-black/20 px-2.5 py-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] text-zinc-600">
                    Request understood
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-white/[0.05] bg-black/20 px-2.5 py-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] text-zinc-600">
                    Knowledge retrieved
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-indigo-400/[0.08] bg-indigo-400/[0.025] px-2.5 py-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300" />
                  <span className="text-[9px] text-indigo-200">
                    Observing state
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-xl border border-white/[0.07] bg-black/20">
          <div className="px-4 py-3">
            <textarea
              placeholder="Ask the agent about this request..."
              rows={2}
              className="w-full resize-none bg-transparent text-[11px] leading-5 text-zinc-300 outline-none placeholder:text-zinc-700"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.05] px-3 py-2">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900 transition hover:bg-white"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-[9px] text-zinc-800">
          Agent actions are controlled by authorization and policy rules.
        </p>
      </div>
    </section>
  );
}