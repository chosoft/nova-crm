"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { empresaSchema } from "@/lib/validations/empresa";
import { crearEmpresa, ActionResult } from "@/actions/empresas";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Registrando..." : "Registrar Empresa"}
    </button>
  );
}

interface Miembro {
  id: string;
  nombre: string;
}

interface EmpresaFormProps {
  miembros: Miembro[];
}

export interface EmpresaFormState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  fieldValues?: {
    nombre?: string;
    numeroContacto?: string;
    descripcion?: string;
    modalidad?: string;
    miembroId?: string;
  };
}

async function submitEmpresa(
  prevState: EmpresaFormState | undefined,
  formData: FormData
): Promise<EmpresaFormState> {
  const rawData = {
    nombre: formData.get("nombre") as string,
    numeroContacto: formData.get("numeroContacto") as string,
    descripcion: formData.get("descripcion") as string,
    modalidad: formData.get("modalidad") as string,
  };

  // Client-side Zod validation (without miembroId — that's validated server-side)
  const validationResult = empresaSchema.safeParse(rawData);
  const miembroId = formData.get("miembroId") as string;

  const fieldErrors: Record<string, string[]> = {};

  if (!validationResult.success) {
    for (const issue of validationResult.error.issues) {
      const field = issue.path[0]?.toString() ?? "_form";
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
  }

  if (!miembroId) {
    fieldErrors.miembroId = ["Debes seleccionar quién reclutó esta empresa"];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      errors: fieldErrors,
      success: false,
      fieldValues: { ...rawData, miembroId },
    };
  }

  // Call server action
  const result: ActionResult = await crearEmpresa(undefined, formData);

  if (!result.success) {
    return {
      errors: result.errors,
      message: result.message,
      success: false,
      fieldValues: { ...rawData, miembroId },
    };
  }

  return { success: true };
}

export function EmpresaForm({ miembros }: EmpresaFormProps) {
  const [state, formAction] = useFormState<EmpresaFormState | undefined, FormData>(
    submitEmpresa,
    undefined
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  if (state?.success) {
    router.push("/empresas");
    return null;
  }

  const errors = {
    nombre: clientErrors.nombre || state?.errors?.nombre,
    numeroContacto: clientErrors.numeroContacto || state?.errors?.numeroContacto,
    descripcion: clientErrors.descripcion || state?.errors?.descripcion,
    modalidad: clientErrors.modalidad || state?.errors?.modalidad,
    miembroId: clientErrors.miembroId || state?.errors?.miembroId,
  };

  function handleSubmit(formData: FormData) {
    const rawData = {
      nombre: formData.get("nombre") as string,
      numeroContacto: formData.get("numeroContacto") as string,
      descripcion: formData.get("descripcion") as string,
      modalidad: formData.get("modalidad") as string,
    };
    const miembroId = formData.get("miembroId") as string;

    const result = empresaSchema.safeParse(rawData);
    const fieldErrors: Record<string, string[]> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString() ?? "_form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
    }

    if (!miembroId) {
      fieldErrors.miembroId = ["Debes seleccionar quién reclutó esta empresa"];
    }

    if (Object.keys(fieldErrors).length > 0) {
      setClientErrors(fieldErrors);
      return;
    }

    setClientErrors({});
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
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
          Nombre de la empresa
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          maxLength={100}
          defaultValue={state?.fieldValues?.nombre ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.nombre ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder="Ej: Coca-Cola"
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre[0]}</p>}
      </div>

      <div>
        <label htmlFor="numeroContacto" className="block text-sm font-medium text-gray-700">
          Número de contacto
        </label>
        <input
          id="numeroContacto"
          name="numeroContacto"
          type="text"
          defaultValue={state?.fieldValues?.numeroContacto ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.numeroContacto ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder="Ej: 3001234567"
        />
        {errors.numeroContacto && <p className="mt-1 text-xs text-red-600">{errors.numeroContacto[0]}</p>}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          maxLength={500}
          rows={4}
          defaultValue={state?.fieldValues?.descripcion ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.descripcion ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder="Breve descripción de la empresa y su relación con Nova"
        />
        {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion[0]}</p>}
      </div>

      <div>
        <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700">
          Modalidad
        </label>
        <select
          id="modalidad"
          name="modalidad"
          defaultValue={state?.fieldValues?.modalidad ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.modalidad ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Selecciona una modalidad</option>
          <option value="stand">Stand</option>
          <option value="patrocinador">Patrocinador</option>
        </select>
        {errors.modalidad && <p className="mt-1 text-xs text-red-600">{errors.modalidad[0]}</p>}
      </div>

      <div>
        <label htmlFor="miembroId" className="block text-sm font-medium text-gray-700">
          Reclutado por
        </label>
        <select
          id="miembroId"
          name="miembroId"
          defaultValue={state?.fieldValues?.miembroId ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.miembroId ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Selecciona el miembro que reclutó</option>
          {miembros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        {errors.miembroId && <p className="mt-1 text-xs text-red-600">{errors.miembroId[0]}</p>}
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/empresas"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancelar
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
