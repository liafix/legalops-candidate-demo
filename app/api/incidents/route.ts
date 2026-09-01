import { prisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/services/http";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      include: { service: true },
      orderBy: { reportedAt: "desc" },
    });
    return ok(incidents);
  } catch (error) {
    return fail(error);
  }
}
