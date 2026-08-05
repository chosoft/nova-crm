/**
 * Shared error handling utilities for server actions.
 * Ensures all database and unexpected errors are sanitized before reaching the user.
 *
 * RULES:
 * - NEVER expose: server hostnames, connection strings, credentials, SQL queries, stack traces
 * - Connection/timeout errors → "El servicio no está disponible temporalmente"
 * - Unique constraint (duplicate name) → specific message for the entity
 * - Generic/unexpected → "Ocurrió un error inesperado. Por favor, intente de nuevo."
 */

export interface SanitizedErrorResult {
  success: false;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * Sanitizes a database error into a user-safe response.
 * Checks for connection errors, constraint violations, and falls back to a generic message.
 */
export function handleDatabaseError(
  error: unknown,
  options?: {
    /** Field name for unique constraint violation error (e.g., "nombre") */
    uniqueConstraintField?: string;
    /** User-facing message for unique constraint violation */
    uniqueConstraintMessage?: string;
  }
): SanitizedErrorResult {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Connection / timeout errors
    if (
      message.includes("connect") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("connection") ||
      message.includes("enotfound") ||
      message.includes("ehostunreach")
    ) {
      return {
        success: false,
        message: "El servicio no está disponible temporalmente",
      };
    }

    // Unique constraint violation (Prisma P2002)
    if (
      message.includes("unique constraint") ||
      message.includes("p2002") ||
      message.includes("duplicate")
    ) {
      if (options?.uniqueConstraintField && options?.uniqueConstraintMessage) {
        return {
          success: false,
          errors: {
            [options.uniqueConstraintField]: [options.uniqueConstraintMessage],
          },
        };
      }
      return {
        success: false,
        message: "El registro ya existe en el sistema",
      };
    }
  }

  // Generic sanitized error - never expose internals
  return {
    success: false,
    message: "Ocurrió un error inesperado. Por favor, intente de nuevo.",
  };
}

/**
 * List of patterns that should NEVER appear in user-facing error messages.
 * Used for testing/validation purposes.
 */
export const SENSITIVE_PATTERNS = [
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
  /postgresql?:\/\//, // Connection strings
  /postgres:\/\//,
  /password/i,
  /credential/i,
  /SELECT\s|INSERT\s|UPDATE\s|DELETE\s|DROP\s/i, // SQL keywords
  /at\s+\S+\s*\(.*:\d+:\d+\)/, // Stack trace lines (e.g., "at Object.query (/app/src:10:5)")
  /at\s+.*\.\w+:\d+:\d+/, // Stack trace paths (e.g., "at /app/src/lib/db.ts:10:5")
  /localhost:\d+/,
  /\.vercel\./, // Vercel hostnames
  /POSTGRES_/i, // Environment variable names
];

/**
 * Validates that a message does not contain sensitive information.
 * Returns true if the message is safe to show to users.
 */
export function isSanitizedMessage(message: string): boolean {
  return !SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}
