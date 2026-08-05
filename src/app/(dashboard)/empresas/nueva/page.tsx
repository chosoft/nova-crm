export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { EmpresaForm } from "@/components/empresas/EmpresaForm";

export default async function NuevaEmpresaPage() {
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
            Registrar Empresa
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los datos para registrar una nueva empresa en el sistema.
          </p>
        </div>

        <EmpresaForm miembros={miembros} />
      </div>
    </div>
  );
}
