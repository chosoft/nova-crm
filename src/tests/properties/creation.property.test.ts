import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

// Feature: nova-company-management, Property 1: Entity creation initializes estado as "pendiente"
// Feature: nova-company-management, Property 2: Entity creation links to the authenticated creator
// Feature: nova-company-management, Property 7: Duplicate empresa name is rejected
// **Validates: Requirements 1.1, 1.4, 1.8**

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn(),
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
import { crearEmpresa } from "@/actions/empresas";

// Helper to create FormData from input
function makeFormData(input: {
  nombre: string;
  numeroContacto: string;
  descripcion: string;
  modalidad: string;
}): FormData {
  const fd = new FormData();
  fd.set("nombre", input.nombre);
  fd.set("numeroContacto", input.numeroContacto);
  fd.set("descripcion", input.descripcion);
  fd.set("modalidad", input.modalidad);
  return fd;
}

// Generators
const validEmpresaInputArb = fc.record({
  nombre: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length >= 1),
  numeroContacto: fc.stringMatching(/^\d{7,15}$/),
  descripcion: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length >= 1),
  modalidad: fc.oneof(fc.constant("stand"), fc.constant("patrocinador")),
});

const userIdArb = fc.uuid();

const mockFindUnique = prisma.empresa.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.empresa.create as ReturnType<typeof vi.fn>;
const mockAuth = auth as ReturnType<typeof vi.fn>;

// Feature: nova-company-management, Property 1: Entity creation initializes estado as "pendiente"
describe("Property 1: Entity creation initializes estado as 'pendiente'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for any valid Empresa input, the created entity always has estado='pendiente'", async () => {
    await fc.assert(
      fc.asyncProperty(validEmpresaInputArb, userIdArb, async (input, userId) => {
        // Reset mocks for each iteration
        mockAuth.mockReset();
        mockFindUnique.mockReset();
        mockCreate.mockReset();

        // Setup mocks
        mockAuth.mockResolvedValue({
          user: { id: userId, email: "test@test.com", role: "miembro", nombre: "Test" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        });

        mockFindUnique.mockResolvedValue(null);
        mockCreate.mockResolvedValue({
          id: "generated-id",
          nombre: input.nombre,
          numeroContacto: input.numeroContacto,
          descripcion: input.descripcion,
          modalidad: input.modalidad,
          estado: "pendiente",
          miembroId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const formData = makeFormData(input);
        const result = await crearEmpresa(undefined, formData);

        // Verify success
        expect(result.success).toBe(true);

        // Verify prisma.empresa.create was called with estado="pendiente"
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              estado: "pendiente",
            }),
          })
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: nova-company-management, Property 2: Entity creation links to the authenticated creator
describe("Property 2: Entity creation links to the authenticated creator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for any authenticated Miembro creating an Empresa, miembroId equals the creator's ID", async () => {
    await fc.assert(
      fc.asyncProperty(validEmpresaInputArb, userIdArb, async (input, userId) => {
        // Reset mocks for each iteration
        mockAuth.mockReset();
        mockFindUnique.mockReset();
        mockCreate.mockReset();

        // Setup mocks
        mockAuth.mockResolvedValue({
          user: { id: userId, email: "member@test.com", role: "miembro", nombre: "Member" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        });

        mockFindUnique.mockResolvedValue(null);
        mockCreate.mockResolvedValue({
          id: "generated-id",
          nombre: input.nombre,
          numeroContacto: input.numeroContacto,
          descripcion: input.descripcion,
          modalidad: input.modalidad,
          estado: "pendiente",
          miembroId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const formData = makeFormData(input);
        const result = await crearEmpresa(undefined, formData);

        // Verify success
        expect(result.success).toBe(true);

        // Verify prisma.empresa.create was called with the authenticated user's ID
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              miembroId: userId,
            }),
          })
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: nova-company-management, Property 7: Duplicate empresa name is rejected
describe("Property 7: Duplicate empresa name is rejected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for any existing empresa name, a new registration with the same name is rejected", async () => {
    await fc.assert(
      fc.asyncProperty(validEmpresaInputArb, userIdArb, async (input, userId) => {
        // Reset mocks for each iteration
        mockAuth.mockReset();
        mockFindUnique.mockReset();
        mockCreate.mockReset();

        // Setup mocks - auth is valid
        mockAuth.mockResolvedValue({
          user: { id: userId, email: "member@test.com", role: "miembro", nombre: "Member" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        });

        // Simulate that an empresa with the same name already exists
        mockFindUnique.mockResolvedValue({
          id: "existing-id",
          nombre: input.nombre,
          numeroContacto: "1234567",
          descripcion: "Existing empresa",
          modalidad: "stand",
          estado: "pendiente",
          miembroId: "other-user-id",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const formData = makeFormData(input);
        const result = await crearEmpresa(undefined, formData);

        // Verify rejection
        expect(result.success).toBe(false);
        expect(result.errors?.nombre).toBeDefined();
        expect(result.errors!.nombre![0]).toContain("ya se encuentra registrado");

        // Verify prisma.empresa.create was NOT called
        expect(mockCreate).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});
