import { z } from "zod";

export const empresaSchema = z.object({
  nombre: z
    .string()
    .min(1, { message: "El nombre de la empresa es obligatorio" })
    .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
  numeroContacto: z
    .string()
    .regex(/^\d{7,15}$/, {
      message: "El número de contacto debe contener entre 7 y 15 dígitos numéricos",
    }),
  descripcion: z
    .string()
    .min(1, { message: "La descripción es obligatoria" })
    .max(500, { message: "La descripción no puede exceder 500 caracteres" }),
  modalidad: z.enum(["stand", "patrocinador"], {
    message: "La modalidad debe ser 'stand' o 'patrocinador'",
  }),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
