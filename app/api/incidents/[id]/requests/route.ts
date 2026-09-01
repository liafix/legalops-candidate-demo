import { getRequests } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return ok(await getRequests(id));
  } catch (error) {
    return fail(error);
  }
}
