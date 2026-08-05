import { describe, it, expect } from "vitest";
import { cn, sanitizeErrorMessage, formatDate } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });
});

describe("sanitizeErrorMessage", () => {
  it("sanitizes database connection errors", () => {
    const error = new Error("Connection refused to postgresql://host:5432/db");
    expect(sanitizeErrorMessage(error)).toBe(
      "El servicio no está disponible temporalmente. Por favor, intente de nuevo en unos minutos."
    );
  });

  it("sanitizes Prisma errors", () => {
    const error = new Error("PrismaClientKnownRequestError: connection timeout");
    expect(sanitizeErrorMessage(error)).toBe(
      "El servicio no está disponible temporalmente. Por favor, intente de nuevo en unos minutos."
    );
  });

  it("returns generic message for unknown errors", () => {
    const error = "something went wrong";
    expect(sanitizeErrorMessage(error)).toBe(
      "Ocurrió un error inesperado. Por favor, intente de nuevo."
    );
  });
});

describe("formatDate", () => {
  it("formats a date in Spanish locale", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("marzo");
  });
});
