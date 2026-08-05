"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarMiembro } from "@/actions/miembros";

interface EliminarMiembroButtonProps {
  miembroId: string;
  miembroNombre: string;
}

export function EliminarMiembroButton({ miembroId, miembroNombre }: EliminarMiembroButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const result = await eliminarMiembro(miembroId);

    if (result.success) {
      router.refresh();
      setIsConfirming(false);
    } else {
      setError(result.message ?? "Error al eliminar el miembro.");
    }

    setIsDeleting(false);
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? "Eliminando..." : "Confirmar"}
        </button>
        <button
          onClick={() => { setIsConfirming(false); setError(null); }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}
