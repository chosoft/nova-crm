import { describe, it, expect } from "vitest";
import { empresaSchema } from "./empresa";
import { universidadSchema } from "./universidad";
import { eventoSchema } from "./evento";
import { loginSchema } from "./auth";

describe("empresaSchema", () => {
  it("accepts valid empresa input", () => {
    const input = {
      nombre: "Empresa Test",
      numeroContacto: "3001234567",
      descripcion: "Una descripción válida",
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects empty nombre", () => {
    const input = {
      nombre: "",
      numeroContacto: "3001234567",
      descripcion: "Descripción",
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects nombre exceeding 100 characters", () => {
    const input = {
      nombre: "a".repeat(101),
      numeroContacto: "3001234567",
      descripcion: "Descripción",
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric contacto", () => {
    const input = {
      nombre: "Empresa",
      numeroContacto: "abc1234",
      descripcion: "Descripción",
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects contacto with less than 7 digits", () => {
    const input = {
      nombre: "Empresa",
      numeroContacto: "123456",
      descripcion: "Descripción",
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects contacto with more than 15 digits", () => {
    const input = {
      nombre: "Empresa",
      numeroContacto: "1234567890123456",
      descripcion: "Descripción",
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid modalidad", () => {
    const input = {
      nombre: "Empresa",
      numeroContacto: "3001234567",
      descripcion: "Descripción",
      modalidad: "invalida",
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts 'patrocinador' modalidad", () => {
    const input = {
      nombre: "Empresa",
      numeroContacto: "3001234567",
      descripcion: "Descripción válida",
      modalidad: "patrocinador" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects descripcion exceeding 500 characters", () => {
    const input = {
      nombre: "Empresa",
      numeroContacto: "3001234567",
      descripcion: "a".repeat(501),
      modalidad: "stand" as const,
    };
    const result = empresaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("universidadSchema", () => {
  it("accepts valid universidad input", () => {
    const input = {
      nombre: "Universidad Icesi",
      nombreContacto: "Juan Pérez",
      numeroContacto: "3001234567",
    };
    const result = universidadSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects empty nombre", () => {
    const input = {
      nombre: "",
      nombreContacto: "Juan",
      numeroContacto: "3001234567",
    };
    const result = universidadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects nombreContacto exceeding 80 characters", () => {
    const input = {
      nombre: "Universidad",
      nombreContacto: "a".repeat(81),
      numeroContacto: "3001234567",
    };
    const result = universidadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric contacto", () => {
    const input = {
      nombre: "Universidad",
      nombreContacto: "Juan",
      numeroContacto: "abc1234567",
    };
    const result = universidadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("eventoSchema", () => {
  it("accepts valid evento with future date", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const input = {
      fecha: futureDate.toISOString(),
      descripcion: "Evento de difusión",
    };
    const result = eventoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects past date", () => {
    const input = {
      fecha: "2020-01-01",
      descripcion: "Evento pasado",
    };
    const result = eventoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty descripcion", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const input = {
      fecha: futureDate.toISOString(),
      descripcion: "",
    };
    const result = eventoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects descripcion exceeding 300 characters", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const input = {
      fecha: futureDate.toISOString(),
      descripcion: "a".repeat(301),
    };
    const result = eventoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const input = {
      email: "admin@nova.com",
      password: "secreto123",
    };
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const input = {
      email: "not-an-email",
      password: "secreto123",
    };
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const input = {
      email: "",
      password: "secreto123",
    };
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const input = {
      email: "admin@nova.com",
      password: "",
    };
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
