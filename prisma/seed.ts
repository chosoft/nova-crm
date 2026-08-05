import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
  const prisma = new PrismaClient({ adapter });

  const adminHash = await bcrypt.hash("admin123", 10);
  const miembroHash = await bcrypt.hash("miembro123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nova.com" },
    update: {},
    create: {
      email: "admin@nova.com",
      passwordHash: adminHash,
      nombre: "Admin Nova",
      role: "admin",
    },
  });

  const miembro = await prisma.user.upsert({
    where: { email: "miembro@nova.com" },
    update: {},
    create: {
      email: "miembro@nova.com",
      passwordHash: miembroHash,
      nombre: "Juan Pérez",
      role: "miembro",
    },
  });

  console.log("Users created:");
  console.log(`  Admin: ${admin.email} / admin123`);
  console.log(`  Miembro: ${miembro.email} / miembro123`);

  await prisma.$disconnect();
}

main().catch(console.error);
