export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { MiembroForm } from "@/components/miembros/MiembroForm";

interface EditarMiembroPageProps {
  params: { id: string };
}

export default async function EditarMiembroPage({ params }: EditarMiembroPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/empresas");
  }

  const miembro = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  });

  if (!miembro) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Editar Miembro
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Modifica los datos del miembro. La contraseña solo se actualiza si ingresas una nueva.
          </p>
        </div>

        <MiembroForm
          mode="edit"
          miembro={miembro}
        />
      </div>
    </div>
  );
}
