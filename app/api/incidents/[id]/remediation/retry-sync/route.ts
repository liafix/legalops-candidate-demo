import { retrySynchronization } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return ok(await retrySynchronization(id));
  } catch (error) {
    return fail(error);
  }
}
