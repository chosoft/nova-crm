"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoEmpresa } from "@/actions/empresas";
import { useRouter } from "next/navigation";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

interface CambiarEstadoEmpresaProps {
  empresaId: string;
  estadoActual: Estado;
}

const estadoOptions: { value: Estado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "contactada", label: "Contactada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "rechazada", label: "Rechazada" },
];

export function CambiarEstadoEmpresa({
  empresaId,
  estadoActual,
}: CambiarEstadoEmpresaProps) {
  const [estado, setEstado] = useState<Estado>(estadoActual);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoEstado = e.target.value as Estado;
    setEstado(nuevoEstado);
    setMessage(null);

    if (nuevoEstado === estadoActual) {
      return;
    }

    startTransition(async () => {
      const result = await cambiarEstadoEmpresa(empresaId, nuevoEstado);
      if (result.success) {
        setMessage("Estado actualizado correctamente.");
        router.refresh();
      } else {
        setMessage(result.message ?? "Error al cambiar el estado.");
        setEstado(estadoActual);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="estado-empresa-select"
        className="block text-sm font-medium text-gray-700"
      >
        Cambiar estado
      </label>
      <select
        id="estado-empresa-select"
        value={estado}
        onChange={handleChange}
        disabled={isPending}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {estadoOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {message && (
        <p
          className={`text-xs ${
            message.includes("correctamente") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
