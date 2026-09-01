-- v1.3 candidate polish: ServiceDesk context, incident-scoped diagnostics and query-path indexes.
ALTER TABLE "Incident"
  ADD COLUMN "requester" TEXT NOT NULL DEFAULT 'Content Editor',
  ADD COLUMN "requestChannel" TEXT NOT NULL DEFAULT 'ServiceDesk',
  ADD COLUMN "requestSummary" TEXT NOT NULL DEFAULT 'Published document is not visible on the client portal.',
  ADD COLUMN "affectedProduct" TEXT NOT NULL DEFAULT 'Synthetic document portal',
  ADD COLUMN "technicalTask" TEXT NOT NULL DEFAULT 'Investigate document synchronization failure and validate recovery.',
  ADD COLUMN "requesterResolution" TEXT;

ALTER TABLE "Incident"
  ALTER COLUMN "requester" DROP DEFAULT,
  ALTER COLUMN "requestChannel" DROP DEFAULT,
  ALTER COLUMN "requestSummary" DROP DEFAULT,
  ALTER COLUMN "affectedProduct" DROP DEFAULT,
  ALTER COLUMN "technicalTask" DROP DEFAULT;

ALTER TABLE "DiagnosticLog" ADD COLUMN "incidentId" TEXT;
UPDATE "DiagnosticLog" SET "incidentId" = 'INC-1042' WHERE "incidentId" IS NULL;
ALTER TABLE "DiagnosticLog" ALTER COLUMN "incidentId" SET NOT NULL;

ALTER TABLE "DiagnosticLog"
  ADD CONSTRAINT "DiagnosticLog_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiRequest"
  ADD CONSTRAINT "ApiRequest_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "ApiRequest_incidentId_idx";
CREATE INDEX "ApiRequest_incidentId_timestamp_idx" ON "ApiRequest"("incidentId", "timestamp");
CREATE INDEX "DiagnosticLog_incidentId_timestamp_idx" ON "DiagnosticLog"("incidentId", "timestamp");
CREATE INDEX "DiagnosticLog_incidentId_severity_timestamp_idx" ON "DiagnosticLog"("incidentId", "severity", "timestamp");
CREATE INDEX "DiagnosticLog_requestId_idx" ON "DiagnosticLog"("requestId");
