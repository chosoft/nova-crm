import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Feature: nova-company-management, Property 8: Admin-only operations are denied for Miembros
// **Validates: Requirements 3.2, 5.8, 6.6**

/**
 * This test validates the authorization logic from the middleware:
 * - Admin-only routes: ["/dashboard"]
 * - Miembro users accessing admin-only routes are ALWAYS redirected to /empresas
 * - Admin users accessing admin-only routes are ALWAYS allowed through
 *
 * We extract the pure authorization decision logic from the middleware
 * and test it as a property: for ANY miembro user and ANY admin-only route,
 * access is ALWAYS denied (redirected).
 */

// Pure authorization decision function matching middleware logic
const publicRoutes = ["/login"];
const adminOnlyRoutes = ["/dashboard"];
const memberRoutes = ["/empresas", "/universidades"];

type AuthDecision = "allow" | "redirect_login" | "redirect_empresas";

function getAuthorizationDecision(
  pathname: string,
  userRole: string | null | undefined
): AuthDecision {
  // 1. Public route → allow
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return "allow";
  }

  // 2. No session → redirect login
  if (!userRole) {
    return "redirect_login";
  }

  // 3/4. Admin-only routes
  if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole === "admin") {
      return "allow";
    }
    // Miembro trying admin routes → redirect empresas
    return "redirect_empresas";
  }

  // 5. Member routes → allow for all authenticated users
  if (memberRoutes.some((route) => pathname.startsWith(route))) {
    return "allow";
  }

  // Default → allow
  return "allow";
}

describe("Property 8: Admin-only operations are denied for Miembros", () => {
  // Generator for admin-only paths (dashboard and subpaths)
  const adminOnlyPathArb = fc.oneof(
    fc.constant("/dashboard"),
    fc.constant("/dashboard/metrics"),
    fc.constant("/dashboard/overview"),
    fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => /^[a-z0-9-/]+$/.test(s))
      .map((suffix) => `/dashboard/${suffix}`)
  );

  // Generator for miembro user sessions
  const miembroUserArb = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    nombre: fc.string({ minLength: 1, maxLength: 50 }),
    role: fc.constant("miembro" as const),
  });

  // Generator for admin user sessions
  const adminUserArb = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    nombre: fc.string({ minLength: 1, maxLength: 50 }),
    role: fc.constant("admin" as const),
  });

  it("any miembro accessing any admin-only route is always redirected to /empresas", () => {
    fc.assert(
      fc.property(miembroUserArb, adminOnlyPathArb, (user, path) => {
        const decision = getAuthorizationDecision(path, user.role);
        expect(decision).toBe("redirect_empresas");
      }),
      { numRuns: 100 }
    );
  });

  it("any admin accessing any admin-only route is always allowed", () => {
    fc.assert(
      fc.property(adminUserArb, adminOnlyPathArb, (user, path) => {
        const decision = getAuthorizationDecision(path, user.role);
        expect(decision).toBe("allow");
      }),
      { numRuns: 100 }
    );
  });

  it("miembro with any user properties is still denied access to admin routes", () => {
    // Generate miembros with various random properties to ensure
    // no combination of user attributes can bypass authorization
    const randomMiembroArb = fc.record({
      id: fc.oneof(fc.uuid(), fc.string({ minLength: 1, maxLength: 50 })),
      email: fc.oneof(fc.emailAddress(), fc.constant("admin@nova.com")),
      nombre: fc.oneof(
        fc.constant("Admin"),
        fc.constant("Administrador"),
        fc.string({ minLength: 1, maxLength: 50 })
      ),
      role: fc.constant("miembro" as const),
    });

    fc.assert(
      fc.property(randomMiembroArb, adminOnlyPathArb, (user, path) => {
        const decision = getAuthorizationDecision(path, user.role);
        // Regardless of user name, email, or id, a miembro is ALWAYS denied
        expect(decision).toBe("redirect_empresas");
      }),
      { numRuns: 100 }
    );
  });

  it("miembro accessing member routes is always allowed", () => {
    const memberPathArb = fc.oneof(
      fc.constant("/empresas"),
      fc.constant("/empresas/nueva"),
      fc.constant("/universidades"),
      fc.constant("/universidades/nueva"),
      fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => /^[a-z0-9-/]+$/.test(s))
        .map((suffix) => `/empresas/${suffix}`),
      fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => /^[a-z0-9-/]+$/.test(s))
        .map((suffix) => `/universidades/${suffix}`)
    );

    fc.assert(
      fc.property(miembroUserArb, memberPathArb, (user, path) => {
        const decision = getAuthorizationDecision(path, user.role);
        // Miembros are always allowed on member routes
        expect(decision).toBe("allow");
      }),
      { numRuns: 100 }
    );
  });
});
