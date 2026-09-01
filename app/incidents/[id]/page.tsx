import { notFound } from "next/navigation";
import { IncidentActions } from "@/components/incidents/IncidentActions";
import { IncidentSectionNav } from "@/components/incidents/IncidentSectionNav";
import { LogExplorer } from "@/components/diagnostics/LogExplorer";
import { QaChecklist } from "@/components/qa/QaChecklist";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { buildDocumentDiagnosticQuery } from "@/lib/demo/data-query";
import { ACCEPTANCE_CRITERIA } from "@/lib/demo/scenario";
import { getIncident, getLogs, getRequests } from "@/lib/services/incidents";

export const dynamic = "force-dynamic";

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await getIncident(id).catch(() => null);

  if (!incident) {
    notFound();
  }

  const [logs, requests] = await Promise.all([getLogs(id), getRequests(id)]);
  const qaPassed = incident.qaChecks
    .filter((check) => check.required)
    .every((check) => check.passed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="font-mono text-xs text-slate-500">{incident.id}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{incident.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="danger">{incident.priority}</Badge>
            <Badge>{incident.status}</Badge>
            <Badge tone={incident.service.status === "HEALTHY" ? "success" : "warning"}>
              {incident.service.name}: {incident.service.status}
            </Badge>
          </div>
        </div>
        <div className="w-full max-w-md">
          <IncidentActions
            id={id}
            status={incident.status}
            syncStatus={incident.document?.syncStatus}
            qaPassed={qaPassed}
          />
        </div>
      </div>

      <IncidentSectionNav />

      <section id="context" className="scroll-mt-20 space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="ServiceDesk request">
            <dl className="grid gap-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Requester</dt>
                  <dd className="mt-1 text-slate-200">{incident.requester}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Channel</dt>
                  <dd className="mt-1 text-slate-200">{incident.requestChannel}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Original request</dt>
                <dd className="mt-1 leading-6 text-slate-300">{incident.requestSummary}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Affected product</dt>
                <dd className="mt-1 text-slate-300">{incident.affectedProduct}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Technical task translation">
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase text-slate-500">Component</div>
                <div className="mt-1 font-mono text-sky-300">{incident.service.name}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-500">Technical task</div>
                <p className="mt-1 leading-6 text-slate-300">{incident.technicalTask}</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Panel title="Incident context">
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-500">Issue</dt>
                <dd className="mt-1 leading-6 text-slate-300">{incident.description}</dd>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Expected</dt>
                  <dd className="mt-1 leading-6 text-slate-300">{incident.expected}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Actual</dt>
                  <dd className="mt-1 leading-6 text-slate-300">{incident.actual}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Customer impact</dt>
                <dd className="mt-1 leading-6 text-slate-300">{incident.customerImpact}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Acceptance criteria</dt>
                <dd className="mt-2">
                  <ul className="space-y-1 text-sm text-slate-300">
                    {ACCEPTANCE_CRITERIA.map((criterion) => (
                      <li key={criterion}>• {criterion}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Related document">
            {incident.document ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID</span>
                  <span className="font-mono">{incident.document.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Version</span>
                  <span>{incident.document.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge>{incident.document.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sync state</span>
                  <Badge tone={incident.document.syncStatus === "COMPLETED" ? "success" : "danger"}>
                    {incident.document.syncStatus}
                  </Badge>
                </div>
              </div>
            ) : null}
          </Panel>
        </div>
      </section>

      <section id="diagnostics" className="scroll-mt-20">
        <div className="grid gap-6 2xl:grid-cols-2">
          <Panel title="Log Explorer">
            <LogExplorer
              logs={logs.map((log) => ({
                ...log,
                timestamp: log.timestamp.toISOString(),
                severity: log.severity as "INFO" | "WARN" | "ERROR",
              }))}
            />
          </Panel>

          <Panel title="API Inspector">
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-sky-300">{request.method}</span>
                    <span>{request.endpoint}</span>
                    <Badge tone={request.statusCode >= 400 ? "danger" : "success"}>
                      {request.statusCode}
                    </Badge>
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-slate-500">
                    correlation: {request.requestId}
                  </div>
                  <pre className="mt-3 overflow-x-auto text-xs leading-5 text-slate-400">
                    {JSON.stringify(request.responseBody, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section id="data" className="scroll-mt-20">
        <Panel title="Data Explorer — read only">
          <div className="space-y-4">
            <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-sky-200">
              {buildDocumentDiagnosticQuery(incident.document?.id ?? "")}
            </pre>
            {incident.document && (
              <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/10 p-3 text-xs">
                <div className="text-slate-500">id</div>
                <div className="text-slate-500">version</div>
                <div className="text-slate-500">status</div>
                <div className="text-slate-500">syncStatus</div>
                <div>{incident.document.id}</div>
                <div>{incident.document.version}</div>
                <div>{incident.document.status}</div>
                <div>{incident.document.syncStatus}</div>
              </div>
            )}
            <p className="text-xs leading-5 text-slate-500">
              Diagnostic access paths are indexed by incident, timestamp and request correlation ID.
              Arbitrary SQL execution is intentionally disabled.
            </p>
          </div>
        </Panel>
      </section>

      <section id="qa" className="scroll-mt-20">
        <Panel title="QA Gate">
          <QaChecklist incidentId={id} checks={incident.qaChecks} />
        </Panel>
      </section>

      <section id="audit" className="scroll-mt-20">
        <Panel title="Audit Trail">
          <div className="space-y-3">
            {incident.auditEvents.map((event) => (
              <div key={event.id} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                <div>
                  <div className="font-mono text-xs text-slate-500">
                    {event.timestamp.toISOString()}
                  </div>
                  <div className="mt-1 text-slate-200">{event.eventType}</div>
                  <div className="text-xs text-slate-500">{event.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section id="resolution" className="scroll-mt-20">
        {incident.status === "RESOLVED" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Technical resolution summary">
              <div className="grid gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-slate-500">Root cause</div>
                  <div className="mt-1">{incident.rootCause}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Outcome</div>
                  <div className="mt-1 text-emerald-300">Document successfully synchronized</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Resolution note</div>
                  <div className="mt-1 leading-6 text-slate-300">{incident.resolutionNote}</div>
                </div>
              </div>
            </Panel>

            <Panel title="Requester-facing resolution">
              <p className="text-sm leading-6 text-slate-300">{incident.requesterResolution}</p>
              <p className="mt-3 text-xs text-slate-500">
                This separates technical evidence from the concise update sent back to the original
                ServiceDesk requester.
              </p>
            </Panel>
          </div>
        ) : (
          <Panel title="Resolution">
            <p className="text-sm text-slate-500">
              Complete remediation and evidence-backed QA to unlock technical and requester-facing
              resolution summaries.
            </p>
          </Panel>
        )}
      </section>
    </div>
  );
}
