import { describe, expect, it } from "vitest";
import { buildDocumentDiagnosticQuery } from "@/lib/demo/data-query";
import { incidentStatusSchema, qaUpdateSchema, resolveSchema } from "@/lib/validation/schemas";

describe("API validation contracts", () => {
  it("accepts valid incident status", () => {
    expect(incidentStatusSchema.parse({ status: "INVESTIGATING" }).status).toBe("INVESTIGATING");
  });

  it("rejects unknown incident status", () => {
    expect(() => incidentStatusSchema.parse({ status: "DONE" })).toThrow();
  });

  it("accepts QA boolean", () => {
    expect(qaUpdateSchema.parse({ passed: true }).passed).toBe(true);
  });

  it("rejects QA strings", () => {
    expect(() => qaUpdateSchema.parse({ passed: "yes" })).toThrow();
  });

  it("accepts meaningful resolution note", () => {
    expect(
      resolveSchema.parse({ resolutionNote: "Verified after synchronization retry." }).resolutionNote,
    ).toContain("Verified");
  });

  it("rejects short resolution note", () => {
    expect(() => resolveSchema.parse({ resolutionNote: "fixed" })).toThrow();
  });

  it("trims resolution note", () => {
    expect(
      resolveSchema.parse({ resolutionNote: "   Verified successfully.   " }).resolutionNote,
    ).toBe("Verified successfully.");
  });
});


describe("diagnostic SQL contract", () => {
  it("matches the physical Prisma/PostgreSQL table and camelCase column names", () => {
    const query = buildDocumentDiagnosticQuery("DOC-2084");

    expect(query).toContain('FROM "Document"');
    expect(query).toContain('"syncStatus"');
    expect(query).toContain("WHERE \"id\" = 'DOC-2084'");
    expect(query).not.toContain("sync_status");
    expect(query).not.toContain("FROM documents");
  });
});
