export type IncidentStatus = "OPEN" | "INVESTIGATING" | "READY_FOR_QA" | "RESOLVED";
export type SyncStatus = "PENDING" | "FAILED" | "RETRYING" | "COMPLETED";

export type DomainErrorCode =
  | "INVALID_STATE_TRANSITION"
  | "SYNC_NOT_RETRYABLE"
  | "SYNC_ALREADY_COMPLETED"
  | "QA_GATE_NOT_PASSED"
  | "RESOLUTION_NOTE_REQUIRED"
  | "INCIDENT_NOT_FOUND"
  | "DOCUMENT_NOT_FOUND";

export class DomainError extends Error {
  constructor(public code: DomainErrorCode, message: string, public status = 409) {
    super(message);
    this.name = "DomainError";
  }
}
