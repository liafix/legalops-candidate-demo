import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, prismaMock } = vi.hoisted(() => {
  const tx = {
    auditEvent: { create: vi.fn() },
    document: { update: vi.fn() },
    apiRequest: { create: vi.fn() },
    diagnosticLog: { create: vi.fn() },
    service: { update: vi.fn() },
    incident: { update: vi.fn() },
    qaCheck: { update: vi.fn() },
  };

  const prismaMock = {
    incident: { findUnique: vi.fn() },
    apiRequest: { findFirst: vi.fn(), findMany: vi.fn() },
    diagnosticLog: { findFirst: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  return { tx, prismaMock };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import {
  getLogs,
  resolveIncident,
  retrySynchronization,
  updateQaCheck,
} from "@/lib/services/incidents";

function incident(overrides: Record<string, unknown> = {}) {
  return {
    id: "INC-1042",
    status: "INVESTIGATING",
    serviceId: "svc-document-sync",
    document: { id: "DOC-2084", version: 7, syncStatus: "FAILED" },
    qaChecks: [
      { id: "qa-api-success", key: "api-success", required: true, passed: false },
      { id: "qa-sync-completed", key: "sync-completed", required: true, passed: false },
    ],
    service: { id: "svc-document-sync", status: "DEGRADED" },
    auditEvents: [],
    ...overrides,
  };
}

describe("remediation service workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.document.update.mockResolvedValue({
      id: "DOC-2084",
      version: 7,
      syncStatus: "COMPLETED",
    });
    tx.incident.update.mockResolvedValue({ id: "INC-1042", status: "READY_FOR_QA" });
  });

  it("blocks remediation before investigation and does not open a transaction", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(incident({ status: "OPEN" }));

    await expect(retrySynchronization("INC-1042")).rejects.toThrow(/under investigation/);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("persists remediation, advances to QA, and correlates request/log/audit IDs", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(incident());

    const result = await retrySynchronization("INC-1042");
    expect(result.status).toBe("READY_FOR_QA");
    expect(tx.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "READY_FOR_QA" }) }),
    );

    const apiData = tx.apiRequest.create.mock.calls[0][0].data;
    const logData = tx.diagnosticLog.create.mock.calls[0][0].data;
    const completedAudit = tx.auditEvent.create.mock.calls.find(
      (call) => call[0].data.eventType === "SYNC_RETRY_COMPLETED",
    )?.[0].data;

    expect(apiData.requestId).toMatch(/^req_retry_/);
    expect(logData.incidentId).toBe("INC-1042");
    expect(logData.requestId).toBe(apiData.requestId);
    expect(completedAudit.metadata.requestId).toBe(apiData.requestId);
  });
});

describe("incident-scoped diagnostics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries logs by incident ID rather than broad service ID", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(incident());
    prismaMock.diagnosticLog.findMany.mockResolvedValue([]);

    await getLogs("INC-1042", { severity: "ERROR", requestId: "req_83" });

    expect(prismaMock.diagnosticLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          incidentId: "INC-1042",
          severity: "ERROR",
        }),
      }),
    );
  });
});

describe("QA service workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects QA before remediation reaches READY_FOR_QA", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(incident({ status: "INVESTIGATING" }));

    await expect(updateQaCheck("INC-1042", "qa-api-success", true)).rejects.toThrow(
      /only be completed after remediation/,
    );
  });

  it("verifies API evidence before persisting a passed QA check", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(
      incident({
        status: "READY_FOR_QA",
        document: { id: "DOC-2084", version: 7, syncStatus: "COMPLETED" },
      }),
    );
    prismaMock.apiRequest.findFirst.mockResolvedValue({ statusCode: 500 });

    await expect(updateQaCheck("INC-1042", "qa-api-success", true)).rejects.toThrow(
      /not successful/,
    );
    expect(tx.qaCheck.update).not.toHaveBeenCalled();
  });

  it("checks post-remediation errors within the current incident", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(
      incident({
        status: "READY_FOR_QA",
        document: { id: "DOC-2084", version: 7, syncStatus: "COMPLETED" },
        qaChecks: [
          { id: "qa-no-errors", key: "no-new-errors", required: true, passed: false },
        ],
      }),
    );
    prismaMock.apiRequest.findFirst.mockResolvedValue({
      statusCode: 200,
      timestamp: new Date("2026-09-01T08:00:00.000Z"),
    });
    prismaMock.diagnosticLog.findFirst.mockResolvedValue(null);
    tx.qaCheck.update.mockResolvedValue({ id: "qa-no-errors", key: "no-new-errors" });

    await updateQaCheck("INC-1042", "qa-no-errors", true);

    expect(prismaMock.diagnosticLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ incidentId: "INC-1042", severity: "ERROR" }),
      }),
    );
  });
});

describe("resolution service workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks resolution while a required QA check remains open", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(
      incident({
        status: "READY_FOR_QA",
        document: { id: "DOC-2084", version: 7, syncStatus: "COMPLETED" },
        qaChecks: [{ id: "qa-1", key: "api-success", required: true, passed: false }],
      }),
    );

    await expect(resolveIncident("INC-1042", "Verified successfully after retry.")).rejects.toThrow(
      /required QA/,
    );
  });

  it("resolves only after QA and stores technical plus requester-facing communication", async () => {
    prismaMock.incident.findUnique.mockResolvedValue(
      incident({
        status: "READY_FOR_QA",
        document: { id: "DOC-2084", version: 7, syncStatus: "COMPLETED" },
        qaChecks: [{ id: "qa-1", key: "api-success", required: true, passed: true }],
      }),
    );
    tx.incident.update.mockResolvedValue({ id: "INC-1042", status: "RESOLVED" });

    const resolved = await resolveIncident("INC-1042", "Verified successfully after retry.");

    expect(resolved.status).toBe("RESOLVED");
    expect(tx.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resolutionNote: "Verified successfully after retry.",
          requesterResolution: expect.stringContaining("successfully synchronized"),
        }),
      }),
    );
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: "INCIDENT_RESOLVED" }),
      }),
    );
  });
});
