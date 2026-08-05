import { z } from "zod";

export const eventoSchema = z.object({
  fecha: z
    .string()
    .min(1, { message: "La fecha es obligatoria" })
    .refine((d) => new Date(d) > new Date(), {
      message: "La fecha debe ser futura",
    }),
  descripcion: z
    .string()
    .min(1, { message: "La descripción es obligatoria" })
    .max(300, { message: "La descripción no puede exceder 300 caracteres" }),
});

export type EventoInput = z.infer<typeof eventoSchema>;
