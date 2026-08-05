import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

// Feature: nova-company-management, Property 9: State change creates a historial entry with correct data
// Feature: nova-company-management, Property 10: Same-state transition is a no-op
// **Validates: Requirements 3.1, 3.4, 3.6**

// Mock @/lib/auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock @/lib/db
vi.mock("@/lib/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    empresaHistorial: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { cambiarEstadoEmpresa } from "@/actions/empresas";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ESTADOS = ["pendiente", "contactada", "confirmada", "rechazada"] as const;
type Estado = (typeof ESTADOS)[number];

// Generators
const estadoArb = fc.constantFrom(...ESTADOS);
const empresaIdArb = fc.uuid();
const adminSessionArb = fc.record({
  user: fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    role: fc.constant("admin" as const),
    nombre: fc.string({ minLength: 1, maxLength: 50 }),
  }),
});

describe("Property 9: State change creates a historial entry with correct data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for any empresa and any valid new estado different from current, an admin state change creates exactly one historial entry with correct previous/new estado", async () => {
    await fc.assert(
      fc.asyncProperty(
        empresaIdArb,
        estadoArb,
        estadoArb,
        adminSessionArb,
        async (id, currentEstado, nuevoEstado, session) => {
          // Only test when estados are different
          fc.pre(currentEstado !== nuevoEstado);

          vi.clearAllMocks();

          // Track time before the call
          const timeBefore = new Date();

          // Setup mocks
          vi.mocked(auth).mockResolvedValue(session as never);
          vi.mocked(prisma.empresa.findUnique).mockResolvedValue({
            id,
            nombre: "Test Empresa",
            numeroContacto: "1234567",
            descripcion: "Test",
            modalidad: "stand",
            estado: currentEstado,
            miembroId: "member-1",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as never);

          // Mock the nested prisma calls that produce the promises passed to $transaction
          vi.mocked(prisma.empresa.update).mockReturnValue(
            Promise.resolve({ id, estado: nuevoEstado }) as never
          );
          vi.mocked(prisma.empresaHistorial.create).mockReturnValue(
            Promise.resolve({
              id: "historial-1",
              empresaId: id,
              estadoAnterior: currentEstado,
              estadoNuevo: nuevoEstado,
              fechaCambio: new Date(),
            }) as never
          );
          vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

          // Execute
          const result = await cambiarEstadoEmpresa(id, nuevoEstado);

          // The action should succeed
          expect(result.success).toBe(true);

          // $transaction should be called exactly once
          expect(prisma.$transaction).toHaveBeenCalledTimes(1);

          // The transaction receives an array with exactly 2 operations
          const txArg = vi.mocked(prisma.$transaction).mock.calls[0][0];
          expect(Array.isArray(txArg)).toBe(true);
          expect((txArg as unknown as unknown[]).length).toBe(2);

          // Verify empresa.update was called with correct state
          expect(prisma.empresa.update).toHaveBeenCalledWith({
            where: { id },
            data: { estado: nuevoEstado },
          });

          // Verify empresaHistorial.create was called with correct data
          expect(prisma.empresaHistorial.create).toHaveBeenCalledTimes(1);
          const historialCall = vi.mocked(prisma.empresaHistorial.create).mock
            .calls[0][0];

          expect(historialCall.data.empresaId).toBe(id);
          expect(historialCall.data.estadoAnterior).toBe(currentEstado);
          expect(historialCall.data.estadoNuevo).toBe(nuevoEstado);

          // Timestamp should be equal to or after the time of the request
          const fechaCambio = new Date(historialCall.data.fechaCambio as Date);
          expect(fechaCambio.getTime()).toBeGreaterThanOrEqual(
            timeBefore.getTime()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("historial entry always records the exact previous estado before the change", async () => {
    await fc.assert(
      fc.asyncProperty(
        empresaIdArb,
        estadoArb,
        estadoArb,
        adminSessionArb,
        async (id, currentEstado, nuevoEstado, session) => {
          fc.pre(currentEstado !== nuevoEstado);

          vi.clearAllMocks();
          vi.mocked(auth).mockResolvedValue(session as never);
          vi.mocked(prisma.empresa.findUnique).mockResolvedValue({
            id,
            nombre: "Empresa X",
            numeroContacto: "9876543",
            descripcion: "Desc",
            modalidad: "patrocinador",
            estado: currentEstado,
            miembroId: "m-1",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as never);
          vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
          vi.mocked(prisma.empresa.update).mockReturnValue(
            Promise.resolve({}) as never
          );
          vi.mocked(prisma.empresaHistorial.create).mockReturnValue(
            Promise.resolve({}) as never
          );

          const result = await cambiarEstadoEmpresa(id, nuevoEstado);

          expect(result.success).toBe(true);
          const historialCall = vi.mocked(prisma.empresaHistorial.create).mock
            .calls[0][0];
          // The estadoAnterior must always be the empresa's estado BEFORE the change
          expect(historialCall.data.estadoAnterior).toBe(currentEstado);
          // The estadoNuevo must always be the requested new estado
          expect(historialCall.data.estadoNuevo).toBe(nuevoEstado);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 10: Same-state transition is a no-op", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for any empresa whose current estado is E, changing to E does not modify the empresa and does not create historial", async () => {
    await fc.assert(
      fc.asyncProperty(
        empresaIdArb,
        estadoArb,
        adminSessionArb,
        async (id, estado, session) => {
          vi.clearAllMocks();
          vi.mocked(auth).mockResolvedValue(session as never);
          vi.mocked(prisma.empresa.findUnique).mockResolvedValue({
            id,
            nombre: "NoOp Empresa",
            numeroContacto: "1112222",
            descripcion: "Desc",
            modalidad: "stand",
            estado: estado, // current estado equals the new one
            miembroId: "m-2",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as never);

          const result = await cambiarEstadoEmpresa(id, estado);

          // Should return success (no-op is not an error)
          expect(result.success).toBe(true);

          // empresa.update should NOT be called (no modification)
          expect(prisma.empresa.update).not.toHaveBeenCalled();

          // empresaHistorial.create should NOT be called (no historial entry)
          expect(prisma.empresaHistorial.create).not.toHaveBeenCalled();

          // $transaction should NOT be called (no DB operation)
          expect(prisma.$transaction).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("same-state transition returns success without triggering the update flow", async () => {
    await fc.assert(
      fc.asyncProperty(
        empresaIdArb,
        estadoArb,
        adminSessionArb,
        async (id, estado, session) => {
          vi.clearAllMocks();
          vi.mocked(auth).mockResolvedValue(session as never);
          vi.mocked(prisma.empresa.findUnique).mockResolvedValue({
            id,
            nombre: "Same State Corp",
            numeroContacto: "7654321",
            descripcion: "Testing",
            modalidad: "patrocinador",
            estado: estado,
            miembroId: "m-3",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as never);

          const result = await cambiarEstadoEmpresa(id, estado);

          expect(result.success).toBe(true);
          // The no-op returns { success: true } without a message field
          // per the implementation's early return
          expect(result.message).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
