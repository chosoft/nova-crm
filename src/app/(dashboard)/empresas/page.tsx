export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { EmpresaFilters } from "@/components/empresas/EmpresaFilters";
import { EstadoBadge } from "@/components/empresas/EstadoBadge";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";
type Modalidad = "stand" | "patrocinador";

const validEstados: Estado[] = ["pendiente", "contactada", "confirmada", "rechazada"];
const validModalidades: Modalidad[] = ["stand", "patrocinador"];

interface EmpresasPageProps {
  searchParams: { modalidad?: string; estado?: string };
}

export default async function EmpresasPage({ searchParams }: EmpresasPageProps) {
  const { modalidad, estado } = searchParams;

  // Build Prisma where clause from filters
  const where: Prisma.EmpresaWhereInput = {};
  if (modalidad && validModalidades.includes(modalidad as Modalidad)) {
    where.modalidad = modalidad as Modalidad;
  }
  if (estado && validEstados.includes(estado as Estado)) {
    where.estado = estado as Estado;
  }

  const empresas = await prisma.empresa.findMany({
    where,
    orderBy: { nombre: "asc" },
    include: { miembro: { select: { nombre: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Empresas</h1>
          <Link
            href="/empresas/nueva"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Nueva Empresa
          </Link>
        </div>

        {/* Filters */}
        <EmpresaFilters />

        {/* List */}
        {empresas.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No hay empresas para mostrar.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Modalidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Miembro asignado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/empresas/${empresa.id}`}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        {empresa.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-600">
                      {empresa.modalidad}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={empresa.estado as Estado} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {empresa.miembro.nombre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
