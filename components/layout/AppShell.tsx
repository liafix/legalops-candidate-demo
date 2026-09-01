import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["/", "Overview"],
  ["/incidents", "Incidents"],
  ["/services", "Services"],
  ["/audit", "Audit"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090c10] text-slate-100 md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-white/10 bg-[#0d1117] p-5 md:min-h-screen md:border-b-0 md:border-r">
        <div className="mb-8">
          <div className="text-lg font-semibold tracking-tight">LegalOps</div>
          <div className="mt-1 text-xs text-slate-500">Synthetic operations environment</div>
        </div>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-500 md:block">
          Independent candidate demonstrator. Synthetic data only.
        </div>
      </aside>
      <main className="min-w-0">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-8">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Operations console</div>
            <div className="text-sm text-slate-300">Production simulator</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Demo Operator</div>
            <div className="text-xs text-emerald-400">Synthetic environment</div>
          </div>
        </header>
        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
