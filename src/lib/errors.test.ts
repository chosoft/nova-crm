import { describe, it, expect } from "vitest";
import { handleDatabaseError, isSanitizedMessage, SENSITIVE_PATTERNS } from "./errors";

describe("handleDatabaseError", () => {
  it("returns connection error message for connect errors", () => {
    const error = new Error("Can't reach database server at `localhost`:`5432` - connect ECONNREFUSED");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("El servicio no está disponible temporalmente");
  });

  it("returns connection error message for timeout errors", () => {
    const error = new Error("Connection timeout after 5000ms");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("El servicio no está disponible temporalmente");
  });

  it("returns connection error message for ECONNREFUSED errors", () => {
    const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("El servicio no está disponible temporalmente");
  });

  it("returns connection error message for ENOTFOUND errors", () => {
    const error = new Error("getaddrinfo ENOTFOUND db.example.com");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("El servicio no está disponible temporalmente");
  });

  it("returns connection error message for EHOSTUNREACH errors", () => {
    const error = new Error("connect EHOSTUNREACH 10.0.0.1:5432");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("El servicio no está disponible temporalmente");
  });

  it("returns unique constraint error with custom field and message", () => {
    const error = new Error("Unique constraint failed on the fields: (`nombre`)");
    const result = handleDatabaseError(error, {
      uniqueConstraintField: "nombre",
      uniqueConstraintMessage: "El nombre de empresa ya se encuentra registrado",
    });
    expect(result.success).toBe(false);
    expect(result.errors).toEqual({
      nombre: ["El nombre de empresa ya se encuentra registrado"],
    });
  });

  it("returns generic unique constraint error without options", () => {
    const error = new Error("Unique constraint failed on the fields: (`nombre`)");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("El registro ya existe en el sistema");
  });

  it("detects P2002 Prisma error code", () => {
    const error = new Error("P2002: Unique constraint violation");
    const result = handleDatabaseError(error, {
      uniqueConstraintField: "nombre",
      uniqueConstraintMessage: "El nombre de empresa ya se encuentra registrado",
    });
    expect(result.success).toBe(false);
    expect(result.errors).toEqual({
      nombre: ["El nombre de empresa ya se encuentra registrado"],
    });
  });

  it("returns generic message for unknown errors", () => {
    const error = new Error("Some unexpected internal error");
    const result = handleDatabaseError(error);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Ocurrió un error inesperado. Por favor, intente de nuevo.");
  });

  it("returns generic message for non-Error objects", () => {
    const result = handleDatabaseError("string error");
    expect(result.success).toBe(false);
    expect(result.message).toBe("Ocurrió un error inesperado. Por favor, intente de nuevo.");
  });

  it("returns generic message for null/undefined errors", () => {
    const result = handleDatabaseError(null);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Ocurrió un error inesperado. Por favor, intente de nuevo.");
  });

  it("never exposes sensitive information in any returned message", () => {
    const sensitiveErrors = [
      new Error("connect ECONNREFUSED 192.168.1.100:5432"),
      new Error("postgresql://user:password@host:5432/db - connection refused"),
      new Error("Error at Object.query (/app/node_modules/prisma/index.js:123:45)"),
      new Error("SELECT * FROM users WHERE id = 1 - timeout"),
      new Error("POSTGRES_PRISMA_URL is not defined"),
    ];

    for (const error of sensitiveErrors) {
      const result = handleDatabaseError(error);
      expect(result.success).toBe(false);
      if (result.message) {
        expect(isSanitizedMessage(result.message)).toBe(true);
      }
      if (result.errors) {
        for (const messages of Object.values(result.errors)) {
          for (const msg of messages) {
            expect(isSanitizedMessage(msg)).toBe(true);
          }
        }
      }
    }
  });
});

describe("isSanitizedMessage", () => {
  it("returns true for safe user-facing messages", () => {
    expect(isSanitizedMessage("El servicio no está disponible temporalmente")).toBe(true);
    expect(isSanitizedMessage("Ocurrió un error inesperado. Por favor, intente de nuevo.")).toBe(true);
    expect(isSanitizedMessage("El nombre de empresa ya se encuentra registrado")).toBe(true);
  });

  it("returns false for messages containing IP addresses", () => {
    expect(isSanitizedMessage("Error connecting to 192.168.1.1:5432")).toBe(false);
  });

  it("returns false for messages containing connection strings", () => {
    expect(isSanitizedMessage("postgresql://user:pass@host/db")).toBe(false);
  });

  it("returns false for messages containing SQL queries", () => {
    expect(isSanitizedMessage("Failed: SELECT * FROM empresas")).toBe(false);
  });

  it("returns false for messages containing stack traces", () => {
    expect(isSanitizedMessage("at Object.query (/app/src/lib/db.ts:10:5)")).toBe(false);
  });

  it("returns false for messages containing Vercel hostnames", () => {
    expect(isSanitizedMessage("Error at ep-cool-forest-123456.vercel.app")).toBe(false);
  });

  it("returns false for messages containing credentials keywords", () => {
    expect(isSanitizedMessage("Invalid password for user admin")).toBe(false);
  });
});

describe("SENSITIVE_PATTERNS", () => {
  it("contains patterns for common sensitive data types", () => {
    expect(SENSITIVE_PATTERNS.length).toBeGreaterThan(0);
    // Ensure we check for IP addresses, connection strings, SQL, stack traces
    const patternStrings = SENSITIVE_PATTERNS.map((p) => p.source);
    expect(patternStrings.some((s) => s.includes("\\d"))).toBe(true); // IP
    expect(patternStrings.some((s) => s.includes("postgresql"))).toBe(true); // connection string
    expect(patternStrings.some((s) => s.includes("SELECT"))).toBe(true); // SQL
  });
});
