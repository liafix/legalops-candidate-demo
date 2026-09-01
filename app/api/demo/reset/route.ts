import { resetDemo } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

export async function POST() {
  try {
    return ok(await resetDemo());
  } catch (error) {
    return fail(error);
  }
}
