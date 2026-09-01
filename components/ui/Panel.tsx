import type { ReactNode } from "react";

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-white/10 bg-[#0d1117] ${className}`}>
      {title && (
        <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
