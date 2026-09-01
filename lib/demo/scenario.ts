export const DEMO_INCIDENT_ID = "INC-1042";
export const DEMO_DOCUMENT_ID = "DOC-2084";
export const DEMO_SERVICE_ID = "svc-document-sync";
export const DEMO_REQUEST_ID = "req_83fc";
export const DEMO_ACTOR = "Demo Operator";

export const SERVICE_DESK_CONTEXT = {
  requester: "Content Editor",
  requestChannel: "ServiceDesk",
  requestSummary:
    "After publishing the updated document, the client portal still shows the previous version.",
  affectedProduct: "Synthetic document portal",
  technicalTask:
    "Investigate why published version 7 is unavailable to the client-facing portal. Correlate the synchronization request across logs, API responses and document data; perform only the predefined safe remediation; validate acceptance criteria before resolution.",
} as const;

export const ACCEPTANCE_CRITERIA = [
  "Version 7 is synchronized successfully.",
  "Latest synchronization API request returns a successful status.",
  "No new ERROR logs appear after remediation.",
  "Document synchronization state is COMPLETED.",
] as const;

export const REQUESTER_RESOLUTION =
  "Version 7 was successfully synchronized after retrying the failed processing request. The portal now exposes the latest version, and follow-up validation found no new synchronization errors.";

export const QA_CHECKS = [
  ["qa-api-success", "api-success", "API endpoint returns a successful response"],
  ["qa-sync-completed", "sync-completed", "Document synchronization state is COMPLETED"],
  ["qa-no-errors", "no-new-errors", "No new ERROR logs exist after remediation"],
  ["qa-version", "version-synced", "Expected document version is synchronized"],
] as const;
