export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { UniversidadForm } from "@/components/universidades/UniversidadForm";

export default async function NuevaUniversidadPage() {
  const miembros = await prisma.user.findMany({
    where: { role: "miembro" },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Registrar Universidad
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los datos para registrar una nueva universidad en el sistema.
          </p>
        </div>

        <UniversidadForm miembros={miembros} />
      </div>
    </div>
  );
}
