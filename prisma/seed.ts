import { prisma } from "../lib/db/prisma";
import { seedDemo } from "../lib/demo/seed";

seedDemo()
  .then((result) => {
    console.log("Seeded LegalOps demo", result);
  })
  .finally(() => prisma.$disconnect());
