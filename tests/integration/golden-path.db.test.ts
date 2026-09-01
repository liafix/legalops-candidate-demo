import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { DEMO_INCIDENT_ID, QA_CHECKS } from "@/lib/demo/scenario";
import { seedDemo } from "@/lib/demo/seed";
import {
  getIncident,
  resetDemo,
  resolveIncident,
  retrySynchronization,
  transitionIncident,
  updateQaCheck,
} from "@/lib/services/incidents";

describe.sequential("database-backed golden path", () => {
  beforeEach(async () => {
    await seedDemo();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists ServiceDesk → investigation → remediation → QA → resolution → reset", async () => {
    const initial = await getIncident(DEMO_INCIDENT_ID);
    expect(initial.status).toBe("OPEN");
    expect(initial.requestChannel).toBe("ServiceDesk");
    expect(initial.requestSummary).toContain("client portal");
    expect(initial.document?.syncStatus).toBe("FAILED");

    await transitionIncident(DEMO_INCIDENT_ID, "INVESTIGATING");
    await retrySynchronization(DEMO_INCIDENT_ID);

    const remediated = await getIncident(DEMO_INCIDENT_ID);
    expect(remediated.status).toBe("READY_FOR_QA");
    expect(remediated.document?.syncStatus).toBe("COMPLETED");

    const requests = await prisma.apiRequest.findMany({
      where: { incidentId: DEMO_INCIDENT_ID },
      orderBy: { timestamp: "asc" },
    });
    const retryRequest = requests.at(-1);
    expect(retryRequest?.statusCode).toBe(200);

    const correlatedLog = await prisma.diagnosticLog.findFirst({
      where: {
        incidentId: DEMO_INCIDENT_ID,
        requestId: retryRequest?.requestId,
      },
    });
    expect(correlatedLog?.severity).toBe("INFO");

    for (const [checkId] of QA_CHECKS) {
      await updateQaCheck(DEMO_INCIDENT_ID, checkId, true);
    }

    await resolveIncident(
      DEMO_INCIDENT_ID,
      "Synchronization retry completed successfully and all acceptance criteria were verified.",
    );

    const resolved = await getIncident(DEMO_INCIDENT_ID);
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.requesterResolution).toContain("successfully synchronized");
    expect(resolved.qaChecks.every((check) => check.passed)).toBe(true);
    expect(resolved.auditEvents.some((event) => event.eventType === "INCIDENT_RESOLVED")).toBe(true);

    await resetDemo();

    const reset = await getIncident(DEMO_INCIDENT_ID);
    expect(reset.status).toBe("OPEN");
    expect(reset.document?.syncStatus).toBe("FAILED");
    expect(reset.qaChecks.every((check) => !check.passed)).toBe(true);
    expect(reset.requesterResolution).toBeNull();
  });
});
