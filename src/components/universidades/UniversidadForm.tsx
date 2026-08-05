"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { universidadSchema } from "@/lib/validations/universidad";
import { crearUniversidad, ActionResult } from "@/actions/universidades";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Registrando..." : "Registrar Universidad"}
    </button>
  );
}

export interface UniversidadFormState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  fieldValues?: {
    nombre?: string;
    nombreContacto?: string;
    numeroContacto?: string;
  };
}

async function submitUniversidad(
  prevState: UniversidadFormState | undefined,
  formData: FormData
): Promise<UniversidadFormState> {
  const rawData = {
    nombre: formData.get("nombre") as string,
    nombreContacto: formData.get("nombreContacto") as string,
    numeroContacto: formData.get("numeroContacto") as string,
  };

  // Client-side Zod validation
  const validationResult = universidadSchema.safeParse(rawData);

  if (!validationResult.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validationResult.error.issues) {
      const field = issue.path[0]?.toString() ?? "_form";
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return {
      errors: fieldErrors,
      success: false,
      fieldValues: rawData,
    };
  }

  // Call server action
  const result: ActionResult = await crearUniversidad(validationResult.data);

  if (!result.success) {
    return {
      errors: result.errors,
      message: result.message,
      success: false,
      fieldValues: rawData,
    };
  }

  return { success: true };
}

export function UniversidadForm() {
  const [state, formAction] = useFormState<UniversidadFormState | undefined, FormData>(
    submitUniversidad,
    undefined
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  // Redirect on success
  if (state?.success) {
    router.push("/universidades");
    return null;
  }

  const errors = {
    nombre: clientErrors.nombre || state?.errors?.nombre,
    nombreContacto: clientErrors.nombreContacto || state?.errors?.nombreContacto,
    numeroContacto: clientErrors.numeroContacto || state?.errors?.numeroContacto,
  };

  function handleSubmit(formData: FormData) {
    const rawData = {
      nombre: formData.get("nombre") as string,
      nombreContacto: formData.get("nombreContacto") as string,
      numeroContacto: formData.get("numeroContacto") as string,
    };

    const result = universidadSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString() ?? "_form";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }
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
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre de la universidad
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          maxLength={100}
          defaultValue={state?.fieldValues?.nombre ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.nombre
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300"
          }`}
          placeholder="Ej: Universidad de los Andes"
        />
        {errors.nombre && (
          <p className="mt-1 text-xs text-red-600">{errors.nombre[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="nombreContacto"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre de contacto
        </label>
        <input
          id="nombreContacto"
          name="nombreContacto"
          type="text"
          maxLength={80}
          defaultValue={state?.fieldValues?.nombreContacto ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.nombreContacto
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300"
          }`}
          placeholder="Ej: María López"
        />
        {errors.nombreContacto && (
          <p className="mt-1 text-xs text-red-600">{errors.nombreContacto[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="numeroContacto"
          className="block text-sm font-medium text-gray-700"
        >
          Número de contacto
        </label>
        <input
          id="numeroContacto"
          name="numeroContacto"
          type="text"
          defaultValue={state?.fieldValues?.numeroContacto ?? ""}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.numeroContacto
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300"
          }`}
          placeholder="Ej: 3001234567"
        />
        {errors.numeroContacto && (
          <p className="mt-1 text-xs text-red-600">{errors.numeroContacto[0]}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/universidades"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancelar
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
