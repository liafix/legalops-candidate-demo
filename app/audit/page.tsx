import { ResetDemoButton } from "@/components/ui/ResetDemoButton";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await prisma.auditEvent.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Audit trail</h1>
          <p className="mt-2 text-sm text-slate-500">
            Immutable application events for the synthetic incident workflow.
          </p>
        </div>
        <ResetDemoButton />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        {events.map((event) => (
          <div
            key={event.id}
            className="grid gap-2 border-t border-white/10 p-4 first:border-t-0 md:grid-cols-[190px_1fr_160px]"
          >
            <span className="font-mono text-xs text-slate-500">
              {event.timestamp.toISOString()}
            </span>
            <span className="text-sm">{event.eventType}</span>
            <span className="text-xs text-slate-500">{event.actor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
