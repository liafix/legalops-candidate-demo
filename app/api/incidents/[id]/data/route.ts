import { buildDocumentDiagnosticQuery } from "@/lib/demo/data-query";
import { getIncident } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const incident = await getIncident(id);
    const documentId = incident.document?.id ?? "";

    return ok({
      query: buildDocumentDiagnosticQuery(documentId),
      rows: incident.document
        ? [
            {
              id: incident.document.id,
              version: incident.document.version,
              status: incident.document.status,
              syncStatus: incident.document.syncStatus,
            },
          ]
        : [],
    });
  } catch (error) {
    return fail(error);
  }
}
