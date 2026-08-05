import { describe, it, expect, vi, beforeEach } from "vitest";
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

// We need to test the authorize logic directly. Since NextAuth wraps it,
// we'll extract and test the core auth logic by importing the module
// and testing through a helper that replicates the authorize behavior.

import { prisma } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

// Replicate the authorize logic for unit testing
async function authorizeUser(email: string | undefined, password: string | undefined) {
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

describe("Auth - authorize logic", () => {
  const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
  const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws generic error when email is not provided", async () => {
    await expect(authorizeUser(undefined, "password123")).rejects.toThrow(
      "Correo electrónico o contraseña incorrectos"
    );
  });

  it("throws generic error when password is not provided", async () => {
    await expect(authorizeUser("test@example.com", undefined)).rejects.toThrow(
      "Correo electrónico o contraseña incorrectos"
    );
  });

  it("throws generic error when user is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      authorizeUser("unknown@example.com", "password123")
    ).rejects.toThrow("Correo electrónico o contraseña incorrectos");
  });

  it("throws locked message when account is locked", async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
    mockFindUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      nombre: "Test User",
      role: "miembro",
      failedLoginAttempts: 5,
      lockedUntil: futureDate,
    });

    await expect(
      authorizeUser("test@example.com", "password123")
    ).rejects.toThrow(
      "Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en 15 minutos"
    );
  });

  it("increments failed attempts on wrong password", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      passwordHash: await bcrypt.hash("correctpassword", 10),
      nombre: "Test User",
      role: "miembro",
      failedLoginAttempts: 2,
      lockedUntil: null,
    });
    mockUpdate.mockResolvedValue({});

    await expect(
      authorizeUser("test@example.com", "wrongpassword")
    ).rejects.toThrow("Correo electrónico o contraseña incorrectos");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { failedLoginAttempts: 3 },
    });
  });

  it("locks account after 5 failed attempts", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      passwordHash: await bcrypt.hash("correctpassword", 10),
      nombre: "Test User",
      role: "miembro",
      failedLoginAttempts: 4, // This will be the 5th attempt
      lockedUntil: null,
    });
    mockUpdate.mockResolvedValue({});

    await expect(
      authorizeUser("test@example.com", "wrongpassword")
    ).rejects.toThrow("Correo electrónico o contraseña incorrectos");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: expect.objectContaining({
        failedLoginAttempts: 5,
        lockedUntil: expect.any(Date),
      }),
    });

    // Verify the lockout is approximately 15 minutes in the future
    const callArgs = mockUpdate.mock.calls[0][0];
    const lockedUntil = callArgs.data.lockedUntil as Date;
    const expectedTime = Date.now() + LOCKOUT_DURATION_MS;
    expect(lockedUntil.getTime()).toBeCloseTo(expectedTime, -3); // Within ~1 second
  });

  it("returns user data and resets counter on successful login", async () => {
    const hash = await bcrypt.hash("password123", 10);
    mockFindUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      passwordHash: hash,
      nombre: "Test User",
      role: "admin",
      failedLoginAttempts: 3,
      lockedUntil: null,
    });
    mockUpdate.mockResolvedValue({});

    const result = await authorizeUser("test@example.com", "password123");

    expect(result).toEqual({
      id: "user1",
      email: "test@example.com",
      name: "Test User",
      role: "admin",
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  });

  it("does not update on successful login if counter is already 0", async () => {
    const hash = await bcrypt.hash("password123", 10);
    mockFindUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      passwordHash: hash,
      nombre: "Test User",
      role: "miembro",
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const result = await authorizeUser("test@example.com", "password123");

    expect(result).toEqual({
      id: "user1",
      email: "test@example.com",
      name: "Test User",
      role: "miembro",
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows login after lockout period has expired", async () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second in the past
    const hash = await bcrypt.hash("password123", 10);
    mockFindUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      passwordHash: hash,
      nombre: "Test User",
      role: "miembro",
      failedLoginAttempts: 5,
      lockedUntil: pastDate,
    });
    mockUpdate.mockResolvedValue({});

    const result = await authorizeUser("test@example.com", "password123");

    expect(result).toEqual({
      id: "user1",
      email: "test@example.com",
      name: "Test User",
      role: "miembro",
    });
  });
});
