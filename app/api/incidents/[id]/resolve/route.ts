import { resolveIncident } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";
import { resolveSchema } from "@/lib/validation/schemas";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = resolveSchema.parse(await request.json());
    return ok(await resolveIncident(id, body.resolutionNote));
  } catch (error) {
    return fail(error);
  }
}
