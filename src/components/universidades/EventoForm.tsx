"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { eventoSchema } from "@/lib/validations/evento";
import { agendarEvento, ActionResult } from "@/actions/universidades";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Agendando..." : "Agendar Evento"}
    </button>
  );
}

interface EventoFormProps {
  universidadId: string;
}

export interface EventoFormState {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  fieldValues?: {
    fecha?: string;
    descripcion?: string;
  };
}

export function EventoForm({ universidadId }: EventoFormProps) {
  const router = useRouter();

  async function submitEvento(
    prevState: EventoFormState | undefined,
    formData: FormData
  ): Promise<EventoFormState> {
    const rawData = {
      fecha: formData.get("fecha") as string,
      descripcion: formData.get("descripcion") as string,
    };

    // Client-side validation
    const validationResult = eventoSchema.safeParse(rawData);

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
    const result: ActionResult = await agendarEvento({
      universidadId,
      fecha: validationResult.data.fecha,
      descripcion: validationResult.data.descripcion,
    });

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

  const [state, formAction] = useFormState<EventoFormState | undefined, FormData>(
    submitEvento,
    undefined
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});

  // Refresh the page on success to show the new event
  if (state?.success) {
    router.refresh();
  }

  const errors = {
    fecha: clientErrors.fecha || state?.errors?.fecha,
    descripcion: clientErrors.descripcion || state?.errors?.descripcion,
  };

  function handleSubmit(formData: FormData) {
    const rawData = {
      fecha: formData.get("fecha") as string,
      descripcion: formData.get("descripcion") as string,
    };

    const result = eventoSchema.safeParse(rawData);

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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-medium text-gray-900">Agendar Evento de Difusión</h3>
      <p className="mt-1 text-sm text-gray-500">
        Programa un nuevo evento para esta universidad.
      </p>

      <form action={handleSubmit} className="mt-4 space-y-4">
        {state?.message && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {state.message}
          </div>
        )}

        {state?.success && (
          <div
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            Evento agendado exitosamente.
          </div>
        )}

        <div>
          <label
            htmlFor="fecha"
            className="block text-sm font-medium text-gray-700"
          >
            Fecha del evento
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={state?.fieldValues?.fecha ?? ""}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.fecha
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.fecha && (
            <p className="mt-1 text-xs text-red-600">{errors.fecha[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-gray-700"
          >
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            maxLength={300}
            rows={3}
            defaultValue={state?.fieldValues?.descripcion ?? ""}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.descripcion
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300"
            }`}
            placeholder="Describe el evento de difusión..."
          />
          {errors.descripcion && (
            <p className="mt-1 text-xs text-red-600">{errors.descripcion[0]}</p>
          )}
        </div>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
