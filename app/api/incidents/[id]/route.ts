import { getIncident } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return ok(await getIncident(id));
  } catch (error) {
    return fail(error);
  }
}
