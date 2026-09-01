import { transitionIncident } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";
import { incidentStatusSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = incidentStatusSchema.parse(await request.json());
    return ok(await transitionIncident(id, body.status));
  } catch (error) {
    return fail(error);
  }
}
