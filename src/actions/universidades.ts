"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { universidadSchema, eventoSchema } from "@/lib/validations";
import { handleDatabaseError } from "@/lib/errors";

export type ActionResult = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  data?: unknown;
};

export async function crearUniversidad(
  input: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    const miembroId = session?.user?.id || "public-user";

    const parsed = universidadSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "_form";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }
      return { success: false, errors: fieldErrors };
    }

    const universidad = await prisma.universidad.create({
      data: {
        nombre: parsed.data.nombre,
        nombreContacto: parsed.data.nombreContacto,
        numeroContacto: parsed.data.numeroContacto,
        estado: "pendiente",
        miembroId: miembroId,
      },
    });

    return { success: true, data: universidad };
  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}

export async function cambiarEstadoUniversidad(
  universidadId: string,
  nuevoEstado: "pendiente" | "contactada" | "confirmada" | "rechazada"
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "Debe iniciar sesión para realizar esta acción",
      };
    }

    if (session.user.role !== "admin") {
      return {
        success: false,
        message:
          "Solo el administrador puede modificar estados de universidades",
      };
    }

    const universidad = await prisma.universidad.findUnique({
      where: { id: universidadId },
    });

    if (!universidad) {
      return {
        success: false,
        message: "Universidad no encontrada",
      };
    }

    if (universidad.estado === nuevoEstado) {
      return { success: true, data: universidad };
    }

    const updated = await prisma.universidad.update({
      where: { id: universidadId },
      data: { estado: nuevoEstado },
    });

    return { success: true, data: updated };
  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}

export async function agendarEvento(
  input: unknown
): Promise<ActionResult> {
  try {

    const rawInput = input as { universidadId?: string; fecha?: string; descripcion?: string };
    const universidadId = rawInput?.universidadId;

    if (!universidadId) {
      return {
        success: false,
        errors: { universidadId: ["El ID de la universidad es obligatorio"] },
      };
    }

    const universidad = await prisma.universidad.findUnique({
      where: { id: universidadId },
    });

    if (!universidad) {
      return {
        success: false,
        message: "Universidad no encontrada",
      };
    }

    if (universidad.estado !== "confirmada") {
      return {
        success: false,
        message:
          "La universidad debe estar confirmada para agendar eventos",
      };
    }

    const parsed = eventoSchema.safeParse({
      fecha: rawInput.fecha,
      descripcion: rawInput.descripcion,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "_form";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }
      return { success: false, errors: fieldErrors };
    }

    const evento = await prisma.eventoDifusion.create({
      data: {
        universidadId,
        fecha: new Date(parsed.data.fecha),
        descripcion: parsed.data.descripcion,
      },
    });

    return { success: true, data: evento };
  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}
