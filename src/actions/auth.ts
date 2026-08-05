"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export interface LoginState {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // 1. Client-side compatible Zod validation
  const validationResult = loginSchema.safeParse(rawData);

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors as {
        email?: string[];
        password?: string[];
      },
      message: undefined,
      success: false,
    };
  }

  // 2. Attempt sign in with Auth.js
  try {
    await signIn("credentials", {
      email: validationResult.data.email,
      password: validationResult.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const errorMessage = error.cause?.err?.message;

      if (
        errorMessage ===
        "Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en 15 minutos"
      ) {
        return {
          message:
            "Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en 15 minutos",
          success: false,
        };
      }

      return {
        message: "Correo electrónico o contraseña incorrectos",
        success: false,
      };
    }

    // Re-throw NEXT_REDIRECT errors (from redirect())
    throw error;
  }

  // 3. On success, get session to determine role and redirect
  const session = await auth();
  const role = session?.user?.role;

  if (role === "admin") {
    redirect("/dashboard");
  } else {
    redirect("/empresas");
  }
}


export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
