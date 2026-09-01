import { prisma } from "@/lib/db/prisma";
import {
  assertIncidentTransition,
  assertQaGate,
  assertRemediationAllowed,
  assertResolutionNote,
  assertSyncRetryable,
  assertUserStatusTransition,
} from "@/lib/domain/rules";
import { DomainError, IncidentStatus } from "@/lib/domain/types";
import { DEMO_ACTOR, REQUESTER_RESOLUTION } from "@/lib/demo/scenario";

export async function getDashboard() {
  const [openIncidents, highPriority, pendingQa, services] = await Promise.all([
    prisma.incident.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.incident.count({
      where: {
        priority: { in: ["HIGH", "CRITICAL"] },
        status: { not: "RESOLVED" },
      },
    }),
    prisma.incident.count({ where: { status: "READY_FOR_QA" } }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
  ]);

  const healthy = services.filter((service) => service.status === "HEALTHY").length;
  const incidents = await prisma.incident.findMany({
    include: { service: true },
    orderBy: { reportedAt: "desc" },
    take: 5,
  });

  return {
    openIncidents,
    highPriority,
    pendingQa,
    servicesHealthy: `${healthy}/${services.length}`,
    services,
    incidents,
  };
}

export async function getIncident(id: string) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      service: true,
      document: true,
      qaChecks: { orderBy: { id: "asc" } },
      auditEvents: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!incident) {
    throw new DomainError("INCIDENT_NOT_FOUND", `Incident ${id} was not found.`, 404);
  }

  return incident;
}

export async function transitionIncident(id: string, next: IncidentStatus) {
  const incident = await getIncident(id);
  assertUserStatusTransition(incident.status as IncidentStatus, next);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.incident.update({
      where: { id },
      data: { status: next },
    });

    await tx.auditEvent.create({
      data: {
        incidentId: id,
        eventType: `INCIDENT_${next}`,
        actor: DEMO_ACTOR,
        metadata: { from: incident.status, to: next },
      },
    });

    return updated;
  });
}

export async function retrySynchronization(id: string) {
  const incident = await getIncident(id);

  if (!incident.document) {
    throw new DomainError("DOCUMENT_NOT_FOUND", "No document is connected to the incident.", 404);
  }

  assertRemediationAllowed(incident.status as IncidentStatus);
  assertSyncRetryable(incident.document.syncStatus);
  assertIncidentTransition(incident.status as IncidentStatus, "READY_FOR_QA");

  return prisma.$transaction(async (tx) => {
    await tx.auditEvent.create({
      data: {
        incidentId: id,
        eventType: "REMEDIATION_STARTED",
        actor: DEMO_ACTOR,
        metadata: { action: "retry-sync" },
      },
    });

    await tx.document.update({
      where: { id: incident.document!.id },
      data: { syncStatus: "RETRYING" },
    });

    const document = await tx.document.update({
      where: { id: incident.document!.id },
      data: { syncStatus: "COMPLETED" },
    });

    const retryRequestId = `req_retry_${Date.now()}`;
    const completedAt = new Date();

    await tx.apiRequest.create({
      data: {
        incidentId: id,
        requestId: retryRequestId,
        method: "POST",
        endpoint: `/api/documents/${document.id}/sync`,
        statusCode: 200,
        requestBody: { documentId: document.id },
        responseBody: { success: true, syncStatus: "COMPLETED" },
        timestamp: completedAt,
      },
    });

    await tx.diagnosticLog.create({
      data: {
        incidentId: id,
        timestamp: completedAt,
        severity: "INFO",
        serviceId: incident.serviceId,
        requestId: retryRequestId,
        message: `Synchronization completed for ${document.id}.`,
        metadata: { documentId: document.id, version: document.version },
      },
    });

    await tx.service.update({
      where: { id: incident.serviceId },
      data: { status: "HEALTHY" },
    });

    await tx.incident.update({
      where: { id },
      data: {
        status: "READY_FOR_QA",
        rootCause: "Transient upstream synchronization timeout",
      },
    });

    await tx.auditEvent.create({
      data: {
        incidentId: id,
        eventType: "SYNC_RETRY_COMPLETED",
        actor: DEMO_ACTOR,
        metadata: {
          documentId: document.id,
          syncStatus: "COMPLETED",
          requestId: retryRequestId,
        },
      },
    });

    return { document, status: "READY_FOR_QA" as const };
  });
}

export async function updateQaCheck(incidentId: string, checkId: string, passed: boolean) {
  const incident = await getIncident(incidentId);

  if (incident.status !== "READY_FOR_QA") {
    throw new DomainError(
      "QA_GATE_NOT_PASSED",
      "QA checks can only be completed after remediation is ready for QA.",
    );
  }

  const check = incident.qaChecks.find((item) => item.id === checkId);
  if (!check) {
    throw new DomainError(
      "QA_GATE_NOT_PASSED",
      "QA check does not belong to this incident.",
      404,
    );
  }

  if (passed) {
    if (check.key === "api-success") {
      const latest = await prisma.apiRequest.findFirst({
        where: { incidentId },
        orderBy: { timestamp: "desc" },
      });
      if (!latest || latest.statusCode >= 400) {
        throw new DomainError("QA_GATE_NOT_PASSED", "Latest API request is not successful.");
      }
    }

    if (check.key === "sync-completed" && incident.document?.syncStatus !== "COMPLETED") {
      throw new DomainError(
        "QA_GATE_NOT_PASSED",
        "Document synchronization is not completed.",
      );
    }

    if (check.key === "no-new-errors") {
      const lastSuccess = await prisma.apiRequest.findFirst({
        where: { incidentId, statusCode: { lt: 400 } },
        orderBy: { timestamp: "desc" },
      });
      if (!lastSuccess) {
        throw new DomainError(
          "QA_GATE_NOT_PASSED",
          "No successful remediation request exists yet.",
        );
      }

      const errorAfterSuccess = await prisma.diagnosticLog.findFirst({
        where: {
          incidentId,
          severity: "ERROR",
          timestamp: { gt: lastSuccess.timestamp },
        },
      });
      if (errorAfterSuccess) {
        throw new DomainError(
          "QA_GATE_NOT_PASSED",
          "A new ERROR log exists after remediation.",
        );
      }
    }

    if (
      check.key === "version-synced" &&
      (!incident.document ||
        incident.document.version !== 7 ||
        incident.document.syncStatus !== "COMPLETED")
    ) {
      throw new DomainError(
        "QA_GATE_NOT_PASSED",
        "Expected document version is not synchronized.",
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.qaCheck.update({
      where: { id: checkId },
      data: { passed, checkedAt: passed ? new Date() : null },
    });

    await tx.auditEvent.create({
      data: {
        incidentId,
        eventType: passed ? "QA_CHECK_PASSED" : "QA_CHECK_REOPENED",
        actor: DEMO_ACTOR,
        metadata: { checkId, key: updated.key },
      },
    });

    return updated;
  });
}

export async function resolveIncident(id: string, resolutionNote: string) {
  const incident = await getIncident(id);

  if (incident.status !== "READY_FOR_QA") {
    throw new DomainError(
      "INVALID_STATE_TRANSITION",
      "Incident must be READY_FOR_QA before resolution.",
    );
  }

  assertQaGate(incident.qaChecks);
  assertResolutionNote(resolutionNote);

  if (incident.document?.syncStatus !== "COMPLETED") {
    throw new DomainError(
      "QA_GATE_NOT_PASSED",
      "Document synchronization must be COMPLETED before resolution.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.incident.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolutionNote,
        requesterResolution: REQUESTER_RESOLUTION,
      },
    });

    await tx.auditEvent.create({
      data: {
        incidentId: id,
        eventType: "INCIDENT_RESOLVED",
        actor: DEMO_ACTOR,
        metadata: { resolutionNote, requesterResolution: REQUESTER_RESOLUTION },
      },
    });

    return updated;
  });
}

export async function resetDemo() {
  const { seedDemo } = await import("@/lib/demo/seed");
  return seedDemo();
}

export async function getLogs(
  id: string,
  filters?: { severity?: "INFO" | "WARN" | "ERROR"; requestId?: string },
) {
  await getIncident(id);

  return prisma.diagnosticLog.findMany({
    where: {
      incidentId: id,
      ...(filters?.severity ? { severity: filters.severity } : {}),
      ...(filters?.requestId
        ? { requestId: { contains: filters.requestId, mode: "insensitive" } }
        : {}),
    },
    orderBy: { timestamp: "asc" },
  });
}

export async function getRequests(id: string) {
  await getIncident(id);
  return prisma.apiRequest.findMany({
    where: { incidentId: id },
    orderBy: { timestamp: "asc" },
  });
}
