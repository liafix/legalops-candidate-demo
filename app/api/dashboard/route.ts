import { getDashboard } from "@/lib/services/incidents";
import { fail, ok } from "@/lib/services/http";

export async function GET() {
  try {
    return ok(await getDashboard());
  } catch (error) {
    return fail(error);
  }
}
