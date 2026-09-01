import { updateQaCheck } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";
import { qaUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; checkId: string }> },
) {
  try {
    const { id, checkId } = await context.params;
    const body = qaUpdateSchema.parse(await request.json());
    return ok(await updateQaCheck(id, checkId, body.passed));
  } catch (error) {
    return fail(error);
  }
}
