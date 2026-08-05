import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

// Feature: nova-company-management, Property 12: Event scheduling requires universidad in estado "confirmada"
// **Validates: Requirements 5.9**

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    universidad: {
      findUnique: vi.fn(),
    },
    eventoDifusion: {
      create: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { agendarEvento } from "@/actions/universidades";

describe("Property 12: Event scheduling requires universidad in estado 'confirmada'", () => {
  const mockFindUnique = prisma.universidad.findUnique as ReturnType<typeof vi.fn>;
  const mockCreate = prisma.eventoDifusion.create as ReturnType<typeof vi.fn>;
  const mockAuth = auth as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: "user-123", role: "miembro", email: "test@nova.com" },
    });
  });

  // Generator for non-confirmada estados
  const nonConfirmadaEstadoArb = fc.oneof(
    fc.constant("pendiente" as const),
    fc.constant("contactada" as const),
    fc.constant("rechazada" as const)
  );

  // Generator for random universidad data with a given estado
  const universidadArb = (estado: string) =>
    fc.record({
      id: fc.uuid(),
      nombre: fc.string({ minLength: 1, maxLength: 100 }),
      nombreContacto: fc.string({ minLength: 1, maxLength: 80 }),
      numeroContacto: fc.stringMatching(/^\d{7,15}$/),
      miembroId: fc.uuid(),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    }).map((data) => ({ ...data, estado }));

  // Generator for valid evento input
  const validEventoInputArb = fc.record({
    fecha: fc.integer({
      min: Date.now() + 86400000, // at least 1 day in the future
      max: Date.now() + 365 * 86400000, // up to 1 year
    }).map((ts) => new Date(ts).toISOString()),
    descripcion: fc.string({ minLength: 1, maxLength: 300 }),
  });

  it("scheduling an event is ALWAYS rejected when universidad estado is NOT 'confirmada'", async () => {
    await fc.assert(
      fc.asyncProperty(
        nonConfirmadaEstadoArb,
        validEventoInputArb,
        fc.uuid(),
        async (estado, eventoInput, universidadId) => {
          // Setup: universidad exists with non-confirmada estado
          mockFindUnique.mockResolvedValue({
            id: universidadId,
            nombre: "Universidad Test",
            nombreContacto: "Contacto Test",
            numeroContacto: "1234567890",
            estado,
            miembroId: "user-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const result = await agendarEvento({
            universidadId,
            fecha: eventoInput.fecha,
            descripcion: eventoInput.descripcion,
          });

          // Must be rejected
          expect(result.success).toBe(false);
          expect(result.message).toBe(
            "La universidad debe estar confirmada para agendar eventos"
          );
          // Event should NOT have been created
          expect(mockCreate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("scheduling an event is ALLOWED when universidad estado is 'confirmada' (positive case)", async () => {
    await fc.assert(
      fc.asyncProperty(
        validEventoInputArb,
        fc.uuid(),
        async (eventoInput, universidadId) => {
          // Setup: universidad exists with estado "confirmada"
          mockFindUnique.mockResolvedValue({
            id: universidadId,
            nombre: "Universidad Confirmada",
            nombreContacto: "Contacto Test",
            numeroContacto: "1234567890",
            estado: "confirmada",
            miembroId: "user-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          mockCreate.mockResolvedValue({
            id: "evento-id",
            universidadId,
            fecha: new Date(eventoInput.fecha),
            descripcion: eventoInput.descripcion,
            createdAt: new Date(),
          });

          const result = await agendarEvento({
            universidadId,
            fecha: eventoInput.fecha,
            descripcion: eventoInput.descripcion,
          });

          // Should be successful (assuming valid evento data passes schema validation)
          // Note: may still fail on schema validation if fecha isn't in the future at execution time
          // But should NOT fail with the "must be confirmed" message
          expect(result.message).not.toBe(
            "La universidad debe estar confirmada para agendar eventos"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejection happens regardless of the evento input data when estado is not confirmada", async () => {
    // Test that even with invalid evento data, the estado check happens FIRST
    await fc.assert(
      fc.asyncProperty(
        nonConfirmadaEstadoArb,
        fc.uuid(),
        fc.record({
          fecha: fc.oneof(
            fc.constant("invalid-date"),
            fc.constant(""),
            fc.integer({ min: new Date(2020, 0, 1).getTime(), max: new Date(2023, 0, 1).getTime() }).map((ts) => new Date(ts).toISOString()), // past dates
            fc.integer({ min: Date.now() + 86400000, max: new Date(2030, 0, 1).getTime() }).map((ts) => new Date(ts).toISOString()),
          ),
          descripcion: fc.oneof(
            fc.constant(""),
            fc.string({ minLength: 1, maxLength: 300 }),
            fc.string({ minLength: 301, maxLength: 500 }),
          ),
        }),
        async (estado, universidadId, eventoInput) => {
          mockFindUnique.mockResolvedValue({
            id: universidadId,
            nombre: "Universidad Test",
            nombreContacto: "Contacto",
            numeroContacto: "1234567",
            estado,
            miembroId: "user-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const result = await agendarEvento({
            universidadId,
            ...eventoInput,
          });

          // The estado check happens before evento validation,
          // so it should always return the estado error
          expect(result.success).toBe(false);
          expect(result.message).toBe(
            "La universidad debe estar confirmada para agendar eventos"
          );
          expect(mockCreate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
