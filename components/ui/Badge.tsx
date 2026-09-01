import type { ReactNode } from "react";

type BadgeTone = "neutral" | "danger" | "warning" | "success";

const toneClasses: Record<BadgeTone, string> = {
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  neutral: "border-white/10 bg-white/5 text-slate-300",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
