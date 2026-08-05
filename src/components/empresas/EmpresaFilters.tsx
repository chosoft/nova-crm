"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function EmpresaFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modalidad = searchParams.get("modalidad") ?? "";
  const estado = searchParams.get("estado") ?? "";

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/empresas?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        aria-label="Filtrar por modalidad"
        value={modalidad}
        onChange={(e) => updateFilters("modalidad", e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
      >
        <option value="">Todas las modalidades</option>
        <option value="stand">Stand</option>
        <option value="patrocinador">Patrocinador</option>
      </select>

      <select
        aria-label="Filtrar por estado"
        value={estado}
        onChange={(e) => updateFilters("estado", e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
      >
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="contactada">Contactada</option>
        <option value="confirmada">Confirmada</option>
        <option value="rechazada">Rechazada</option>
      </select>
    </div>
  );
}
