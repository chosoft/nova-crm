export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EstadoBadge } from "@/components/empresas/EstadoBadge";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

export default async function UniversidadesPage() {
  const universidades = await prisma.universidad.findMany({
    orderBy: { nombre: "asc" },
    include: {
      miembro: { select: { nombre: true } },
      eventos: {
        orderBy: { fecha: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Universidades</h1>
          <Link
            href="/universidades/nueva"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Nueva Universidad
          </Link>
        </div>

        {/* List */}
        {universidades.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No hay universidades para mostrar.
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
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Miembro asignado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha evento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {universidades.map((universidad) => {
                  const ultimoEvento = universidad.eventos[0];
                  return (
                    <tr key={universidad.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/universidades/${universidad.id}`}
                          className="text-sm font-medium text-gray-900 hover:underline"
                        >
                          {universidad.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={universidad.estado as Estado} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {universidad.miembro.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ultimoEvento
                          ? new Date(ultimoEvento.fecha).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Sin evento agendado"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
