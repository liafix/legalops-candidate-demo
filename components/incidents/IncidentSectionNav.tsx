import React from "react";

const sections = [
  ["context", "Context"],
  ["diagnostics", "Diagnostics"],
  ["data", "Data"],
  ["qa", "QA"],
  ["audit", "Audit"],
  ["resolution", "Resolution"],
] as const;

export function IncidentSectionNav() {
  return (
    <nav
      aria-label="Incident workspace sections"
      className="sticky top-0 z-20 -mx-2 overflow-x-auto border-y border-white/10 bg-[#090c10]/95 px-2 py-2 backdrop-blur"
    >
      <div className="flex min-w-max gap-1">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

