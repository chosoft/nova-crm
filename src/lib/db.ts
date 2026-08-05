import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    // During build time, return a proxy that will throw at runtime if actually used
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "then" || prop === Symbol.toPrimitive) {
          return undefined;
        }
        throw new Error(
          `PrismaClient cannot be used during build. Missing POSTGRES_PRISMA_URL.`
        );
      },
    });
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
