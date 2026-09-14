"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Ban,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Cpu,
  GitBranch,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type ToolDecision = "allowed" | "approval_required" | "blocked";
type ToolStatus = "ready" | "restricted" | "disabled";

type Tool = {
  id: string;
  name: string;
  description: string;
  category: string;
  decision: ToolDecision;
  status: ToolStatus;
  risk: "low" | "medium" | "high";
  endpoint: string;
  input: string;
  output: string;
  lastExecution: string;
};

const tools: Tool[] = [
  {
    id: "get_vpn_status",
    name: "Get VPN Status",
    description:
      "Reads the current VPN client and gateway state without changing the environment.",
    category: "Observation",
    decision: "allowed",
    status: "ready",
    risk: "low",
    endpoint: "it.vpn.get_status",
    input: "{ endpoint_id }",
    output: "{ status, gateway, client }",
    lastExecution: "2 min ago",
  },
  {
    id: "restart_vpn_client",
    name: "Restart VPN Client",
    description:
      "Performs a controlled restart of the managed VPN client.",
    category: "Remediation",
    decision: "allowed",
    status: "ready",
    risk: "low",
    endpoint: "it.vpn.restart_client",
    input: "{ endpoint_id }",
    output: "{ success, connection_state }",
    lastExecution: "6 min ago",
  },
  {
    id: "reset_password",
    name: "Reset Password",
    description:
      "Executes the approved Level-1 password reset workflow.",
    category: "Identity",
    decision: "allowed",
    status: "ready",
    risk: "low",
    endpoint: "identity.password.reset",
    input: "{ user_id }",
    output: "{ success, reset_id }",
    lastExecution: "18 min ago",
  },
  {
    id: "install_software",
    name: "Install Software",
    description:
      "Installs approved software packages on managed endpoints.",
    category: "Endpoint",
    decision: "approval_required",
    status: "restricted",
    risk: "medium",
    endpoint: "endpoint.software.install",
    input: "{ endpoint_id, package }",
    output: "{ success, installation_id }",
    lastExecution: "1 hr ago",
  },
  {
    id: "grant_access",
    name: "Grant Access",
    description:
      "Changes permissions for protected resources and privileged services.",
    category: "Access",
    decision: "blocked",
    status: "disabled",
    risk: "high",
    endpoint: "iam.access.grant",
    input: "{ user_id, resource, role }",
    output: "{ success, access_id }",
    lastExecution: "Never",
  },
];

const executionHistory = [
  {
    time: "14:02:31",
    tool: "restart_vpn_client",
    ticket: "INC-1042",
    result: "success",
    duration: "1.24s",
    message: "VPN client restarted successfully.",
  },
  {
    time: "13:58:12",
    tool: "get_vpn_status",
    ticket: "INC-1042",
    result: "success",
    duration: "0.31s",
    message: "Gateway reachable; client reported degraded state.",
  },
  {
    time: "13:52:47",
    tool: "reset_password",
    ticket: "INC-1041",
    result: "success",
    duration: "0.84s",
    message: "Password reset completed and authentication verified.",
  },
  {
    time: "13:46:09",
    tool: "install_software",
    ticket: "INC-1040",
    result: "approval",
    duration: "0.08s",
    message: "Execution stopped because authorization is required.",
  },
  {
    time: "13:41:33",
    tool: "grant_access",
    ticket: "INC-1039",
    result: "blocked",
    duration: "0.04s",
    message: "Execution blocked by policy boundary.",
  },
];

const categories = [
  "All",
  "Observation",
  "Remediation",
  "Identity",
  "Endpoint",
  "Access",
];

export default function ToolsPage() {
  const [selectedId, setSelectedId] = useState("restart_vpn_client");
  const [category, setCategory] = useState("All");
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(
    null,
  );

  const filteredTools = useMemo(() => {
    if (category === "All") {
      return tools;
    }

    return tools.filter((tool) => tool.category === category);
  }, [category]);

  const selectedTool =
    tools.find((tool) => tool.id === selectedId) ??
    filteredTools[0] ??
    tools[0];

  const readyCount = tools.filter(
    (tool) => tool.status === "ready",
  ).length;

  const restrictedCount = tools.filter(
    (tool) => tool.status === "restricted",
  ).length;

  const blockedCount = tools.filter(
    (tool) => tool.decision === "blocked",
  ).length;

  const selectCategory = (value: string) => {
    setCategory(value);
    setExecutionResult(null);

    const matchingTools =
      value === "All"
        ? tools
        : tools.filter((tool) => tool.category === value);

    if (
      matchingTools.length > 0 &&
      !matchingTools.some((tool) => tool.id === selectedId)
    ) {
      setSelectedId(matchingTools[0].id);
    }
  };

  const selectTool = (toolId: string) => {
    setSelectedId(toolId);
    setExecutionResult(null);
  };

  const executeTool = () => {
    if (executing || selectedTool.decision !== "allowed") {
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    window.setTimeout(() => {
      setExecuting(false);
      setExecutionResult(
        `${selectedTool.name} completed successfully through the controlled gateway.`,
      );
    }, 1100);
  };

  return (
    <div className="min-h-full bg-[#060708] text-zinc-200">
      {/* HEADER */}
      <div className="border-b border-white/[0.06] px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/[0.1] bg-violet-300/[0.025]">
                  <Wrench className="h-3.5 w-3.5 text-violet-200/70" />
                </span>

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Execution / Controlled Tool Gateway
                </span>
              </div>

              <h1 className="text-[25px] font-medium tracking-[-0.03em] text-zinc-100">
                Tool Center
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-zinc-600">
                Controlled interfaces through which the autonomous agent can
                observe or change the IT environment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.018] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[9px] text-zinc-500">
                  Tool gateway online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6 lg:px-8">
        {/* METRICS */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] md:grid-cols-4">
          <ToolMetric
            icon={Wrench}
            value={String(tools.length)}
            label="Registered tools"
            detail="Controlled interfaces"
          />

          <ToolMetric
            icon={Check}
            value={String(readyCount)}
            label="Ready"
            detail="Available for execution"
          />

          <ToolMetric
            icon={LockKeyhole}
            value={String(restrictedCount)}
            label="Restricted"
            detail="Authorization boundary"
          />

          <ToolMetric
            icon={Ban}
            value={String(blockedCount)}
            label="Blocked"
            detail="Unavailable actions"
          />
        </div>

        {/* GATEWAY FLOW */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5 text-zinc-600" />

              <p className="text-[10px] font-medium text-zinc-400">
                Controlled execution path
              </p>
            </div>

            <p className="mt-1 text-[8px] text-zinc-700">
              Tools are reachable only after planning and policy evaluation.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-6">
            <GatewayStep
              number="01"
              title="Plan"
              description="Agent creates a candidate action."
              icon={Zap}
            />

            <GatewayStep
              number="02"
              title="Policy"
              description="Authorization and risk are evaluated."
              icon={ShieldCheck}
            />

            <GatewayStep
              number="03"
              title="Gateway"
              description="Approved calls enter the controlled interface."
              icon={LockKeyhole}
            />

            <GatewayStep
              number="04"
              title="Execute"
              description="Tool performs the permitted operation."
              icon={Play}
            />

            <GatewayStep
              number="05"
              title="Observe"
              description="Resulting IT state is collected."
              icon={Activity}
            />

            <GatewayStep
              number="06"
              title="Verify"
              description="Expected and observed state are compared."
              icon={Check}
            />
          </div>
        </section>

        {/* TOOL WORKSPACE */}
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          {/* TOOL LIST */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-zinc-400">
                    Tool registry
                  </p>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    {filteredTools.length} tools in current view
                  </p>
                </div>

                <Code2 className="h-3.5 w-3.5 text-zinc-700" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectCategory(item)}
                    className={`rounded-md border px-2.5 py-1.5 text-[8px] transition ${
                      category === item
                        ? "border-indigo-300/[0.12] bg-indigo-300/[0.04] text-indigo-200/70"
                        : "border-white/[0.05] bg-white/[0.012] text-zinc-700 hover:text-zinc-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {filteredTools.map((tool, index) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  index={index}
                  selected={selectedId === tool.id}
                  onClick={() => selectTool(tool.id)}
                />
              ))}

              {filteredTools.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <Wrench className="mx-auto h-4 w-4 text-zinc-800" />

                  <p className="mt-3 text-[9px] text-zinc-600">
                    No tools in this category.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* TOOL DETAIL */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
                  <Terminal className="h-3.5 w-3.5 text-zinc-600" />
                </div>

                <div>
                  <p className="text-[10px] font-medium text-zinc-400">
                    Tool interface
                  </p>

                  <p className="mt-1 font-mono text-[7px] text-zinc-700">
                    {selectedTool.id}
                  </p>
                </div>
              </div>

              <ToolStatusBadge status={selectedTool.status} />
            </div>

            <div className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <p className="text-[15px] font-medium tracking-[-0.02em] text-zinc-300">
                    {selectedTool.name}
                  </p>

                  <p className="mt-2 max-w-xl text-[9px] leading-5 text-zinc-600">
                    {selectedTool.description}
                  </p>
                </div>

                <DecisionBadge decision={selectedTool.decision} />
              </div>

              {/* GATEWAY TARGET */}
              <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/15 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-700">
                    Gateway endpoint
                  </p>

                  <Cpu className="h-3 w-3 text-zinc-800" />
                </div>

                <p className="mt-2 font-mono text-[10px] text-zinc-500">
                  {selectedTool.endpoint}
                </p>
              </div>

              {/* SCHEMA */}
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <SchemaBox
                  title="Input schema"
                  value={selectedTool.input}
                />

                <SchemaBox
                  title="Output schema"
                  value={selectedTool.output}
                />
              </div>

              {/* ATTRIBUTES */}
              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                <ToolAttribute
                  label="Category"
                  value={selectedTool.category}
                />

                <ToolAttribute
                  label="Risk"
                  value={selectedTool.risk.toUpperCase()}
                />

                <ToolAttribute
                  label="Authorization"
                  value={
                    selectedTool.decision === "allowed"
                      ? "Allowed"
                      : selectedTool.decision === "approval_required"
                        ? "Required"
                        : "Blocked"
                  }
                />

                <ToolAttribute
                  label="Last execution"
                  value={selectedTool.lastExecution}
                />
              </div>

              {/* EXECUTE */}
              <button
                type="button"
                onClick={executeTool}
                disabled={
                  executing || selectedTool.decision !== "allowed"
                }
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-300/[0.11] bg-indigo-300/[0.035] text-[8px] font-medium text-indigo-200/70 transition hover:bg-indigo-300/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {executing ? (
                  <>
                    <RotateCcw className="h-3 w-3 animate-spin" />
                    Executing through gateway...
                  </>
                ) : selectedTool.decision === "approval_required" ? (
                  <>
                    <LockKeyhole className="h-3 w-3" />
                    Approval required before execution
                  </>
                ) : selectedTool.decision === "blocked" ? (
                  <>
                    <Ban className="h-3 w-3" />
                    Tool blocked by policy
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Execute controlled tool
                  </>
                )}
              </button>

              {executionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-300/[0.08] bg-emerald-300/[0.018] p-3"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300/60" />

                  <p className="text-[8px] leading-5 text-emerald-300/60">
                    {executionResult}
                  </p>
                </motion.div>
              )}
            </div>
          </section>
        </div>

        {/* EXECUTION HISTORY */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-zinc-600" />

                <p className="text-[10px] font-medium text-zinc-400">
                  Execution history
                </p>
              </div>

              <p className="mt-1 text-[8px] text-zinc-700">
                Recent calls passing through the controlled gateway.
              </p>
            </div>

            <Clock3 className="h-3.5 w-3.5 text-zinc-700" />
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[0.65fr_1.25fr_0.7fr_0.7fr_0.65fr_2fr] border-b border-white/[0.05] px-5 py-3 text-[7px] uppercase tracking-[0.1em] text-zinc-800">
                <span>Time</span>
                <span>Tool</span>
                <span>Ticket</span>
                <span>Result</span>
                <span>Duration</span>
                <span>Gateway message</span>
              </div>

              {executionHistory.map((entry) => (
                <div
                  key={`${entry.time}-${entry.tool}`}
                  className="grid grid-cols-[0.65fr_1.25fr_0.7fr_0.7fr_0.65fr_2fr] items-center border-b border-white/[0.04] px-5 py-3.5 last:border-b-0"
                >
                  <span className="font-mono text-[7px] text-zinc-700">
                    {entry.time}
                  </span>

                  <span className="font-mono text-[8px] text-zinc-500">
                    {entry.tool}()
                  </span>

                  <span className="font-mono text-[7px] text-zinc-600">
                    {entry.ticket}
                  </span>

                  <ExecutionResultBadge result={entry.result} />

                  <span className="font-mono text-[7px] text-zinc-700">
                    {entry.duration}
                  </span>

                  <span className="text-[8px] text-zinc-700">
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SAFETY BOUNDARY */}
        <section className="rounded-xl border border-white/[0.06] bg-[#090b0d] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />

            <div>
              <p className="text-[9px] font-medium text-zinc-500">
                Controlled execution principle
              </p>

              <p className="mt-1 text-[8px] leading-5 text-zinc-700">
                The language model never receives unrestricted access to the
                environment. Tool calls are explicit, policy-gated,
                auditable and followed by observation and verification.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.05] pt-5 text-[8px] text-zinc-700 sm:flex-row">
          <div className="flex items-center gap-2">
            <Wrench className="h-3 w-3" />
            Controlled tools convert approved agent decisions into bounded
            operations.
          </div>

          <div className="flex items-center gap-2">
            <span>Policy</span>
            <span>→</span>
            <span>Gateway</span>
            <span>→</span>
            <span>Execute</span>
            <span>→</span>
            <span>Verify</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolMetric({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: typeof Wrench;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="bg-[#0b0d0f] px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.018]">
          <Icon className="h-3 w-3 text-zinc-600" />
        </div>

        <span className="font-mono text-[8px] text-zinc-700">
          gateway
        </span>
      </div>

      <p className="mt-4 text-[21px] font-medium tracking-[-0.03em] text-zinc-200">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-0.5 text-[8px] text-zinc-700">
        {detail}
      </p>
    </div>
  );
}

function GatewayStep({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: typeof Zap;
}) {
  return (
    <div className="bg-[#090b0d] p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-3 w-3 text-zinc-600" />
        </div>

        <span className="font-mono text-[8px] text-zinc-800">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[9px] font-medium text-zinc-400">
        {title}
      </p>

      <p className="mt-2 text-[8px] leading-5 text-zinc-700">
        {description}
      </p>
    </div>
  );
}

function ToolRow({
  tool,
  index,
  selected,
  onClick,
}: {
  tool: Tool;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.025 }}
      onClick={onClick}
      className={`w-full px-5 py-4 text-left transition ${
        selected
          ? "bg-indigo-300/[0.025]"
          : "hover:bg-white/[0.018]"
      }`}
    >
      <div className="flex items-start gap-3">
        <ToolIcon status={tool.status} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate font-mono text-[9px] font-medium text-zinc-400">
              {tool.id}()
            </p>

            <DecisionBadge
              decision={tool.decision}
              compact
            />
          </div>

          <p className="mt-1.5 text-[8px] leading-5 text-zinc-700">
            {tool.description}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[7px] text-zinc-600">
              {tool.category}
            </span>

            <span className="text-zinc-800">•</span>

            <span className="text-[7px] text-zinc-700">
              {tool.risk} risk
            </span>

            <ChevronRight className="ml-auto h-2.5 w-2.5 text-zinc-800" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function ToolIcon({ status }: { status: ToolStatus }) {
  const config = {
    ready: {
      icon: Check,
      classes:
        "border-emerald-300/[0.08] bg-emerald-300/[0.018] text-emerald-300/60",
    },
    restricted: {
      icon: LockKeyhole,
      classes:
        "border-amber-300/[0.08] bg-amber-300/[0.018] text-amber-300/60",
    },
    disabled: {
      icon: Ban,
      classes:
        "border-red-300/[0.08] bg-red-300/[0.018] text-red-300/60",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${config.classes}`}
    >
      <Icon className="h-3 w-3" />
    </div>
  );
}

function ToolStatusBadge({ status }: { status: ToolStatus }) {
  const config = {
    ready: {
      label: "Ready",
      dot: "bg-emerald-400",
      border: "border-emerald-300/[0.08]",
      background: "bg-emerald-300/[0.018]",
      text: "text-emerald-300/70",
    },
    restricted: {
      label: "Restricted",
      dot: "bg-amber-400",
      border: "border-amber-300/[0.08]",
      background: "bg-amber-300/[0.018]",
      text: "text-amber-300/70",
    },
    disabled: {
      label: "Disabled",
      dot: "bg-red-400",
      border: "border-red-300/[0.08]",
      background: "bg-red-300/[0.018]",
      text: "text-red-300/70",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.border} ${config.background} px-2.5 py-1.5`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      <span className={`text-[7px] font-medium ${config.text}`}>
        {config.label}
      </span>
    </span>
  );
}

function DecisionBadge({
  decision,
  compact = false,
}: {
  decision: ToolDecision;
  compact?: boolean;
}) {
  const config = {
    allowed: {
      label: "Allowed",
      dot: "bg-emerald-400",
      border: "border-emerald-300/[0.08]",
      background: "bg-emerald-300/[0.018]",
      text: "text-emerald-300/70",
    },
    approval_required: {
      label: "Approval Required",
      dot: "bg-amber-400",
      border: "border-amber-300/[0.08]",
      background: "bg-amber-300/[0.018]",
      text: "text-amber-300/70",
    },
    blocked: {
      label: "Blocked",
      dot: "bg-red-400",
      border: "border-red-300/[0.08]",
      background: "bg-red-300/[0.018]",
      text: "text-red-300/70",
    },
  }[decision];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.border} ${config.background} ${
        compact ? "px-2 py-1" : "px-2.5 py-1.5"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      <span className={`text-[7px] font-medium ${config.text}`}>
        {config.label}
      </span>
    </span>
  );
}

function SchemaBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.012] p-3">
      <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-700">
        {title}
      </p>

      <p className="mt-2 font-mono text-[8px] text-zinc-500">
        {value}
      </p>
    </div>
  );
}

function ToolAttribute({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.012] p-3">
      <p className="text-[7px] uppercase tracking-[0.09em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 truncate text-[8px] text-zinc-500">
        {value}
      </p>
    </div>
  );
}

function ExecutionResultBadge({
  result,
}: {
  result: string;
}) {
  if (result === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[7px] text-emerald-300/60">
        <Check className="h-2.5 w-2.5" />
        Success
      </span>
    );
  }

  if (result === "approval") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[7px] text-amber-300/60">
        <LockKeyhole className="h-2.5 w-2.5" />
        Approval
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[7px] text-red-300/60">
      <XCircle className="h-2.5 w-2.5" />
      Blocked
    </span>
  );
}