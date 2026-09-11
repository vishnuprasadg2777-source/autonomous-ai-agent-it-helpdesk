"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Server,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import { itServices } from "@/lib/command-center-data";

const statusStyles = {
  operational: {
    label: "Operational",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  degraded: {
    label: "Degraded",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  offline: {
    label: "Offline",
    text: "text-red-400",
    dot: "bg-red-400",
  },
} as const;

function ServiceIcon({ id }: { id: string }) {
  if (id === "vpn-gateway") {
    return <Wifi className="h-4 w-4" />;
  }

  if (id === "identity-service") {
    return <ShieldCheck className="h-4 w-4" />;
  }

  return <Server className="h-4 w-4" />;
}

export function ITWorldState() {
  const operationalCount = itServices.filter(
    (service) => service.status === "operational",
  ).length;

  const healthPercentage = Math.round(
    (operationalCount / itServices.length) * 100,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-500" />

            <span className="text-[12px] font-medium text-zinc-300">
              IT World
            </span>

            <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
              State model
            </span>
          </div>

          <p className="mt-1 text-[11px] text-zinc-600">
            Environment observed by the autonomous agent
          </p>
        </div>

        <div className="text-right">
          <div className="text-[14px] font-medium tracking-tight text-zinc-300">
            {healthPercentage}%
          </div>

          <div className="text-[9px] uppercase tracking-[0.1em] text-zinc-700">
            health
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Environment state */}
        <div className="rounded-lg border border-white/[0.05] bg-black/20">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <div>
              <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-700">
                Environment
              </span>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-[12px] font-medium text-zinc-300">
                  Production
                </span>

                <span className="h-1 w-1 rounded-full bg-zinc-700" />

                <span className="text-[10px] text-zinc-600">
                  Current state
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/[0.1] bg-emerald-400/[0.035] px-2 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <span className="text-[9px] font-medium text-emerald-400">
                Observed
              </span>
            </div>
          </div>

          {/* Services */}
          <div className="p-2">
            {itServices.map((service, index) => {
              const status = statusStyles[service.status];

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                  className="group flex items-center gap-3 rounded-lg px-2.5 py-3 transition-colors duration-200 hover:bg-white/[0.025]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.018] text-zinc-600">
                    <ServiceIcon id={service.id} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[11px] font-medium text-zinc-300">
                        {service.name}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[9px] text-zinc-700">
                        {service.type}
                      </span>

                      <span className="text-zinc-800">·</span>

                      <span className="text-[9px] text-zinc-600">
                        {service.detail}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />

                    <span className={`text-[9px] ${status.text}`}>
                      {status.label}
                    </span>
                  </div>

                  <ChevronRight className="h-3 w-3 text-zinc-800 transition-colors group-hover:text-zinc-600" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* State observation */}
        <div className="mt-3 rounded-lg border border-indigo-400/[0.08] bg-indigo-400/[0.025] p-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-indigo-400/[0.1] bg-indigo-400/[0.04]">
              <Activity className="h-3 w-3 text-indigo-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-indigo-200">
                  Agent observation
                </span>

                <span className="h-1 w-1 animate-pulse rounded-full bg-indigo-300" />
              </div>

              <p className="mt-1 text-[9px] leading-5 text-zinc-600">
                The current environment state is being evaluated before the
                agent selects a remediation action.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />

          <span className="text-[10px] text-zinc-600">
            State model synchronized
          </span>
        </div>

        <span className="font-mono text-[9px] text-zinc-700">
          WORLD.STATE
        </span>
      </div>
    </section>
  );
}