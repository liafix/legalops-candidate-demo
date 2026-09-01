import { z } from "zod";

export const incidentStatusSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "READY_FOR_QA", "RESOLVED"]),
});

export const qaUpdateSchema = z.object({
  passed: z.boolean(),
});

export const resolveSchema = z.object({
  resolutionNote: z.string().trim().min(8).max(1000),
});
