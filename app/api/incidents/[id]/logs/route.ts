import { getLogs } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

const severities = new Set(["INFO", "WARN", "ERROR"]);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const severityValue = url.searchParams.get("severity") ?? undefined;
    const requestId = url.searchParams.get("requestId")?.trim() || undefined;
    const severity =
      severityValue && severities.has(severityValue)
        ? (severityValue as "INFO" | "WARN" | "ERROR")
        : undefined;

    return ok(await getLogs(id, { severity, requestId }));
  } catch (error) {
    return fail(error);
  }
}
