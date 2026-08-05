export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EstadoBadge } from "@/components/empresas/EstadoBadge";
import { CambiarEstadoEmpresa } from "@/components/empresas/CambiarEstadoEmpresa";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

interface EmpresaDetailPageProps {
  params: { id: string };
}

export default async function EmpresaDetailPage({
  params,
}: EmpresaDetailPageProps) {
  const session = await auth();

  const isAdmin = session?.user?.role === "admin";

  const empresa = await prisma.empresa.findUnique({
    where: { id: params.id },
    include: {
      miembro: { select: { nombre: true } },
      historial: {
        orderBy: { fechaCambio: "desc" },
      },
    },
  });

  if (!empresa) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        {/* Back link */}
        <Link
          href="/empresas"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a empresas
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {empresa.nombre}
            </h1>
            <div className="mt-2">
              <EstadoBadge estado={empresa.estado as Estado} />
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">Información</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Modalidad</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {empresa.modalidad}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Número de contacto
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {empresa.numeroContacto}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Miembro asignado
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {empresa.miembro.nombre}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Fecha de registro
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(empresa.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {empresa.descripcion}
              </dd>
            </div>
          </dl>
        </div>

        {/* Admin: Change estado */}
        {isAdmin && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Administración
            </h2>
            <CambiarEstadoEmpresa
              empresaId={empresa.id}
              estadoActual={empresa.estado as Estado}
            />
          </div>
        )}

        {/* Historial de cambios de estado */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Historial de Cambios de Estado
          </h2>

          {empresa.historial.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No hay cambios de estado registrados para esta empresa.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      Fecha
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      Estado anterior
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      Estado nuevo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empresa.historial.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">
                        {new Date(entry.fechaCambio).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <EstadoBadge estado={entry.estadoAnterior as Estado} />
                      </td>
                      <td className="px-3 py-2">
                        <EstadoBadge estado={entry.estadoNuevo as Estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
