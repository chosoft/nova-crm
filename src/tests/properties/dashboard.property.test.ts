import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Feature: nova-company-management, Property 11: Dashboard aggregation matches underlying data
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

// Types matching the domain model
type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

interface EmpresaData {
  id: string;
  estado: Estado;
}

interface UniversidadData {
  id: string;
  estado: Estado;
}

interface Miembro {
  id: string;
  nombre: string;
  empresas: EmpresaData[];
  universidades: UniversidadData[];
}

interface MemberMetric {
  nombre: string;
  totalEmpresas: number;
  empresasConfirmadas: number;
  totalUniversidades: number;
  universidadesConfirmadas: number;
}

type EstadoResumen = Record<Estado, number>;

interface EstadoGroupResult {
  estado: Estado;
  _count: { id: number };
}

// Pure aggregation functions extracted from dashboard page logic
function computeMemberMetrics(miembros: Miembro[]): MemberMetric[] {
  return miembros.map((miembro) => ({
    nombre: miembro.nombre,
    totalEmpresas: miembro.empresas.length,
    empresasConfirmadas: miembro.empresas.filter(
      (e) => e.estado === "confirmada"
    ).length,
    totalUniversidades: miembro.universidades.length,
    universidadesConfirmadas: miembro.universidades.filter(
      (u) => u.estado === "confirmada"
    ).length,
  }));
}

function computeEstadoResumen(estadoSummaryResult: EstadoGroupResult[]): EstadoResumen {
  const resumen: EstadoResumen = {
    pendiente: 0,
    contactada: 0,
    confirmada: 0,
    rechazada: 0,
  };

  for (const group of estadoSummaryResult) {
    resumen[group.estado] = group._count.id;
  }

  return resumen;
}

// Generators
const estadoArb: fc.Arbitrary<Estado> = fc.oneof(
  fc.constant("pendiente" as Estado),
  fc.constant("contactada" as Estado),
  fc.constant("confirmada" as Estado),
  fc.constant("rechazada" as Estado)
);

const empresaDataArb: fc.Arbitrary<EmpresaData> = fc.record({
  id: fc.uuid(),
  estado: estadoArb,
});

const universidadDataArb: fc.Arbitrary<UniversidadData> = fc.record({
  id: fc.uuid(),
  estado: estadoArb,
});

const miembroArb: fc.Arbitrary<Miembro> = fc.record({
  id: fc.uuid(),
  nombre: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length >= 1),
  empresas: fc.array(empresaDataArb, { minLength: 0, maxLength: 15 }),
  universidades: fc.array(universidadDataArb, { minLength: 0, maxLength: 15 }),
});

const miembrosArb: fc.Arbitrary<Miembro[]> = fc.array(miembroArb, {
  minLength: 0,
  maxLength: 10,
});

describe("Property 11: Dashboard aggregation matches underlying data", () => {
  it("(a) count of empresas per Miembro matches their empresas array length", () => {
    fc.assert(
      fc.property(miembrosArb, (miembros) => {
        const metrics = computeMemberMetrics(miembros);

        for (let i = 0; i < miembros.length; i++) {
          expect(metrics[i].totalEmpresas).toBe(miembros[i].empresas.length);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("(b) count of empresas with estado 'confirmada' per Miembro is correct", () => {
    fc.assert(
      fc.property(miembrosArb, (miembros) => {
        const metrics = computeMemberMetrics(miembros);

        for (let i = 0; i < miembros.length; i++) {
          const expectedConfirmadas = miembros[i].empresas.filter(
            (e) => e.estado === "confirmada"
          ).length;
          expect(metrics[i].empresasConfirmadas).toBe(expectedConfirmadas);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("(c) count of universidades per Miembro matches their universidades array length", () => {
    fc.assert(
      fc.property(miembrosArb, (miembros) => {
        const metrics = computeMemberMetrics(miembros);

        for (let i = 0; i < miembros.length; i++) {
          expect(metrics[i].totalUniversidades).toBe(
            miembros[i].universidades.length
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("(d) count of universidades with estado 'confirmada' per Miembro is correct", () => {
    fc.assert(
      fc.property(miembrosArb, (miembros) => {
        const metrics = computeMemberMetrics(miembros);

        for (let i = 0; i < miembros.length; i++) {
          const expectedConfirmadas = miembros[i].universidades.filter(
            (u) => u.estado === "confirmada"
          ).length;
          expect(metrics[i].universidadesConfirmadas).toBe(
            expectedConfirmadas
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("total estado summary equals the sum of empresas grouped by each estado value", () => {
    fc.assert(
      fc.property(miembrosArb, (miembros) => {
        // Collect all empresas across all miembros
        const allEmpresas = miembros.flatMap((m) => m.empresas);

        // Simulate the groupBy result that Prisma would return
        const groupCounts: Partial<Record<Estado, number>> = {};
        for (const empresa of allEmpresas) {
          groupCounts[empresa.estado] = (groupCounts[empresa.estado] || 0) + 1;
        }

        // Convert to the Prisma groupBy format
        const estadoSummaryResult: EstadoGroupResult[] = (
          Object.entries(groupCounts) as [Estado, number][]
        ).map(([estado, count]) => ({
          estado,
          _count: { id: count },
        }));

        // Compute resumen using the pure function
        const resumen = computeEstadoResumen(estadoSummaryResult);

        // Verify each estado count matches the actual count from all empresas
        const estados: Estado[] = ["pendiente", "contactada", "confirmada", "rechazada"];
        for (const estado of estados) {
          const expectedCount = allEmpresas.filter(
            (e) => e.estado === estado
          ).length;
          expect(resumen[estado]).toBe(expectedCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sum of all estado values in resumen equals total number of empresas", () => {
    fc.assert(
      fc.property(miembrosArb, (miembros) => {
        const allEmpresas = miembros.flatMap((m) => m.empresas);

        // Simulate the groupBy result
        const groupCounts: Partial<Record<Estado, number>> = {};
        for (const empresa of allEmpresas) {
          groupCounts[empresa.estado] = (groupCounts[empresa.estado] || 0) + 1;
        }

        const estadoSummaryResult: EstadoGroupResult[] = (
          Object.entries(groupCounts) as [Estado, number][]
        ).map(([estado, count]) => ({
          estado,
          _count: { id: count },
        }));

        const resumen = computeEstadoResumen(estadoSummaryResult);

        const totalFromResumen = Object.values(resumen).reduce(
          (a, b) => a + b,
          0
        );
        expect(totalFromResumen).toBe(allEmpresas.length);
      }),
      { numRuns: 100 }
    );
  });
});
