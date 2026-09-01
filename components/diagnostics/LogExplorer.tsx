"use client";

import React, { useMemo, useState } from "react";

type LogItem = {
  id: string;
  timestamp: string;
  severity: "INFO" | "WARN" | "ERROR";
  requestId: string | null;
  message: string;
};

export function LogExplorer({ logs }: { logs: LogItem[] }) {
  const [severity, setSeverity] = useState<"ALL" | LogItem["severity"]>("ALL");
  const [requestId, setRequestId] = useState("");

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const severityMatches = severity === "ALL" || log.severity === severity;
        const requestMatches =
          !requestId.trim() ||
          (log.requestId ?? "").toLowerCase().includes(requestId.trim().toLowerCase());
        return severityMatches && requestMatches;
      }),
    [logs, requestId, severity],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="text-xs text-slate-400">
          Severity
          <select
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as typeof severity)}
            className="mt-1 block rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </label>
        <label className="flex-1 text-xs text-slate-400">
          Request ID
          <input
            aria-label="Request ID"
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            placeholder="e.g. req_83fc"
            className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200 outline-none focus:border-white/20"
          />
        </label>
      </div>
      <div className="space-y-2 font-mono text-xs">
        {filtered.map((log) => (
          <div
            key={log.id}
            className="grid grid-cols-[68px_58px_1fr] gap-3 rounded-md border border-white/5 bg-black/20 p-2"
          >
            <span className="text-slate-500">
              {new Date(log.timestamp).toISOString().slice(11, 19)}
            </span>
            <span
              className={
                log.severity === "ERROR"
                  ? "text-red-300"
                  : log.severity === "WARN"
                    ? "text-amber-300"
                    : "text-slate-400"
              }
            >
              {log.severity}
            </span>
            <span>
              {log.message}
              <span className="ml-2 text-slate-600">{log.requestId}</span>
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-md border border-dashed border-white/10 p-4 text-slate-500">
            No logs match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

