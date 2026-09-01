"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function updateCheck(url: string, passed: boolean) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ passed }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "QA check failed.");
  }
}

export function QaChecklist({
  incidentId,
  checks,
}: {
  incidentId: string;
  checks: Array<{ id: string; label: string; passed: boolean; required: boolean }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <label
          key={check.id}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
        >
          <input
            type="checkbox"
            checked={check.passed}
            disabled={busy === check.id}
            onChange={async (event) => {
              const desired = event.target.checked;
              setBusy(check.id);
              setError(null);

              try {
                await updateCheck(`/api/incidents/${incidentId}/qa/${check.id}`, desired);
                router.refresh();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "QA check failed.");
              } finally {
                setBusy(null);
              }
            }}
            className="mt-1"
          />
          <span>
            <span className="block text-sm text-slate-200">{check.label}</span>
            <span className="text-xs text-slate-500">
              {check.required ? "Required" : "Optional"}
            </span>
          </span>
        </label>
      ))}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}
    </div>
  );
}
