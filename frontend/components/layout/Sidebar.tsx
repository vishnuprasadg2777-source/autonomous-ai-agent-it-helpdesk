"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Command,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import {
  environmentNavigation,
  operationsNavigation,
  primaryNavigation,
} from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{
        width: collapsed ? 72 : 258,
      }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative z-30 flex h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#08090b]"
    >
      {/* BRAND */}
      <div className="flex h-[76px] shrink-0 items-center border-b border-white/[0.06] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-indigo-300/[0.16] bg-indigo-400/[0.07]"
          >
            <Command className="h-[17px] w-[17px] text-indigo-200" />

            <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.65)]" />
          </motion.div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0"
            >
              <div className="truncate text-[12px] font-semibold tracking-[-0.01em] text-zinc-100">
                PHOENIX
              </div>

              <div className="mt-[2px] truncate text-[8px] font-medium uppercase tracking-[0.17em] text-zinc-600">
                IT Helpdesk
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ENVIRONMENT */}
      {!collapsed && (
        <div className="px-4 pt-4">
          {environmentNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="block"
              >
                <motion.div
                  whileHover={{ x: active ? 0 : 1 }}
                  transition={{ duration: 0.15 }}
                  className={`group flex h-10 w-full items-center justify-between rounded-lg border px-3 transition-colors ${
                    active
                      ? "border-emerald-300/[0.09] bg-emerald-300/[0.025]"
                      : "border-white/[0.06] bg-white/[0.025] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${
                        active
                          ? "bg-emerald-300/[0.05]"
                          : "bg-white/[0.05]"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          active
                            ? "text-emerald-300/60"
                            : "text-zinc-400"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`truncate text-[11px] font-medium ${
                          active
                            ? "text-emerald-200/70"
                            : "text-zinc-300"
                        }`}
                      >
                        {item.label}
                      </div>

                      <div className="text-[9px] text-zinc-700">
                        IT environment
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-3.5 w-3.5 ${
                      active
                        ? "text-emerald-300/40"
                        : "text-zinc-700"
                    }`}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            Workspace
          </div>
        )}

        <nav className="space-y-0.5">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="relative block"
              >
                <motion.div
                  whileHover={{ x: active ? 0 : 1 }}
                  transition={{ duration: 0.15 }}
                  className={`group flex h-10 items-center gap-3 rounded-lg px-3 transition-colors ${
                    active
                      ? "bg-white/[0.075] text-zinc-100"
                      : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-navigation"
                      className="absolute left-0 h-5 w-[2px] rounded-r-full bg-indigo-300"
                    />
                  )}

                  <Icon
                    className={`h-[16px] w-[16px] shrink-0 transition-colors ${
                      active
                        ? "text-indigo-200"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                    strokeWidth={1.7}
                  />

                  {!collapsed && (
                    <span className="truncate text-[12px] font-medium">
                      {item.label}
                    </span>
                  )}

                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_7px_rgba(165,180,252,0.5)]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mb-2 mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            Operations
          </div>
        )}

        <nav className="space-y-0.5">
          {operationsNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="relative block"
              >
                <motion.div
                  whileHover={{ x: active ? 0 : 1 }}
                  transition={{ duration: 0.15 }}
                  className={`group flex h-10 items-center gap-3 rounded-lg px-3 transition-colors ${
                    active
                      ? "bg-white/[0.075] text-zinc-100"
                      : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-operations-navigation"
                      className="absolute left-0 h-5 w-[2px] rounded-r-full bg-indigo-300"
                    />
                  )}

                  <Icon
                    className={`h-[16px] w-[16px] shrink-0 transition-colors ${
                      active
                        ? "text-indigo-200"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                    strokeWidth={1.7}
                  />

                  {!collapsed && (
                    <span className="truncate text-[12px] font-medium">
                      {item.label}
                    </span>
                  )}

                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_7px_rgba(165,180,252,0.5)]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* PRODUCTION — COLLAPSED */}
        {collapsed && (
          <nav className="mt-3 space-y-0.5">
            {environmentNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className="relative block"
                >
                  <motion.div
                    whileHover={{ x: active ? 0 : 1 }}
                    transition={{ duration: 0.15 }}
                    className={`group flex h-10 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? "bg-white/[0.075]"
                        : "hover:bg-white/[0.035]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-environment-navigation"
                        className="absolute left-0 h-5 w-[2px] rounded-r-full bg-emerald-300"
                      />
                    )}

                    <Icon
                      className={`h-[16px] w-[16px] ${
                        active
                          ? "text-emerald-200"
                          : "text-zinc-600 group-hover:text-zinc-400"
                      }`}
                      strokeWidth={1.7}
                    />
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* SYSTEM STATUS */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[10px] font-medium text-zinc-400">
                  All systems operational
                </span>
              </div>

              <ShieldCheck className="h-3.5 w-3.5 text-zinc-700" />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[9px]">
              <span className="text-zinc-700">
                Agent infrastructure
              </span>

              <span className="text-emerald-500/80">
                100%
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-1">
          <button
            type="button"
            className="flex h-9 flex-1 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
            title="Settings"
          >
            <Settings className="h-[15px] w-[15px]" />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-9 flex-1 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight className="h-[15px] w-[15px]" />
            ) : (
              <ChevronLeft className="h-[15px] w-[15px]" />
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}