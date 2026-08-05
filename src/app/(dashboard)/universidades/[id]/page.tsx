import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EstadoBadge } from "@/components/empresas/EstadoBadge";
import { EventoForm } from "@/components/universidades/EventoForm";
import { CambiarEstadoUniversidad } from "@/components/universidades/CambiarEstadoUniversidad";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

interface UniversidadDetailPageProps {
  params: { id: string };
}

export default async function UniversidadDetailPage({
  params,
}: UniversidadDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const universidad = await prisma.universidad.findUnique({
    where: { id: params.id },
    include: {
      miembro: { select: { nombre: true } },
      eventos: {
        orderBy: { fecha: "desc" },
      },
    },
  });

  if (!universidad) {
    notFound();
  }

  const isAdmin = session.user.role === "admin";
  const isConfirmada = universidad.estado === "confirmada";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        {/* Back link */}
        <Link
          href="/universidades"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a universidades
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {universidad.nombre}
            </h1>
            <div className="mt-2">
              <EstadoBadge estado={universidad.estado as Estado} />
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">Información</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Nombre de contacto
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {universidad.nombreContacto}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Número de contacto
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {universidad.numeroContacto}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Miembro asignado
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {universidad.miembro.nombre}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Fecha de registro
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(universidad.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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
            <CambiarEstadoUniversidad
              universidadId={universidad.id}
              estadoActual={universidad.estado as Estado}
            />
          </div>
        )}

        {/* Event scheduling - only if confirmada */}
        {isConfirmada && (
          <EventoForm universidadId={universidad.id} />
        )}

        {/* Event history */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Eventos de Difusión
          </h2>

          {universidad.eventos.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No hay eventos agendados para esta universidad.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-200">
              {universidad.eventos.map((evento) => (
                <li key={evento.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evento.descripcion}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(evento.fecha).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
