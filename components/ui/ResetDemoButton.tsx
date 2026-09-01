"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetDemoButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);

          try {
            const response = await fetch("/api/demo/reset", { method: "POST" });
            const payload = await response.json();
            if (!response.ok) {
              throw new Error(payload.error?.message ?? "Demo reset failed.");
            }
            router.push("/");
            router.refresh();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Demo reset failed.");
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
      >
        {busy ? "Resetting…" : "Reset demo"}
      </button>
      {error && (
        <span role="alert" className="max-w-56 text-right text-xs text-red-300">
          {error}
        </span>
      )}
    </div>
  );
}
