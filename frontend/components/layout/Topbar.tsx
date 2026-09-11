"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Command,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const searchItems = [
  {
    label: "Command Center",
    description: "AI IT operations overview",
    href: "/",
  },
  {
    label: "AI Agent",
    description: "Run and inspect autonomous agent workflows",
    href: "/agent",
  },
  {
    label: "Tickets",
    description: "Helpdesk ticket operations",
    href: "/tickets",
  },
  {
    label: "IT World",
    description: "Current environment state",
    href: "/it-world",
  },
  {
    label: "Knowledge",
    description: "Knowledge base and retrieval",
    href: "/knowledge",
  },
  {
    label: "Policies",
    description: "Authorization and risk controls",
    href: "/policies",
  },
  {
    label: "Tools",
    description: "Controlled IT tool gateway",
    href: "/tools",
  },
  {
    label: "Observatory",
    description: "Agent execution telemetry",
    href: "/observatory",
  },
  {
    label: "Audit",
    description: "Agent actions and decisions",
    href: "/audit",
  },
  {
    label: "Evaluation",
    description: "Agent evaluation and performance",
    href: "/evaluation",
  },
];

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [query, setQuery] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchItems.filter((item) => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      item.label.toLowerCase().includes(value) ||
      item.description.toLowerCase().includes(value)
    );
  });

  const openSearch = () => {
    setNotificationsOpen(false);
    setWorkspaceOpen(false);
    setSearchOpen(true);
  };

  const closeAll = () => {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setWorkspaceOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openSearch();
      }

      if (event.key === "Escape") {
        closeAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <>
      <header className="relative z-40 flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#08090b]/90 px-5 backdrop-blur-2xl lg:px-6">
        {/* LEFT — SEARCH */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={openSearch}
            className="group flex h-9 w-[340px] items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 transition-all duration-200 hover:border-white/[0.11] hover:bg-white/[0.035]"
            aria-label="Open command search"
          >
            <Search className="h-[15px] w-[15px] text-zinc-600 transition-colors group-hover:text-zinc-400" />

            <span className="flex-1 text-left text-[11px] text-zinc-600">
              Search anything...
            </span>

            <div className="flex items-center gap-1">
              <kbd className="rounded border border-white/[0.07] bg-white/[0.02] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600">
                ⌘
              </kbd>

              <kbd className="rounded border border-white/[0.07] bg-white/[0.02] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600">
                K
              </kbd>
            </div>
          </button>

          <button
            type="button"
            onClick={openSearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300 md:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {/* AGENT STATUS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mr-1 hidden items-center gap-2 rounded-full border border-emerald-400/[0.1] bg-emerald-400/[0.035] px-3 py-1.5 md:flex"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-25" />

              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-medium text-emerald-300/90">
              Agent systems operational
            </span>
          </motion.div>

          {/* AGENT ACTIVITY */}
          <Link
            href="/agent"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
            aria-label="Open agent activity"
            title="Agent activity"
          >
            <Sparkles className="h-[15px] w-[15px]" />

            <span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_7px_rgba(165,180,252,0.5)]" />
          </Link>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setWorkspaceOpen(false);
                setNotificationsOpen((value) => !value);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
              aria-label="Notifications"
              title="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-[15px] w-[15px]" />

              <span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-indigo-300" />
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-11 z-50 w-[330px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0f12] shadow-2xl shadow-black/40"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-200">
                        Notifications
                      </p>

                      <p className="mt-0.5 text-[9px] text-zinc-600">
                        Recent agent and governance events
                      </p>
                    </div>

                    <span className="rounded-full border border-indigo-300/10 bg-indigo-300/[0.05] px-2 py-1 text-[8px] text-indigo-200">
                      3 new
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.05]">
                    <Link
                      href="/tickets/INC-1042"
                      onClick={closeAll}
                      className="block px-4 py-3 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />

                        <div>
                          <p className="text-[10px] text-zinc-300">
                            Agent investigating INC-1042
                          </p>

                          <p className="mt-1 text-[9px] text-zinc-600">
                            VPN connectivity issue is currently being observed.
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/policies"
                      onClick={closeAll}
                      className="block px-4 py-3 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />

                        <div>
                          <p className="text-[10px] text-zinc-300">
                            Policy decision requires review
                          </p>

                          <p className="mt-1 text-[9px] text-zinc-600">
                            A software installation request requires
                            authorization.
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/observatory"
                      onClick={closeAll}
                      className="block px-4 py-3 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

                        <div>
                          <p className="text-[10px] text-zinc-300">
                            Verification completed
                          </p>

                          <p className="mt-1 text-[9px] text-zinc-600">
                            Agent execution telemetry is available.
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mx-1 h-5 w-px bg-white/[0.06]" />

          {/* WORKSPACE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setNotificationsOpen(false);
                setWorkspaceOpen((value) => !value);
              }}
              className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-white/[0.035]"
              aria-label="Open workspace menu"
              aria-expanded={workspaceOpen}
            >
              <div className="hidden text-right sm:block">
                <div className="text-[11px] font-medium text-zinc-300">
                  IT Operations
                </div>

                <div className="mt-[1px] text-[9px] text-zinc-700">
                  Administrator
                </div>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-300/[0.14] bg-indigo-400/[0.06]">
                <ShieldCheck
                  className="h-[15px] w-[15px] text-indigo-200"
                  strokeWidth={1.7}
                />
              </div>

              <ChevronDown
                className={`hidden h-3 w-3 text-zinc-700 transition sm:block ${
                  workspaceOpen ? "rotate-180 text-zinc-400" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {workspaceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-11 z-50 w-[240px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0f12] shadow-2xl shadow-black/40"
                >
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <p className="text-[11px] font-medium text-zinc-200">
                      IT Operations
                    </p>

                    <p className="mt-0.5 text-[9px] text-zinc-600">
                      Production environment
                    </p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/"
                      onClick={closeAll}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[10px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
                    >
                      <Command className="h-3.5 w-3.5 text-zinc-600" />
                      Command Center
                    </Link>

                    <Link
                      href="/audit"
                      onClick={closeAll}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[10px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
                      Governance & Audit
                    </Link>

                    <Link
                      href="/observatory"
                      onClick={closeAll}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[10px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-zinc-600" />
                      Agent Observatory
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* COMMAND PALETTE */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px]"
              onClick={closeAll}
            />

            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{
                duration: 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed left-1/2 top-[90px] z-[100] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0d0f12] shadow-2xl shadow-black/50"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
                <Search className="h-4 w-4 shrink-0 text-zinc-600" />

                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      closeAll();
                    }

                    if (
                      event.key === "Enter" &&
                      filteredItems.length > 0
                    ) {
                      window.location.href = filteredItems[0].href;
                    }
                  }}
                  placeholder="Search pages, operations, tickets..."
                  className="h-14 min-w-0 flex-1 bg-transparent text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={closeAll}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                  aria-label="Close search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <kbd className="hidden rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-1 font-mono text-[8px] text-zinc-600 sm:block">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[430px] overflow-y-auto p-2">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeAll}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                        index === 0 && query
                          ? "bg-white/[0.045]"
                          : "hover:bg-white/[0.035]"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <Command className="h-3.5 w-3.5 text-zinc-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium text-zinc-300">
                          {item.label}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] text-zinc-600">
                          {item.description}
                        </p>
                      </div>

                      <span className="hidden h-6 w-6 items-center justify-center rounded-md border border-white/[0.05] text-zinc-700 sm:flex">
                        →
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center">
                    <Search className="mx-auto h-5 w-5 text-zinc-700" />

                    <p className="mt-3 text-[11px] text-zinc-500">
                      No matching operations
                    </p>

                    <p className="mt-1 text-[9px] text-zinc-700">
                      Try another search term.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
                <span className="text-[8px] text-zinc-700">
                  Navigate operations
                </span>

                <div className="flex items-center gap-2 text-[8px] text-zinc-700">
                  <span>Enter</span>
                  <span>·</span>
                  <span>Esc</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}