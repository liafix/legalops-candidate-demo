import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const incidents = await prisma.incident.findMany({
    include: { service: true },
    orderBy: { reportedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Incidents</h1>
      <p className="mt-2 text-sm text-slate-500">
        Synthetic ServiceDesk incidents routed into the technical investigation workflow.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Title</th>
              <th className="p-3">Service</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-t border-white/10">
                <td className="p-3 font-mono text-xs">
                  <Link href={`/incidents/${incident.id}`} className="hover:text-white">
                    {incident.id}
                  </Link>
                </td>
                <td className="p-3">{incident.title}</td>
                <td className="p-3 text-slate-400">{incident.service.name}</td>
                <td className="p-3">
                  <Badge tone={incident.priority === "HIGH" ? "danger" : "neutral"}>
                    {incident.priority}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge>{incident.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
