"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, LoginState } from "@/actions/auth";
import { loginSchema } from "@/lib/validations/auth";
import { useRef, useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Iniciando sesión..." : "Iniciar sesión"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState | undefined, FormData>(
    loginAction,
    undefined
  );
  const [clientErrors, setClientErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(rawData);

    if (!result.success) {
      setClientErrors(
        result.error.flatten().fieldErrors as {
          email?: string[];
          password?: string[];
        }
      );
      return;
    }

    setClientErrors({});
    formAction(formData);
  }

  const errors = {
    email: clientErrors.email || state?.errors?.email,
    password: clientErrors.password || state?.errors?.password,
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Nova CRM</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Inicia sesión para continuar
          </p>
        </div>

        {state?.message && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {state.message}
          </div>
        )}

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
                errors.email
                  ? "border-red-300 focus:ring-red-500"
                  : "border-neutral-300"
              }`}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
                errors.password
                  ? "border-red-300 focus:ring-red-500"
                  : "border-neutral-300"
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password[0]}
              </p>
            )}
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
