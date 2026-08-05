"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { empresaSchema } from "@/lib/validations/empresa";
import { handleDatabaseError } from "@/lib/errors";

export interface ActionResult {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  data?: unknown;
}

export async function crearEmpresa(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  // 1. Get miembroId from form (required)
  const session = await auth();
  const miembroId = formData.get("miembroId") as string;

  if (!miembroId) {
    return {
      success: false,
      errors: { miembroId: ["Debes seleccionar quién reclutó esta empresa"] },
    };
  }

  // 2. Extract and validate input
  const rawData = {
    nombre: formData.get("nombre") as string,
    numeroContacto: formData.get("numeroContacto") as string,
    descripcion: formData.get("descripcion") as string,
    modalidad: formData.get("modalidad") as string,
  };

  const validationResult = empresaSchema.safeParse(rawData);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { nombre, numeroContacto, descripcion, modalidad } =
    validationResult.data;

  try {
    // 3. Check for duplicate nombre
    const existing = await prisma.empresa.findUnique({
      where: { nombre },
    });

    if (existing) {
      return {
        success: false,
        errors: {
          nombre: ["El nombre de empresa ya se encuentra registrado"],
        },
      };
    }

    // 4. Create empresa with estado="pendiente" linked to authenticated user
    const empresa = await prisma.empresa.create({
      data: {
        nombre,
        numeroContacto,
        descripcion,
        modalidad,
        estado: "pendiente",
        miembroId: miembroId,
      },
    });

    return {
      success: true,
      message: "Empresa registrada exitosamente.",
      data: { id: empresa.id },
    };
  } catch (error: unknown) {
    return handleDatabaseError(error, {
      uniqueConstraintField: "nombre",
      uniqueConstraintMessage: "El nombre de empresa ya se encuentra registrado",
    });
  }
}

export async function cambiarEstadoEmpresa(
  empresaId: string,
  nuevoEstado: "pendiente" | "contactada" | "confirmada" | "rechazada"
): Promise<ActionResult> {
  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      message: "Debes iniciar sesión para realizar esta acción.",
    };
  }

  // 2. Check admin role
  if (session.user.role !== "admin") {
    return {
      success: false,
      message: "Solo el administrador puede modificar estados",
    };
  }

  try {
    // 3. Find empresa by ID
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return {
        success: false,
        message: "La empresa no fue encontrada.",
      };
    }

    // 4. Same-state no-op check
    if (empresa.estado === nuevoEstado) {
      return {
        success: true,
      };
    }

    // 5. Update estado and create historial entry in a transaction
    await prisma.$transaction([
      prisma.empresa.update({
        where: { id: empresaId },
        data: { estado: nuevoEstado },
      }),
      prisma.empresaHistorial.create({
        data: {
          empresaId,
          estadoAnterior: empresa.estado,
          estadoNuevo: nuevoEstado,
          fechaCambio: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: "Estado actualizado exitosamente.",
    };
  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}
