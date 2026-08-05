import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock next-auth
vi.mock("@/lib/auth", () => ({
  auth: (handler: (req: unknown) => unknown) => handler,
}));

// Mock NextResponse
vi.mock("next/server", () => {
  const redirect = vi.fn((url: URL) => ({ type: "redirect", url }));
  const next = vi.fn(() => ({ type: "next" }));
  return {
    NextResponse: { redirect, next },
  };
});

// Import after mocks are set up
import middlewareHandler from "./middleware";

function createMockRequest(pathname: string, auth: unknown = null) {
  return {
    nextUrl: {
      pathname,
      origin: "http://localhost:3000",
    },
    auth,
  };
}

describe("Middleware - Route Protection and RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Public routes", () => {
    it("allows access to /login without authentication", () => {
      const req = createMockRequest("/login");
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });

    it("allows access to /login subpaths without authentication", () => {
      const req = createMockRequest("/login/callback");
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });
  });

  describe("Unauthenticated users", () => {
    it("redirects unauthenticated users to /login from protected routes", () => {
      const req = createMockRequest("/empresas");
      const result = (middlewareHandler as Function)(req) as {
        type: string;
        url: URL;
      };

      expect(NextResponse.redirect).toHaveBeenCalled();
      expect(result.url.pathname).toBe("/login");
    });

    it("redirects unauthenticated users from /dashboard to /login", () => {
      const req = createMockRequest("/dashboard");
      const result = (middlewareHandler as Function)(req) as {
        type: string;
        url: URL;
      };

      expect(NextResponse.redirect).toHaveBeenCalled();
      expect(result.url.pathname).toBe("/login");
    });

    it("redirects unauthenticated users from /universidades to /login", () => {
      const req = createMockRequest("/universidades");
      const result = (middlewareHandler as Function)(req) as {
        type: string;
        url: URL;
      };

      expect(NextResponse.redirect).toHaveBeenCalled();
      expect(result.url.pathname).toBe("/login");
    });
  });

  describe("Admin role access", () => {
    const adminAuth = { user: { id: "1", role: "admin", nombre: "Admin" } };

    it("allows admin to access /dashboard", () => {
      const req = createMockRequest("/dashboard", adminAuth);
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });

    it("allows admin to access /empresas", () => {
      const req = createMockRequest("/empresas", adminAuth);
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });

    it("allows admin to access /universidades", () => {
      const req = createMockRequest("/universidades", adminAuth);
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });
  });

  describe("Miembro role access", () => {
    const miembroAuth = {
      user: { id: "2", role: "miembro", nombre: "Miembro" },
    };

    it("redirects miembro from /dashboard to /empresas", () => {
      const req = createMockRequest("/dashboard", miembroAuth);
      const result = (middlewareHandler as Function)(req) as {
        type: string;
        url: URL;
      };

      expect(NextResponse.redirect).toHaveBeenCalled();
      expect(result.url.pathname).toBe("/empresas");
    });

    it("allows miembro to access /empresas", () => {
      const req = createMockRequest("/empresas", miembroAuth);
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });

    it("allows miembro to access /universidades", () => {
      const req = createMockRequest("/universidades", miembroAuth);
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });

    it("redirects miembro from /dashboard subroutes to /empresas", () => {
      const req = createMockRequest("/dashboard/stats", miembroAuth);
      const result = (middlewareHandler as Function)(req) as {
        type: string;
        url: URL;
      };

      expect(NextResponse.redirect).toHaveBeenCalled();
      expect(result.url.pathname).toBe("/empresas");
    });
  });

  describe("Default behavior for other routes", () => {
    const adminAuth = { user: { id: "1", role: "admin", nombre: "Admin" } };

    it("allows authenticated users to access unspecified routes", () => {
      const req = createMockRequest("/some-other-route", adminAuth);
      const result = (middlewareHandler as Function)(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });
  });
});
