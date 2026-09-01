import Link from "next/link";
import { getDashboard } from "@/lib/services/incidents";
import { Badge } from "@/components/ui/Badge";
import { Metric } from "@/components/ui/Metric";
import { Panel } from "@/components/ui/Panel";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const dashboard = await getDashboard();
  const priorityIncident = dashboard.incidents.find((incident) => incident.id === "INC-1042");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          LegalOps
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Incident operations overview</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Translate a ServiceDesk request into a technical task, diagnose a deterministic
          synchronization incident, perform safe remediation, validate QA evidence and communicate the
          resolution back to the requester.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open incidents" value={dashboard.openIncidents} />
        <Metric label="High priority" value={dashboard.highPriority} />
        <Metric label="Services healthy" value={dashboard.servicesHealthy} />
        <Metric label="Pending QA" value={dashboard.pendingQa} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Priority ServiceDesk incident">
          {priorityIncident ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="danger">HIGH</Badge>
                <Badge>{priorityIncident.status}</Badge>
                <span className="text-xs text-slate-500">{priorityIncident.service.name}</span>
              </div>
              <div>
                <div className="font-mono text-xs text-slate-500">{priorityIncident.id}</div>
                <h2 className="mt-1 text-xl font-semibold">{priorityIncident.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {priorityIncident.customerImpact}
                </p>
              </div>
              <Link
                href={`/incidents/${priorityIncident.id}`}
                className="inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
              >
                Investigate INC-1042
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Reset the demo to restore INC-1042.</p>
          )}
        </Panel>

        <Panel title="Service health">
          <div className="space-y-3">
            {dashboard.services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <span className="text-sm">{service.name}</span>
                <Badge tone={service.status === "HEALTHY" ? "success" : "warning"}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-xs leading-5 text-slate-500">
        Independent candidate demonstrator created from public role/company context. Synthetic data
        only. This is not a Poradca podnikateľa product, internal system, or representation of its
        architecture.
      </div>
    </div>
  );
}
