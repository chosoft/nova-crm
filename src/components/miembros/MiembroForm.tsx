"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { crearMiembro, editarMiembro, ActionResult } from "@/actions/miembros";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

interface MiembroFormProps {
  mode: "create" | "edit";
  miembro?: {
    id: string;
    nombre: string;
    email: string;
  };
}

export function MiembroForm({ mode, miembro }: MiembroFormProps) {
  const action = mode === "create" ? crearMiembro : editarMiembro;
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    action,
    undefined
  );
  const router = useRouter();

  if (state?.success) {
    router.push("/miembros");
    return null;
  }

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && miembro && (
        <input type="hidden" name="id" value={miembro.id} />
      )}

      {state?.message && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          maxLength={100}
          defaultValue={miembro?.nombre ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            state?.errors?.nombre ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder="Ej: Juan Pérez"
        />
        {state?.errors?.nombre && (
          <p className="mt-1 text-xs text-red-600">{state.errors.nombre[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={miembro?.email ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            state?.errors?.email ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder="Ej: juan@ejemplo.com"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña{mode === "edit" && " (dejar vacío para no cambiar)"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            state?.errors?.password ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Nueva contraseña (opcional)"}
        />
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/miembros"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancelar
        </a>
        <SubmitButton
          label={mode === "create" ? "Crear Miembro" : "Guardar Cambios"}
          pendingLabel={mode === "create" ? "Creando..." : "Guardando..."}
        />
      </div>
    </form>
  );
}
