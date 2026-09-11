import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  direction: "up" | "down";
}

export function MetricCard({
  label,
  value,
  change,
  direction,
}: MetricCardProps) {
  const isPositive = direction === "up";

  return (
    <div className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-zinc-500">
          {label}
        </span>

        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
          {isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 transition-colors duration-200 group-hover:text-zinc-400" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-zinc-600 transition-colors duration-200 group-hover:text-zinc-400" />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <span className="text-[27px] font-semibold leading-none tracking-[-0.03em] text-zinc-100">
          {value}
        </span>

        <span
          className={`pb-0.5 text-[11px] font-medium ${
            isPositive ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}