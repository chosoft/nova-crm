import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Feature: nova-company-management, Property 5: Filtering returns only matching results
// Feature: nova-company-management, Property 6: Empresa list is sorted alphabetically by name
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

// Types matching the domain model
type Modalidad = "stand" | "patrocinador";
type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

interface Empresa {
  id: string;
  nombre: string;
  modalidad: Modalidad;
  estado: Estado;
  miembroId: string;
}

interface EmpresaFilters {
  modalidad?: Modalidad;
  estado?: Estado;
}

// Pure filtering and sorting function matching page logic
function filterAndSortEmpresas(empresas: Empresa[], filters: EmpresaFilters): Empresa[] {
  return empresas
    .filter((e) => !filters.modalidad || e.modalidad === filters.modalidad)
    .filter((e) => !filters.estado || e.estado === filters.estado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Generators
const modalidadArb: fc.Arbitrary<Modalidad> = fc.oneof(
  fc.constant("stand" as Modalidad),
  fc.constant("patrocinador" as Modalidad)
);

const estadoArb: fc.Arbitrary<Estado> = fc.oneof(
  fc.constant("pendiente" as Estado),
  fc.constant("contactada" as Estado),
  fc.constant("confirmada" as Estado),
  fc.constant("rechazada" as Estado)
);

const empresaArb: fc.Arbitrary<Empresa> = fc.record({
  id: fc.uuid(),
  nombre: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length >= 1),
  modalidad: modalidadArb,
  estado: estadoArb,
  miembroId: fc.uuid(),
});

const empresaListArb: fc.Arbitrary<Empresa[]> = fc.array(empresaArb, { minLength: 0, maxLength: 30 });

const filtersArb: fc.Arbitrary<EmpresaFilters> = fc.record({
  modalidad: fc.option(modalidadArb, { nil: undefined }),
  estado: fc.option(estadoArb, { nil: undefined }),
});

// Feature: nova-company-management, Property 5: Filtering returns only matching results
describe("Property 5: Filtering returns only matching results", () => {
  it("all returned Empresas satisfy every active filter criterion", () => {
    fc.assert(
      fc.property(empresaListArb, filtersArb, (empresas, filters) => {
        const results = filterAndSortEmpresas(empresas, filters);

        // All returned items must match all active filter criteria
        for (const empresa of results) {
          if (filters.modalidad) {
            expect(empresa.modalidad).toBe(filters.modalidad);
          }
          if (filters.estado) {
            expect(empresa.estado).toBe(filters.estado);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("no Empresa satisfying all criteria is excluded from the results", () => {
    fc.assert(
      fc.property(empresaListArb, filtersArb, (empresas, filters) => {
        const results = filterAndSortEmpresas(empresas, filters);

        // Every empresa in the original list that matches all criteria must appear in results
        for (const empresa of empresas) {
          const matchesModalidad = !filters.modalidad || empresa.modalidad === filters.modalidad;
          const matchesEstado = !filters.estado || empresa.estado === filters.estado;

          if (matchesModalidad && matchesEstado) {
            expect(results).toContainEqual(empresa);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("result count equals the number of matching empresas in the original list", () => {
    fc.assert(
      fc.property(empresaListArb, filtersArb, (empresas, filters) => {
        const results = filterAndSortEmpresas(empresas, filters);

        const expectedCount = empresas.filter((e) => {
          const matchesModalidad = !filters.modalidad || e.modalidad === filters.modalidad;
          const matchesEstado = !filters.estado || e.estado === filters.estado;
          return matchesModalidad && matchesEstado;
        }).length;

        expect(results.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: nova-company-management, Property 6: Empresa list is sorted alphabetically by name
describe("Property 6: Empresa list is sorted alphabetically by name", () => {
  it("for every consecutive pair, nombre[i] is <= nombre[i+1] lexicographically", () => {
    fc.assert(
      fc.property(empresaListArb, filtersArb, (empresas, filters) => {
        const results = filterAndSortEmpresas(empresas, filters);

        // Verify sorted order for every consecutive pair
        for (let i = 0; i < results.length - 1; i++) {
          const comparison = results[i].nombre.localeCompare(results[i + 1].nombre);
          expect(comparison).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sorting preserves all elements (no items added or removed by sorting)", () => {
    fc.assert(
      fc.property(empresaListArb, filtersArb, (empresas, filters) => {
        const results = filterAndSortEmpresas(empresas, filters);

        // Filtering step only
        const filtered = empresas
          .filter((e) => !filters.modalidad || e.modalidad === filters.modalidad)
          .filter((e) => !filters.estado || e.estado === filters.estado);

        // Same number of elements
        expect(results.length).toBe(filtered.length);

        // Every filtered element appears in results
        for (const empresa of filtered) {
          expect(results).toContainEqual(empresa);
        }
      }),
      { numRuns: 100 }
    );
  });
});
