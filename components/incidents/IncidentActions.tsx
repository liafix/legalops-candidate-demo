"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function call(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Action failed");
  }

  return payload.data;
}

export function IncidentActions({
  id,
  status,
  syncStatus,
  qaPassed,
}: {
  id: string;
  status: string;
  syncStatus?: string;
  qaPassed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(
    "Synchronization retry completed successfully; API returned 200 and version 7 is synchronized.",
  );

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);

    try {
      await action();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {status === "OPEN" && (
        <button
          disabled={busy}
          onClick={() =>
            run(() =>
              call(`/api/incidents/${id}/status`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status: "INVESTIGATING" }),
              }),
            )
          }
          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Start investigation
        </button>
      )}

      {status === "INVESTIGATING" && syncStatus === "FAILED" && (
        <button
          disabled={busy}
          onClick={() =>
            run(() =>
              call(`/api/incidents/${id}/remediation/retry-sync`, {
                method: "POST",
              }),
            )
          }
          className="rounded-md bg-amber-300 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Retry synchronization
        </button>
      )}

      {status === "READY_FOR_QA" && (
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Technical resolution note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-md border border-white/10 bg-black/20 p-3 text-sm normal-case tracking-normal text-slate-200 outline-none focus:border-white/20"
            />
          </label>
          <button
            disabled={busy || !qaPassed}
            onClick={() =>
              run(() =>
                call(`/api/incidents/${id}/resolve`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ resolutionNote: note }),
                }),
              )
            }
            className="rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Resolve incident
          </button>
          {!qaPassed && (
            <p className="text-xs text-slate-500">
              Complete all required QA checks before resolution.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
