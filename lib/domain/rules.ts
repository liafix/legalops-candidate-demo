import { DomainError, IncidentStatus, SyncStatus } from "./types";

const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ["INVESTIGATING"],
  INVESTIGATING: ["READY_FOR_QA"],
  READY_FOR_QA: ["RESOLVED"],
  RESOLVED: [],
};

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus) {
  return INCIDENT_TRANSITIONS[from].includes(to);
}

export function assertIncidentTransition(from: IncidentStatus, to: IncidentStatus) {
  if (!canTransitionIncident(from, to)) {
    throw new DomainError(
      "INVALID_STATE_TRANSITION",
      `Incident cannot transition from ${from} to ${to}.`,
    );
  }
}

export function assertUserStatusTransition(from: IncidentStatus, to: IncidentStatus) {
  if (from !== "OPEN" || to !== "INVESTIGATING") {
    throw new DomainError(
      "INVALID_STATE_TRANSITION",
      "Manual status changes are limited to starting an investigation; QA and resolution states are controlled by their dedicated workflows.",
    );
  }
  assertIncidentTransition(from, to);
}

export function assertRemediationAllowed(status: IncidentStatus) {
  if (status !== "INVESTIGATING") {
    throw new DomainError(
      "INVALID_STATE_TRANSITION",
      "Remediation can only run while the incident is under investigation.",
    );
  }
}

export function assertSyncRetryable(status: SyncStatus) {
  if (status === "COMPLETED") {
    throw new DomainError(
      "SYNC_ALREADY_COMPLETED",
      "Synchronization is already completed.",
    );
  }
  if (status !== "FAILED") {
    throw new DomainError(
      "SYNC_NOT_RETRYABLE",
      `Synchronization cannot be retried from ${status}.`,
    );
  }
}

export function assertQaGate(checks: Array<{ required: boolean; passed: boolean }>) {
  if (checks.some((check) => check.required && !check.passed)) {
    throw new DomainError(
      "QA_GATE_NOT_PASSED",
      "Incident cannot be resolved before required QA checks pass.",
    );
  }
}

export function assertResolutionNote(note: string | null | undefined) {
  if (!note?.trim()) {
    throw new DomainError(
      "RESOLUTION_NOTE_REQUIRED",
      "A resolution note is required before resolving the incident.",
    );
  }
}
