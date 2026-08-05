export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EliminarMiembroButton } from "@/components/miembros/EliminarMiembroButton";

export default async function MiembrosPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/empresas");
  }

  const miembros = await prisma.user.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Miembros</h1>
          <Link
            href="/miembros/nuevo"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Nuevo Miembro
          </Link>
        </div>

        {/* List */}
        {miembros.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No hay miembros registrados.
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {miembros.map((miembro) => (
                  <tr key={miembro.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {miembro.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {miembro.email}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-600">
                      {miembro.role}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/miembros/${miembro.id}`}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                        {miembro.role !== "admin" && (
                          <EliminarMiembroButton
                            miembroId={miembro.id}
                            miembroNombre={miembro.nombre}
                          />
                        )}
                      </div>
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
