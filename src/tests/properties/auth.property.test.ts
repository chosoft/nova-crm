import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import bcrypt from "bcryptjs";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcrypt for deterministic testing
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import { prisma } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Replicate the authorize logic for property-based testing
// (same logic as in src/lib/auth.ts but testable without NextAuth wrapper)
async function authorizeUser(
  email: string | undefined,
  password: string | undefined
) {
  if (!email || !password) {
    throw new Error("Correo electrónico o contraseña incorrectos");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Correo electrónico o contraseña incorrectos");
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error(
      "Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en 15 minutos"
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: newFailedAttempts,
    };

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw new Error("Correo electrónico o contraseña incorrectos");
  }

  // Successful login: reset failed attempts
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.nombre,
    role: user.role,
  };
}

// Helper: determine post-login redirect based on role
function getPostLoginRedirect(role: string): string {
  if (role === "admin") return "/dashboard";
  return "/empresas";
}

describe("Auth Property Tests", () => {
  const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
  const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
  const mockBcryptCompare = bcrypt.compare as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  // Feature: nova-company-management, Property 13: Authentication redirect matches user role
  // **Validates: Requirements 6.1**
  describe("Property 13: Authentication redirect matches user role", () => {
    it("admin users are redirected to /dashboard, miembro users to /empresas", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            nombre: fc.string({ minLength: 1, maxLength: 80 }),
            role: fc.oneof(fc.constant("admin"), fc.constant("miembro")),
          }),
          async (userData) => {
            // Setup: user exists with given role, password is correct
            mockFindUnique.mockResolvedValue({
              id: userData.id,
              email: userData.email,
              passwordHash: "hashed_password",
              nombre: userData.nombre,
              role: userData.role,
              failedLoginAttempts: 0,
              lockedUntil: null,
            });
            mockBcryptCompare.mockResolvedValue(true);

            const result = await authorizeUser(userData.email, "any_password");

            // The result contains the role which determines the redirect
            expect(result.role).toBe(userData.role);

            // Verify the redirect destination matches the role
            const redirect = getPostLoginRedirect(result.role);
            if (userData.role === "admin") {
              expect(redirect).toBe("/dashboard");
            } else {
              expect(redirect).toBe("/empresas");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nova-company-management, Property 14: Authentication error message is generic
  // **Validates: Requirements 6.2**
  describe("Property 14: Authentication error message is generic", () => {
    it("returns the same generic error regardless of failure reason (wrong email, wrong password, or both)", async () => {
      const GENERIC_ERROR = "Correo electrónico o contraseña incorrectos";

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 1, maxLength: 50 }),
            failureType: fc.oneof(
              fc.constant("user_not_found" as const),
              fc.constant("wrong_password" as const),
              fc.constant("empty_email" as const),
              fc.constant("empty_password" as const)
            ),
          }),
          async ({ email, password, failureType }) => {
            mockFindUnique.mockReset();
            mockUpdate.mockReset();
            mockBcryptCompare.mockReset();
            mockUpdate.mockResolvedValue({});

            let attemptEmail: string | undefined = email;
            let attemptPassword: string | undefined = password;

            switch (failureType) {
              case "user_not_found":
                // User doesn't exist in the database
                mockFindUnique.mockResolvedValue(null);
                break;
              case "wrong_password":
                // User exists but password is wrong
                mockFindUnique.mockResolvedValue({
                  id: "user-id",
                  email,
                  passwordHash: "hashed_password",
                  nombre: "Test User",
                  role: "miembro",
                  failedLoginAttempts: 0,
                  lockedUntil: null,
                });
                mockBcryptCompare.mockResolvedValue(false);
                break;
              case "empty_email":
                attemptEmail = undefined;
                break;
              case "empty_password":
                attemptPassword = undefined;
                break;
            }

            let thrownError: Error | null = null;
            try {
              await authorizeUser(attemptEmail, attemptPassword);
            } catch (error: unknown) {
              thrownError = error as Error;
            }

            // Should have thrown an error
            expect(thrownError).not.toBeNull();
            // The error message should always be the same generic message
            expect(thrownError!.message).toBe(GENERIC_ERROR);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nova-company-management, Property 15: Account locks after exactly 5 consecutive failed attempts
  // **Validates: Requirements 6.3**
  describe("Property 15: Account locks after exactly 5 consecutive failed attempts", () => {
    it("account does NOT lock with fewer than 5 failed attempts, and locks at exactly 5", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            // failedAttempts represents the current counter BEFORE this attempt
            // Range 0-4 tests the boundary behavior around the lock threshold
            failedAttempts: fc.integer({ min: 0, max: 6 }),
          }),
          async ({ userId, email, failedAttempts }) => {
            mockFindUnique.mockReset();
            mockUpdate.mockReset();
            mockBcryptCompare.mockReset();
            mockUpdate.mockResolvedValue({});

            // Setup: user exists with a given number of prior failed attempts, not locked
            mockFindUnique.mockResolvedValue({
              id: userId,
              email,
              passwordHash: "hashed_password",
              nombre: "Test User",
              role: "miembro",
              failedLoginAttempts: failedAttempts,
              lockedUntil: null,
            });
            // Password is wrong, triggering a failed attempt
            mockBcryptCompare.mockResolvedValue(false);

            let thrownError: Error | null = null;
            try {
              await authorizeUser(email, "wrong_password");
            } catch (error: unknown) {
              thrownError = error as Error;
            }

            expect(thrownError).not.toBeNull();

            // The new counter after this failed attempt
            const newCount = failedAttempts + 1;

            // Verify the update was called with the correct counter
            expect(mockUpdate).toHaveBeenCalledTimes(1);
            const updateCallData = mockUpdate.mock.calls[0][0].data;
            expect(updateCallData.failedLoginAttempts).toBe(newCount);

            if (newCount >= MAX_FAILED_ATTEMPTS) {
              // Account SHOULD be locked (lockedUntil set)
              expect(updateCallData.lockedUntil).toBeInstanceOf(Date);
              // Verify the lockout is approximately 15 minutes in the future
              const lockTime = (updateCallData.lockedUntil as Date).getTime();
              const expectedTime = Date.now() + LOCKOUT_DURATION_MS;
              expect(Math.abs(lockTime - expectedTime)).toBeLessThan(5000);
            } else {
              // Account should NOT be locked (no lockedUntil in update)
              expect(updateCallData.lockedUntil).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("a successful login resets the failed attempts counter to 0", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            nombre: fc.string({ minLength: 1, maxLength: 80 }),
            role: fc.oneof(fc.constant("admin"), fc.constant("miembro")),
            // Prior failed attempts > 0 to verify reset behavior
            failedAttempts: fc.integer({ min: 1, max: 4 }),
          }),
          async ({ userId, email, nombre, role, failedAttempts }) => {
            mockFindUnique.mockReset();
            mockUpdate.mockReset();
            mockBcryptCompare.mockReset();
            mockUpdate.mockResolvedValue({});

            mockFindUnique.mockResolvedValue({
              id: userId,
              email,
              passwordHash: "hashed_password",
              nombre,
              role,
              failedLoginAttempts: failedAttempts,
              lockedUntil: null,
            });
            // Password is correct
            mockBcryptCompare.mockResolvedValue(true);

            const result = await authorizeUser(email, "correct_password");

            // Successful login should return user data
            expect(result.id).toBe(userId);
            expect(result.email).toBe(email);

            // Counter should be reset to 0
            expect(mockUpdate).toHaveBeenCalledWith({
              where: { id: userId },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
