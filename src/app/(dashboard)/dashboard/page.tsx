import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { MemberMetrics } from "@/components/dashboard/MemberMetrics";
import { EstadoSummary } from "@/components/dashboard/EstadoSummary";
import { EmptyState } from "@/components/ui/EmptyState";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/empresas");
  }

  // Fetch all miembros with their empresas and universidades
  const miembros = await prisma.user.findMany({
    where: { role: "miembro" },
    include: {
      empresas: { select: { estado: true } },
      universidades: { select: { estado: true } },
    },
    orderBy: { nombre: "asc" },
  });

  // Compute estado summary: total empresas grouped by estado
  const estadoSummaryResult = await prisma.empresa.groupBy({
    by: ["estado"],
    _count: { id: true },
  });

  // Build resumen record with all 4 estados (default to 0)
  const resumen: Record<Estado, number> = {
    pendiente: 0,
    contactada: 0,
    confirmada: 0,
    rechazada: 0,
  };

  for (const group of estadoSummaryResult) {
    resumen[group.estado as Estado] = group._count.id;
  }

  // Compute per-member metrics
  const memberMetrics = miembros.map((miembro) => ({
    nombre: miembro.nombre,
    totalEmpresas: miembro.empresas.length,
    empresasConfirmadas: miembro.empresas.filter(
      (e) => e.estado === "confirmada"
    ).length,
    totalUniversidades: miembro.universidades.length,
    universidadesConfirmadas: miembro.universidades.filter(
      (u) => u.estado === "confirmada"
    ).length,
  }));

  // Check if there's any data at all
  const totalEmpresas = Object.values(resumen).reduce((a, b) => a + b, 0);
  const totalUniversidades = miembros.reduce(
    (acc, m) => acc + m.universidades.length,
    0
  );
  const hasNoData = totalEmpresas === 0 && totalUniversidades === 0;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {hasNoData ? (
        <EmptyState message="No hay datos disponibles" />
      ) : (
        <>
          {/* Estado Summary */}
          <section>
            <EstadoSummary resumen={resumen} />
          </section>

          {/* Member Metrics */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Métricas por Miembro
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {memberMetrics.map((miembro) => (
                <MemberMetrics key={miembro.nombre} miembro={miembro} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
