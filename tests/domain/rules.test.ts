import { describe, expect, it } from "vitest";
import {
  assertIncidentTransition,
  assertQaGate,
  assertRemediationAllowed,
  assertResolutionNote,
  assertSyncRetryable,
  assertUserStatusTransition,
  canTransitionIncident,
} from "@/lib/domain/rules";

describe("incident state rules", () => {
  it("allows OPEN to INVESTIGATING", () => {
    expect(canTransitionIncident("OPEN", "INVESTIGATING")).toBe(true);
  });

  it("allows INVESTIGATING to READY_FOR_QA", () => {
    expect(canTransitionIncident("INVESTIGATING", "READY_FOR_QA")).toBe(true);
  });

  it("allows READY_FOR_QA to RESOLVED", () => {
    expect(canTransitionIncident("READY_FOR_QA", "RESOLVED")).toBe(true);
  });

  it("rejects OPEN to RESOLVED", () => {
    expect(() => assertIncidentTransition("OPEN", "RESOLVED")).toThrow(/cannot transition/);
  });

  it("rejects RESOLVED to INVESTIGATING", () => {
    expect(() => assertIncidentTransition("RESOLVED", "INVESTIGATING")).toThrow();
  });

  it("rejects same-state transition", () => {
    expect(() => assertIncidentTransition("OPEN", "OPEN")).toThrow();
  });

  it("allows the only manual user transition OPEN to INVESTIGATING", () => {
    expect(() => assertUserStatusTransition("OPEN", "INVESTIGATING")).not.toThrow();
  });

  it("prevents a user from manually skipping to READY_FOR_QA", () => {
    expect(() => assertUserStatusTransition("INVESTIGATING", "READY_FOR_QA")).toThrow(
      /dedicated workflows/,
    );
  });
});

describe("remediation rules", () => {
  it("allows remediation only while investigating", () => {
    expect(() => assertRemediationAllowed("INVESTIGATING")).not.toThrow();
  });

  it.each(["OPEN", "READY_FOR_QA", "RESOLVED"] as const)(
    "blocks remediation from %s",
    (status) => {
      expect(() => assertRemediationAllowed(status)).toThrow(/under investigation/);
    },
  );
});

describe("synchronization rules", () => {
  it("allows retry from FAILED", () => {
    expect(() => assertSyncRetryable("FAILED")).not.toThrow();
  });

  it("rejects retry from COMPLETED", () => {
    expect(() => assertSyncRetryable("COMPLETED")).toThrow(/already completed/);
  });

  it("rejects retry from RETRYING", () => {
    expect(() => assertSyncRetryable("RETRYING")).toThrow();
  });

  it("rejects retry from PENDING", () => {
    expect(() => assertSyncRetryable("PENDING")).toThrow();
  });
});

describe("QA and resolution invariants", () => {
  it("passes when all required checks pass", () => {
    expect(() => assertQaGate([{ required: true, passed: true }])).not.toThrow();
  });

  it("ignores failed optional checks", () => {
    expect(() => assertQaGate([{ required: false, passed: false }])).not.toThrow();
  });

  it("blocks a failed required check", () => {
    expect(() => assertQaGate([{ required: true, passed: false }])).toThrow(/required QA/);
  });

  it("accepts a meaningful resolution note", () => {
    expect(() => assertResolutionNote("Fixed and verified.")).not.toThrow();
  });

  it("rejects blank resolution note", () => {
    expect(() => assertResolutionNote("   ")).toThrow(/resolution note/);
  });
});
