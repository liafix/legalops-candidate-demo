import { prisma } from "@/lib/db/prisma";
import {
  DEMO_ACTOR,
  DEMO_DOCUMENT_ID,
  DEMO_INCIDENT_ID,
  DEMO_REQUEST_ID,
  DEMO_SERVICE_ID,
  QA_CHECKS,
  SERVICE_DESK_CONTEXT,
} from "./scenario";

const SUPPORTING_SERVICE_IDS = ["svc-document-api", "svc-identity", "svc-notification"] as const;

export async function seedDemo() {
  return prisma.$transaction(async (tx) => {
    await tx.auditEvent.deleteMany({ where: { incidentId: DEMO_INCIDENT_ID } });
    await tx.qaCheck.deleteMany({ where: { incidentId: DEMO_INCIDENT_ID } });
    await tx.apiRequest.deleteMany({ where: { incidentId: DEMO_INCIDENT_ID } });
    await tx.diagnosticLog.deleteMany({ where: { incidentId: DEMO_INCIDENT_ID } });
    await tx.incident.deleteMany({ where: { id: DEMO_INCIDENT_ID } });

    const service = await tx.service.upsert({
      where: { id: DEMO_SERVICE_ID },
      update: { name: "document-sync", status: "DEGRADED" },
      create: { id: DEMO_SERVICE_ID, name: "document-sync", status: "DEGRADED" },
    });

    for (const [id, name] of [
      [SUPPORTING_SERVICE_IDS[0], "document-api"],
      [SUPPORTING_SERVICE_IDS[1], "identity-service"],
      [SUPPORTING_SERVICE_IDS[2], "notification-service"],
    ] as const) {
      await tx.service.upsert({
        where: { id },
        update: { name, status: "HEALTHY" },
        create: { id, name, status: "HEALTHY" },
      });
    }

    const document = await tx.document.upsert({
      where: { id: DEMO_DOCUMENT_ID },
      update: {
        title: "Employment legislation update",
        version: 7,
        status: "PUBLISHED",
        syncStatus: "FAILED",
      },
      create: {
        id: DEMO_DOCUMENT_ID,
        title: "Employment legislation update",
        version: 7,
        status: "PUBLISHED",
        syncStatus: "FAILED",
      },
    });

    const incident = await tx.incident.create({
      data: {
        id: DEMO_INCIDENT_ID,
        title: "Published document not synchronized",
        description:
          "An updated document is marked as published, but the client portal still exposes the previous version.",
        expected: "Published version 7 should be available to the client portal after synchronization.",
        actual:
          "Version 7 is published in source data, but synchronization failed and the client-facing state was not updated.",
        customerImpact: "Users may not see the latest published document.",
        priority: "HIGH",
        status: "OPEN",
        serviceId: service.id,
        documentId: document.id,
        reportedAt: new Date("2026-09-01T07:14:00.000Z"),
        assignedTo: DEMO_ACTOR,
        ...SERVICE_DESK_CONTEXT,
      },
    });

    await tx.apiRequest.create({
      data: {
        incidentId: incident.id,
        requestId: DEMO_REQUEST_ID,
        method: "POST",
        endpoint: `/api/documents/${document.id}/sync`,
        statusCode: 500,
        requestBody: { documentId: document.id, version: 7 },
        responseBody: { success: false, status: 500, code: "UPSTREAM_TIMEOUT" },
        timestamp: new Date("2026-09-01T07:21:45.000Z"),
      },
    });

    await tx.diagnosticLog.createMany({
      data: [
        {
          incidentId: incident.id,
          timestamp: new Date("2026-09-01T07:21:43.000Z"),
          severity: "INFO",
          serviceId: service.id,
          requestId: DEMO_REQUEST_ID,
          message: `Document ${document.id} published`,
          metadata: { documentId: document.id, version: 7 },
        },
        {
          incidentId: incident.id,
          timestamp: new Date("2026-09-01T07:21:44.000Z"),
          severity: "INFO",
          serviceId: service.id,
          requestId: DEMO_REQUEST_ID,
          message: "Synchronization requested",
          metadata: { endpoint: `/api/documents/${document.id}/sync` },
        },
        {
          incidentId: incident.id,
          timestamp: new Date("2026-09-01T07:21:45.000Z"),
          severity: "ERROR",
          serviceId: service.id,
          requestId: DEMO_REQUEST_ID,
          message: "UPSTREAM_TIMEOUT",
          metadata: { status: 500, documentId: document.id },
        },
        {
          incidentId: incident.id,
          timestamp: new Date("2026-09-01T07:21:45.100Z"),
          severity: "WARN",
          serviceId: service.id,
          requestId: DEMO_REQUEST_ID,
          message: "Document synchronization failed",
          metadata: { syncStatus: "FAILED" },
        },
      ],
    });

    await tx.qaCheck.createMany({
      data: QA_CHECKS.map(([id, key, label]) => ({
        id,
        incidentId: incident.id,
        key,
        label,
        required: true,
        passed: false,
      })),
    });

    await tx.auditEvent.createMany({
      data: [
        {
          incidentId: incident.id,
          eventType: "SERVICE_DESK_REQUEST_RECEIVED",
          actor: "System",
          metadata: { channel: SERVICE_DESK_CONTEXT.requestChannel },
          timestamp: new Date("2026-09-01T07:13:30.000Z"),
        },
        {
          incidentId: incident.id,
          eventType: "INCIDENT_CREATED",
          actor: "System",
          metadata: { priority: "HIGH" },
          timestamp: new Date("2026-09-01T07:14:00.000Z"),
        },
        {
          incidentId: incident.id,
          eventType: "INCIDENT_ASSIGNED",
          actor: DEMO_ACTOR,
          metadata: {},
          timestamp: new Date("2026-09-01T07:17:00.000Z"),
        },
        {
          incidentId: incident.id,
          eventType: "API_FAILURE_DETECTED",
          actor: "System",
          metadata: { requestId: DEMO_REQUEST_ID },
          timestamp: new Date("2026-09-01T07:22:00.000Z"),
        },
      ],
    });

    return { incidentId: incident.id, documentId: document.id };
  });
}
