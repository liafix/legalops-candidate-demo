import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-2 text-sm text-slate-500">
        Synthetic health state for the services involved in the incident scenario.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-xl border border-white/10 bg-[#0d1117] p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{service.name}</span>
              <Badge tone={service.status === "HEALTHY" ? "success" : "warning"}>
                {service.status}
              </Badge>
            </div>
            <div className="mt-3 font-mono text-xs text-slate-600">{service.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
