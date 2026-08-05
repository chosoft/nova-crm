import { type ClassValue, clsx } from "clsx";

/**
 * Merge Tailwind CSS class names, resolving conflicts.
 * Uses clsx for conditional classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a Date object to a localized Spanish date string.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a Date object to a localized Spanish date-time string.
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sanitize an error message for user display.
 * Strips any technical details that should not be exposed.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Never expose technical details
    const sensitivePatterns = [
      /postgresql/i,
      /prisma/i,
      /connection/i,
      /ECONNREFUSED/i,
      /timeout/i,
      /socket/i,
      /host/i,
    ];

    const message = error.message;
    if (sensitivePatterns.some((pattern) => pattern.test(message))) {
      return "El servicio no está disponible temporalmente. Por favor, intente de nuevo en unos minutos.";
    }
  }

  return "Ocurrió un error inesperado. Por favor, intente de nuevo.";
}

/**
 * Type-safe action result wrapper for server actions.
 */
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
