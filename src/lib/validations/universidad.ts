import { z } from "zod";

export const universidadSchema = z.object({
  nombre: z
    .string()
    .min(1, { message: "El nombre de la universidad es obligatorio" })
    .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
  nombreContacto: z
    .string()
    .min(1, { message: "El nombre de contacto es obligatorio" })
    .max(80, { message: "El nombre de contacto no puede exceder 80 caracteres" }),
  numeroContacto: z
    .string()
    .regex(/^\d{7,15}$/, {
      message: "El número de contacto debe contener entre 7 y 15 dígitos numéricos",
    }),
});

export type UniversidadInput = z.infer<typeof universidadSchema>;
