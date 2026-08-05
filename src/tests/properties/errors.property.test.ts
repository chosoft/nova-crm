import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  handleDatabaseError,
  isSanitizedMessage,
  SENSITIVE_PATTERNS,
} from "@/lib/errors";

// Feature: nova-company-management, Property 16: Database error responses are sanitized
// **Validates: Requirements 8.3**

// --- Generators for sensitive content ---

/** Random IPv4 addresses (e.g., 192.168.1.42) */
const ipAddressArb = fc
  .tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 1, max: 255 })
  )
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/** Random connection strings (postgresql://user:pass@host:port/db) */
const connectionStringArb = fc
  .record({
    user: fc.stringMatching(/^[a-z]{3,10}$/),
    password: fc.stringMatching(/^[a-zA-Z0-9]{4,16}$/),
    host: fc.stringMatching(/^[a-z]{3,10}$/),
    port: fc.integer({ min: 1000, max: 65535 }),
    db: fc.stringMatching(/^[a-z]{3,10}$/),
  })
  .map(
    ({ user, password, host, port, db }) =>
      `postgresql://${user}:${password}@${host}:${port}/${db}`
  );

/** Random SQL queries */
const sqlQueryArb = fc.oneof(
  fc.record({
    table: fc.stringMatching(/^[a-z_]{3,15}$/),
    col: fc.stringMatching(/^[a-z_]{3,10}$/),
  }).map(({ table, col }) => `SELECT ${col} FROM ${table}`),
  fc.record({
    table: fc.stringMatching(/^[a-z_]{3,15}$/),
  }).map(({ table }) => `INSERT INTO ${table} VALUES (1, 'test')`),
  fc.record({
    table: fc.stringMatching(/^[a-z_]{3,15}$/),
    col: fc.stringMatching(/^[a-z_]{3,10}$/),
  }).map(({ table, col }) => `UPDATE ${table} SET ${col} = 'value'`),
  fc.record({
    table: fc.stringMatching(/^[a-z_]{3,15}$/),
  }).map(({ table }) => `DELETE FROM ${table} WHERE id = 1`),
  fc.record({
    table: fc.stringMatching(/^[a-z_]{3,15}$/),
  }).map(({ table }) => `DROP TABLE ${table}`)
);

/** Random stack traces */
const stackTraceArb = fc
  .record({
    func: fc.stringMatching(/^[a-zA-Z]{3,10}$/),
    file: fc.stringMatching(/^[a-z]{3,10}$/),
    line: fc.integer({ min: 1, max: 999 }),
    col: fc.integer({ min: 1, max: 99 }),
  })
  .map(
    ({ func, file, line, col }) =>
      `at ${func} (/app/src/${file}.ts:${line}:${col})`
  );

/** Random credential-like strings */
const credentialArb = fc.oneof(
  fc.stringMatching(/^[a-zA-Z0-9]{8,20}$/).map(
    (val) => `password=${val}`
  ),
  fc.stringMatching(/^[a-zA-Z0-9]{8,20}$/).map(
    (val) => `credential: ${val}`
  ),
  fc.constant("POSTGRES_PASSWORD=secret123"),
  fc.constant("POSTGRES_URL=postgresql://user:pass@host/db")
);

/** Random localhost references */
const localhostArb = fc
  .integer({ min: 1000, max: 65535 })
  .map((port) => `localhost:${port}`);

/** Composite generator combining multiple sensitive patterns */
const sensitiveErrorMessageArb = fc.oneof(
  // Single sensitive patterns
  ipAddressArb.map((ip) => `Connection failed to ${ip}`),
  connectionStringArb.map((cs) => `Error connecting: ${cs}`),
  sqlQueryArb.map((sql) => `Failed to execute: ${sql}`),
  stackTraceArb.map((st) => `Error\n${st}`),
  credentialArb.map((cred) => `Auth error: ${cred}`),
  localhostArb.map((lh) => `Cannot connect to ${lh}`),
  // Combined patterns (multiple sensitive items in one message)
  fc
    .tuple(ipAddressArb, sqlQueryArb, stackTraceArb)
    .map(
      ([ip, sql, st]) =>
        `Database error at ${ip}: ${sql}\n${st}`
    ),
  fc
    .tuple(connectionStringArb, stackTraceArb)
    .map(
      ([cs, st]) =>
        `Connection to ${cs} failed\n${st}`
    )
);

describe("Property 16: Database error responses are sanitized", () => {
  it("handleDatabaseError never exposes sensitive information in message field", () => {
    fc.assert(
      fc.property(sensitiveErrorMessageArb, (sensitiveMessage) => {
        const error = new Error(sensitiveMessage);
        const result = handleDatabaseError(error);

        // The result must have success === false
        expect(result.success).toBe(false);

        // If message is present, it must be sanitized
        if (result.message) {
          expect(isSanitizedMessage(result.message)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("handleDatabaseError never exposes sensitive information in errors field", () => {
    fc.assert(
      fc.property(sensitiveErrorMessageArb, (sensitiveMessage) => {
        const error = new Error(sensitiveMessage);
        const result = handleDatabaseError(error, {
          uniqueConstraintField: "nombre",
          uniqueConstraintMessage: "El nombre ya existe",
        });

        expect(result.success).toBe(false);

        // If errors object is present, all values must be sanitized
        if (result.errors) {
          for (const fieldErrors of Object.values(result.errors)) {
            for (const errMsg of fieldErrors) {
              expect(isSanitizedMessage(errMsg)).toBe(true);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("no SENSITIVE_PATTERNS regex matches any user-facing string in the result", () => {
    fc.assert(
      fc.property(sensitiveErrorMessageArb, (sensitiveMessage) => {
        const error = new Error(sensitiveMessage);
        const result = handleDatabaseError(error);

        expect(result.success).toBe(false);

        // Collect all user-facing strings from the result
        const userFacingStrings: string[] = [];
        if (result.message) {
          userFacingStrings.push(result.message);
        }
        if (result.errors) {
          for (const fieldErrors of Object.values(result.errors)) {
            userFacingStrings.push(...fieldErrors);
          }
        }

        // No sensitive pattern should match any user-facing string
        for (const str of userFacingStrings) {
          for (const pattern of SENSITIVE_PATTERNS) {
            expect(pattern.test(str)).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("non-Error values (strings, objects, undefined) are also sanitized", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          sensitiveErrorMessageArb, // sensitive string passed directly
          fc.constant(undefined),
          fc.constant(null),
          fc.record({
            message: sensitiveErrorMessageArb,
            code: fc.string(),
          })
        ),
        (errorValue) => {
          const result = handleDatabaseError(errorValue);

          expect(result.success).toBe(false);

          // All user-facing strings must be sanitized
          const userFacingStrings: string[] = [];
          if (result.message) {
            userFacingStrings.push(result.message);
          }
          if (result.errors) {
            for (const fieldErrors of Object.values(result.errors)) {
              userFacingStrings.push(...fieldErrors);
            }
          }

          for (const str of userFacingStrings) {
            expect(isSanitizedMessage(str)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
