"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  Filter,
  LockKeyhole,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  AgentRunResponse,
  PolicyDecision as AgentPolicyDecision,
} from "@/lib/api/client";

type PolicyDecision = "allowed" | "approval_required" | "blocked";
type RiskLevel = "low" | "medium" | "high";

type Policy = {
  id: string;
  action: string;
  description: string;
  decision: PolicyDecision;
  risk: RiskLevel;
  authorizationRequired: boolean;
  scope: string;
  reason: string;
  owner: string;
  updated: string;
};

const policies: Policy[] = [
  {
    id: "POL-001",
    action: "reset_password",
    description:
      "Allows controlled password reset after the request is validated.",
    decision: "allowed",
    risk: "low",
    authorizationRequired: false,
    scope: "Identity",
    reason:
      "Password reset is a permitted Level-1 remediation when the request satisfies identity requirements.",
    owner: "Identity Operations",
    updated: "18 min ago",
  },
  {
    id: "POL-002",
    action: "restart_vpn_client",
    description:
      "Allows the agent to restart the managed VPN client during connectivity troubleshooting.",
    decision: "allowed",
    risk: "low",
    authorizationRequired: false,
    scope: "Remote Access",
    reason:
      "The action is reversible, low risk and within the approved Level-1 troubleshooting workflow.",
    owner: "IT Operations",
    updated: "31 min ago",
  },
  {
    id: "POL-003",
    action: "install_software",
    description:
      "Controls installation of approved software on managed endpoints.",
    decision: "allowed",
    risk: "medium",
    authorizationRequired: false,
    scope: "Endpoint",
    reason:
      "Approved software installation is permitted within the controlled Level-1 endpoint workflow.",
    owner: "Endpoint Operations",
    updated: "1 hr ago",
  },
  {
    id: "POL-004",
    action: "grant_access",
    description:
      "Controls changes to protected resource permissions and privileged access.",
    decision: "blocked",
    risk: "high",
    authorizationRequired: true,
    scope: "Access Management",
    reason:
      "Direct autonomous access grants are outside the approved Level-1 action boundary.",
    owner: "Security Operations",
    updated: "2 hrs ago",
  },
  {
    id: "POL-005",
    action: "request_application_access",
    description:
      "Controls Level-1 application access requests after authentication validation.",
    decision: "allowed",
    risk: "medium",
    authorizationRequired: false,
    scope: "Access Management",
    reason:
      "Application access requests may proceed through the controlled workflow when authentication is valid.",
    owner: "Access Operations",
    updated: "42 min ago",
  },
];

const decisionFilters = [
  "All",
  "Allowed",
  "Approval Required",
  "Blocked",
];

const STORAGE_KEY = "autonomous-it:last-agent-run";
const AGENT_RUN_EVENT = "autonomous-it:agent-run";

function loadLatestRun(): AgentRunResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as AgentRunResponse;
  } catch {
    return null;
  }
}

function normalizeDecision(
  decision: AgentPolicyDecision,
): PolicyDecision {
  return decision;
}

function decisionTitle(decision: PolicyDecision) {
  if (decision === "allowed") {
    return "Action allowed";
  }

  if (decision === "approval_required") {
    return "Human approval required";
  }

  return "Action blocked";
}

export default function PoliciesPage() {
  const [latestRun, setLatestRun] = useState<AgentRunResponse | null>(null);
  const [selectedId, setSelectedId] = useState("POL-002");
  const [filter, setFilter] = useState("All");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationComplete, setEvaluationComplete] = useState(false);

  useEffect(() => {
    const load = () => {
      const run = loadLatestRun();

      setLatestRun(run);

      if (run?.policy?.policy_id) {
        setSelectedId(run.policy.policy_id);
      }
    };

    load();

    window.addEventListener(AGENT_RUN_EVENT, load);

    return () => {
      window.removeEventListener(AGENT_RUN_EVENT, load);
    };
  }, []);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      if (filter === "All") {
        return true;
      }

      if (filter === "Allowed") {
        return policy.decision === "allowed";
      }

      if (filter === "Approval Required") {
        return policy.decision === "approval_required";
      }

      return policy.decision === "blocked";
    });
  }, [filter]);

  const selectedPolicy =
    policies.find((policy) => policy.id === selectedId) ??
    filteredPolicies[0] ??
    policies[0];

  const allowedCount = policies.filter(
    (policy) => policy.decision === "allowed",
  ).length;

  const approvalCount = policies.filter(
    (policy) => policy.decision === "approval_required",
  ).length;

  const blockedCount = policies.filter(
    (policy) => policy.decision === "blocked",
  ).length;

  const livePolicy = latestRun?.policy
    ? {
        id: latestRun.policy.policy_id,
        action: latestRun.policy.action,
        decision: normalizeDecision(latestRun.policy.decision),
        risk: latestRun.policy.risk,
        authorizationRequired:
          latestRun.policy.authorization_required,
        reason: latestRun.policy.reason,
      }
    : null;

  const evaluatePolicy = () => {
    if (evaluating) {
      return;
    }

    setEvaluating(true);
    setEvaluationComplete(false);

    window.setTimeout(() => {
      setEvaluating(false);
      setEvaluationComplete(true);
    }, 900);
  };

  const selectFilter = (value: string) => {
    setFilter(value);

    const matchingPolicies =
      value === "All"
        ? policies
        : policies.filter((policy) => {
            if (value === "Allowed") {
              return policy.decision === "allowed";
            }

            if (value === "Approval Required") {
              return policy.decision === "approval_required";
            }

            return policy.decision === "blocked";
          });

    if (
      matchingPolicies.length > 0 &&
      !matchingPolicies.some((policy) => policy.id === selectedId)
    ) {
      setSelectedId(matchingPolicies[0].id);
    }
  };

  return (
    <div className="min-h-full bg-[#060708] text-zinc-200">
      {/* HEADER */}
      <div className="border-b border-white/[0.06] px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300/[0.1] bg-amber-300/[0.025]">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-200/70" />
                </span>

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Governance / Control Layer
                </span>
              </div>

              <h1 className="text-[25px] font-medium tracking-[-0.03em] text-zinc-100">
                Policy Center
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-zinc-600">
                Evaluate every candidate action against authorization, risk
                and operational policy before controlled execution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {latestRun?.policy ? (
                <div className="flex items-center gap-2 rounded-full border border-indigo-300/[0.08] bg-indigo-300/[0.018] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />

                  <span className="text-[9px] text-zinc-500">
                    Live agent evaluation · {latestRun.ticket_id}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 rounded-full border border-emerald-300/[0.08] bg-emerald-300/[0.018] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[9px] text-zinc-500">
                  Policy enforcement active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6 lg:px-8">
        {/* METRICS */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] md:grid-cols-4">
          <PolicyMetric
            icon={Shield}
            value={String(policies.length)}
            label="Active policies"
            detail="Current control rules"
          />

          <PolicyMetric
            icon={ShieldCheck}
            value={String(allowedCount)}
            label="Allowed"
            detail="Autonomous actions"
          />

          <PolicyMetric
            icon={UserCheck}
            value={String(approvalCount)}
            label="Approval required"
            detail="Human authorization"
          />

          <PolicyMetric
            icon={Ban}
            value={String(blockedCount)}
            label="Blocked"
            detail="Outside action boundary"
          />
        </div>

        {/* LIVE AGENT EVALUATION */}
        <section className="overflow-hidden rounded-xl border border-indigo-300/[0.08] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-300/70" />

                  <p className="text-[10px] font-medium text-zinc-400">
                    Latest agent evaluation
                  </p>
                </div>

                <p className="mt-1 text-[8px] text-zinc-700">
                  Actual policy decision returned by the latest autonomous
                  agent run.
                </p>
              </div>

              {livePolicy ? (
                <DecisionBadge decision={livePolicy.decision} />
              ) : (
                <span className="rounded-full border border-white/[0.06] bg-white/[0.012] px-2.5 py-1.5 text-[7px] text-zinc-700">
                  Awaiting agent run
                </span>
              )}
            </div>
          </div>

          {livePolicy ? (
            <>
              <div className="grid gap-px bg-white/[0.04] md:grid-cols-6">
                <LiveAttribute
                  label="Ticket"
                  value={latestRun?.ticket_id ?? "—"}
                  mono
                />

                <LiveAttribute
                  label="Candidate action"
                  value={`${livePolicy.action}()`}
                  mono
                />

                <LiveAttribute
                  label="Policy"
                  value={livePolicy.id}
                  mono
                />

                <LiveAttribute
                  label="Risk"
                  value={livePolicy.risk}
                />

                <LiveAttribute
                  label="Authorization"
                  value={
                    livePolicy.authorizationRequired
                      ? "Required"
                      : "Not required"
                  }
                />

                <LiveAttribute
                  label="Decision"
                  value={decisionTitle(livePolicy.decision)}
                />
              </div>

              <div className="border-t border-white/[0.05] px-5 py-4">
                <span className="text-[7px] uppercase tracking-[0.12em] text-zinc-700">
                  Agent policy reasoning
                </span>

                <p className="mt-2 text-[9px] leading-5 text-zinc-600">
                  {livePolicy.reason}
                </p>
              </div>
            </>
          ) : (
            <div className="px-5 py-6">
              <p className="text-[9px] text-zinc-600">
                Run the AI Agent to populate the live policy evaluation.
              </p>
            </div>
          )}
        </section>

        {/* DECISION FLOW */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-zinc-600" />

              <p className="text-[10px] font-medium text-zinc-400">
                Policy decision flow
              </p>
            </div>

            <p className="mt-1 text-[8px] text-zinc-700">
              Every proposed action passes through the same governance
              boundary.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-5">
            <DecisionStep
              number="01"
              title="Candidate plan"
              description="Agent proposes an action from its current reasoning state."
              icon={Zap}
            />

            <DecisionStep
              number="02"
              title="Authorization"
              description="Check whether the actor and action are authorized."
              icon={UserCheck}
            />

            <DecisionStep
              number="03"
              title="Risk"
              description="Assess operational impact and reversibility."
              icon={AlertTriangle}
            />

            <DecisionStep
              number="04"
              title="Policy"
              description="Match the action against the applicable control rule."
              icon={FileCheck2}
            />

            <DecisionStep
              number="05"
              title="Decision"
              description="Allow, request approval or block before execution."
              icon={ShieldCheck}
            />
          </div>
        </section>

        {/* POLICY WORKSPACE */}
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          {/* POLICY LIST */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-zinc-400">
                    Control policies
                  </p>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    {filteredPolicies.length} policies in current view
                  </p>
                </div>

                <LockKeyhole className="h-3.5 w-3.5 text-zinc-700" />
              </div>

              {/* FILTERS */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Filter className="mr-1 h-3 w-3 text-zinc-800" />

                {decisionFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectFilter(item)}
                    className={`rounded-md border px-2.5 py-1.5 text-[8px] transition ${
                      filter === item
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
              {filteredPolicies.map((policy, index) => (
                <PolicyRow
                  key={policy.id}
                  policy={policy}
                  index={index}
                  selected={selectedId === policy.id}
                  onClick={() => {
                    setSelectedId(policy.id);
                    setEvaluationComplete(false);
                  }}
                />
              ))}

              {filteredPolicies.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <ShieldAlert className="mx-auto h-4 w-4 text-zinc-800" />

                  <p className="mt-3 text-[9px] text-zinc-600">
                    No policies match this decision filter.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* POLICY DETAIL */}
          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
                  <LockKeyhole className="h-3.5 w-3.5 text-zinc-600" />
                </div>

                <div>
                  <p className="text-[10px] font-medium text-zinc-400">
                    Policy evaluation
                  </p>

                  <p className="mt-1 font-mono text-[7px] text-zinc-700">
                    {selectedPolicy.id}
                  </p>
                </div>
              </div>

              <DecisionBadge decision={selectedPolicy.decision} />
            </div>

            <div className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <p className="font-mono text-[13px] font-medium text-zinc-300">
                    {selectedPolicy.action}()
                  </p>

                  <p className="mt-2 max-w-xl text-[9px] leading-5 text-zinc-600">
                    {selectedPolicy.description}
                  </p>
                </div>

                <RiskBadge risk={selectedPolicy.risk} />
              </div>

              {/* DECISION */}
              <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/15 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-700">
                    Decision
                  </p>

                  <span className="font-mono text-[7px] text-zinc-800">
                    {selectedPolicy.id}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <DecisionIcon decision={selectedPolicy.decision} />

                  <div>
                    <p className="text-[12px] font-medium text-zinc-300">
                      {decisionTitle(selectedPolicy.decision)}
                    </p>

                    <p className="mt-1 text-[8px] text-zinc-700">
                      {selectedPolicy.authorizationRequired
                        ? "Explicit authorization boundary applies."
                        : "Action may proceed without additional authorization."}
                    </p>
                  </div>
                </div>
              </div>

              {/* REASON */}
              <div className="mt-4">
                <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-700">
                  Policy reasoning
                </p>

                <div className="mt-2 rounded-lg border border-white/[0.05] bg-white/[0.012] p-4">
                  <p className="text-[9px] leading-6 text-zinc-500">
                    {selectedPolicy.reason}
                  </p>
                </div>
              </div>

              {/* ATTRIBUTES */}
              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                <PolicyAttribute
                  label="Risk"
                  value={selectedPolicy.risk.toUpperCase()}
                />

                <PolicyAttribute
                  label="Authorization"
                  value={
                    selectedPolicy.authorizationRequired
                      ? "Required"
                      : "Not required"
                  }
                />

                <PolicyAttribute
                  label="Scope"
                  value={selectedPolicy.scope}
                />

                <PolicyAttribute
                  label="Owner"
                  value={selectedPolicy.owner}
                />
              </div>

              {/* EVALUATION RESULT */}
              {evaluationComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-lg border p-3 ${
                    selectedPolicy.decision === "allowed"
                      ? "border-emerald-300/[0.08] bg-emerald-300/[0.018]"
                      : selectedPolicy.decision === "approval_required"
                        ? "border-amber-300/[0.08] bg-amber-300/[0.018]"
                        : "border-red-300/[0.08] bg-red-300/[0.018]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DecisionIcon
                      decision={selectedPolicy.decision}
                      small
                    />

                    <div>
                      <p className="text-[8px] font-medium text-zinc-400">
                        Evaluation complete
                      </p>

                      <p className="mt-1 text-[7px] text-zinc-700">
                        {decisionTitle(selectedPolicy.decision)} ·{" "}
                        {selectedPolicy.id}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EVALUATE */}
              <button
                type="button"
                onClick={evaluatePolicy}
                disabled={evaluating}
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-300/[0.11] bg-indigo-300/[0.035] text-[8px] font-medium text-indigo-200/70 transition hover:bg-indigo-300/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShieldCheck
                  className={`h-3 w-3 ${
                    evaluating ? "animate-pulse" : ""
                  }`}
                />

                {evaluating
                  ? "Evaluating authorization, risk & policy..."
                  : "Evaluate candidate action"}
              </button>
            </div>
          </section>
        </div>

        {/* ACTION MATRIX */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0d0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-zinc-600" />

              <p className="text-[10px] font-medium text-zinc-400">
                Controlled action matrix
              </p>
            </div>

            <p className="mt-1 text-[8px] text-zinc-700">
              Current Level-1 action boundary used by the prototype agent.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.25fr_0.7fr_0.8fr_1fr_1.7fr] border-b border-white/[0.05] px-5 py-3 text-[7px] uppercase tracking-[0.1em] text-zinc-800">
                <span>Action</span>
                <span>Risk</span>
                <span>Authorization</span>
                <span>Decision</span>
                <span>Boundary</span>
              </div>

              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="grid grid-cols-[1.25fr_0.7fr_0.8fr_1fr_1.7fr] items-center border-b border-white/[0.04] px-5 py-3.5 last:border-b-0"
                >
                  <span className="font-mono text-[8px] text-zinc-500">
                    {policy.action}()
                  </span>

                  <RiskBadge risk={policy.risk} compact />

                  <span className="text-[8px] text-zinc-600">
                    {policy.authorizationRequired
                      ? "Required"
                      : "Not required"}
                  </span>

                  <DecisionBadge
                    decision={policy.decision}
                    compact
                  />

                  <span className="text-[8px] text-zinc-700">
                    {policy.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GOVERNANCE NOTE */}
        <section className="rounded-xl border border-white/[0.06] bg-[#090b0d] p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />

            <div>
              <p className="text-[9px] font-medium text-zinc-500">
                Governance principle
              </p>

              <p className="mt-1 text-[8px] leading-5 text-zinc-700">
                The agent does not execute an action merely because the action
                is technically available. Authorization, risk and policy are
                evaluated before the tool gateway is reached.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.05] pt-5 text-[8px] text-zinc-700 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            Policy enforcement is the control boundary between reasoning and
            execution.
          </div>

          <div className="flex items-center gap-2">
            <span>Authorize</span>
            <span>→</span>
            <span>Assess</span>
            <span>→</span>
            <span>Evaluate</span>
            <span>→</span>
            <span>Decide</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function PolicyMetric({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: typeof Shield;
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
          policy
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

function DecisionStep({
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
    <div className="bg-[#090b0d] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-3 w-3 text-zinc-600" />
        </div>

        <span className="font-mono text-[8px] text-zinc-800">
          {number}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-medium text-zinc-400">
        {title}
      </p>

      <p className="mt-2 text-[8px] leading-5 text-zinc-700">
        {description}
      </p>
    </div>
  );
}

function PolicyRow({
  policy,
  index,
  selected,
  onClick,
}: {
  policy: Policy;
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
        <DecisionIcon decision={policy.decision} small />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate font-mono text-[9px] font-medium text-zinc-400">
              {policy.action}()
            </p>

            <span className="shrink-0 font-mono text-[7px] text-zinc-700">
              {policy.id}
            </span>
          </div>

          <p className="mt-1.5 line-clamp-2 text-[8px] leading-5 text-zinc-700">
            {policy.description}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[7px] text-zinc-600">
              {policy.scope}
            </span>

            <span className="text-zinc-800">•</span>

            <span className="text-[7px] text-zinc-700">
              {policy.risk} risk
            </span>

            <ChevronRight className="ml-auto h-2.5 w-2.5 text-zinc-800" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function DecisionBadge({
  decision,
  compact = false,
}: {
  decision: PolicyDecision;
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

function DecisionIcon({
  decision,
  small = false,
}: {
  decision: PolicyDecision;
  small?: boolean;
}) {
  const config = {
    allowed: {
      icon: Check,
      classes:
        "border-emerald-300/[0.1] bg-emerald-300/[0.025] text-emerald-300/70",
    },
    approval_required: {
      icon: UserCheck,
      classes:
        "border-amber-300/[0.1] bg-amber-300/[0.025] text-amber-300/70",
    },
    blocked: {
      icon: Ban,
      classes:
        "border-red-300/[0.1] bg-red-300/[0.025] text-red-300/70",
    },
  }[decision];

  const Icon = config.icon;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md border ${config.classes} ${
        small ? "h-7 w-7" : "h-9 w-9"
      }`}
    >
      <Icon className={small ? "h-3 w-3" : "h-3.5 w-3.5"} />
    </div>
  );
}

function RiskBadge({
  risk,
  compact = false,
}: {
  risk: RiskLevel;
  compact?: boolean;
}) {
  const config = {
    low: {
      label: "Low",
      dot: "bg-emerald-400",
      text: "text-emerald-300/60",
    },
    medium: {
      label: "Medium",
      dot: "bg-amber-400",
      text: "text-amber-300/60",
    },
    high: {
      label: "High",
      dot: "bg-red-400",
      text: "text-red-300/60",
    },
  }[risk];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      <span
        className={`text-[7px] ${
          compact ? config.text : config.text
        }`}
      >
        {config.label} risk
      </span>
    </span>
  );
}

function PolicyAttribute({
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

function LiveAttribute({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-[#090b0d] p-4">
      <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-700">
        {label}
      </p>

      <p
        className={`mt-2 truncate text-[9px] text-zinc-400 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}