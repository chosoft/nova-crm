"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleDatabaseError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface ActionResult {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  data?: unknown;
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Ingresa un correo electrónico válido";
  }
  return null;
}

function validateNombre(nombre: string): string | null {
  if (!nombre || nombre.trim().length === 0) {
    return "El nombre es obligatorio";
  }
  if (nombre.trim().length > 100) {
    return "El nombre no puede tener más de 100 caracteres";
  }
  return null;
}

function validatePassword(password: string, required: boolean): string | null {
  if (!password && required) {
    return "La contraseña es obligatoria";
  }
  if (password && password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres";
  }
  return null;
}

// ─── Server Actions ──────────────────────────────────────────────────────────

export async function crearMiembro(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  // 1. Authenticate and check admin
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Debes iniciar sesión para realizar esta acción." };
  }
  if (session.user.role !== "admin") {
    return { success: false, message: "Solo el administrador puede gestionar miembros." };
  }

  // 2. Extract fields
  const nombre = (formData.get("nombre") as string) ?? "";
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  // 3. Validate
  const errors: Record<string, string[]> = {};
  const nombreError = validateNombre(nombre);
  if (nombreError) errors.nombre = [nombreError];
  const emailError = validateEmail(email);
  if (emailError) errors.email = [emailError];
  const passwordError = validatePassword(password, true);
  if (passwordError) errors.password = [passwordError];

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    // 4. Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        success: false,
        errors: { email: ["Este correo electrónico ya está registrado"] },
      };
    }

    // 5. Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "miembro",
      },
    });

    revalidatePath("/miembros");

    return {
      success: true,
      message: "Miembro creado exitosamente.",
      data: { id: user.id },
    };
  } catch (error: unknown) {
    return handleDatabaseError(error, {
      uniqueConstraintField: "email",
      uniqueConstraintMessage: "Este correo electrónico ya está registrado",
    });
  }
}

export async function editarMiembro(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  // 1. Authenticate and check admin
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Debes iniciar sesión para realizar esta acción." };
  }
  if (session.user.role !== "admin") {
    return { success: false, message: "Solo el administrador puede gestionar miembros." };
  }

  // 2. Extract fields
  const id = formData.get("id") as string;
  const nombre = (formData.get("nombre") as string) ?? "";
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!id) {
    return { success: false, message: "ID de miembro no proporcionado." };
  }

  // 3. Validate
  const errors: Record<string, string[]> = {};
  const nombreError = validateNombre(nombre);
  if (nombreError) errors.nombre = [nombreError];
  const emailError = validateEmail(email);
  if (emailError) errors.email = [emailError];
  const passwordError = validatePassword(password, false);
  if (passwordError) errors.password = [passwordError];

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    // 4. Check user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, message: "El miembro no fue encontrado." };
    }

    // 5. Check email uniqueness (if changed)
    if (email.trim().toLowerCase() !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existing) {
        return {
          success: false,
          errors: { email: ["Este correo electrónico ya está registrado"] },
        };
      }
    }

    // 6. Build update data
    const updateData: { nombre: string; email: string; passwordHash?: string } = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/miembros");

    return {
      success: true,
      message: "Miembro actualizado exitosamente.",
    };
  } catch (error: unknown) {
    return handleDatabaseError(error, {
      uniqueConstraintField: "email",
      uniqueConstraintMessage: "Este correo electrónico ya está registrado",
    });
  }
}

export async function eliminarMiembro(id: string): Promise<ActionResult> {
  // 1. Authenticate and check admin
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Debes iniciar sesión para realizar esta acción." };
  }
  if (session.user.role !== "admin") {
    return { success: false, message: "Solo el administrador puede gestionar miembros." };
  }

  if (!id) {
    return { success: false, message: "ID de miembro no proporcionado." };
  }

  // 2. Cannot delete yourself
  if (id === session.user.id) {
    return { success: false, message: "No puedes eliminar tu propia cuenta." };
  }

  try {
    // 3. Check user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, message: "El miembro no fue encontrado." };
    }

    // 4. Check if user has empresas or universidades assigned
    const empresasCount = await prisma.empresa.count({ where: { miembroId: id } });
    if (empresasCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar: el miembro tiene ${empresasCount} empresa(s) asignada(s).`,
      };
    }

    const universidadesCount = await prisma.universidad.count({ where: { miembroId: id } });
    if (universidadesCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar: el miembro tiene ${universidadesCount} universidad(es) asignada(s).`,
      };
    }

    // 5. Delete user
    await prisma.user.delete({ where: { id } });

    revalidatePath("/miembros");

    return {
      success: true,
      message: "Miembro eliminado exitosamente.",
    };
  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}
