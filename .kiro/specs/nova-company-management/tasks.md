# Implementation Plan: Nova Company Management

## Overview

Plan de implementación incremental para el sistema de gestión de empresas y universidades de Nova. Se construye desde la base de datos y validaciones hasta las vistas de UI, pasando por autenticación, server actions, y dashboard. Cada paso integra lo construido anteriormente para evitar código huérfano.

## Tasks

- [x] 1. Set up project structure, database schema, and core configuration
  - [x] 1.1 Initialize Next.js project with Prisma, Auth.js, and Tailwind CSS
    - Create Next.js 14+ project with App Router
    - Install dependencies: prisma, @prisma/client, next-auth@5, zod, tailwindcss, fast-check, vitest, @testing-library/react
    - Configure `tsconfig.json` path aliases (`@/`)
    - Create `src/lib/db.ts` with Prisma client singleton
    - Create `src/lib/utils.ts` with helper utilities
    - _Requirements: 8.1, 8.2_

  - [x] 1.2 Define Prisma schema and run initial migration
    - Create `prisma/schema.prisma` with all models: User, Empresa, EmpresaHistorial, Universidad, EventoDifusion
    - Define enums: Role (admin, miembro), Modalidad (stand, patrocinador), Estado (pendiente, contactada, confirmada, rechazada)
    - Configure datasource for Vercel Postgres (POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING)
    - Generate Prisma client and run `prisma migrate dev`
    - _Requirements: 8.2, 1.1, 5.1_

  - [x] 1.3 Create Zod validation schemas
    - Create `src/lib/validations/empresa.ts` with empresaSchema (nombre: 1-100, numeroContacto: 7-15 digits, descripcion: 1-500, modalidad: enum)
    - Create `src/lib/validations/universidad.ts` with universidadSchema (nombre: 1-100, nombreContacto: 1-80, numeroContacto: 7-15 digits)
    - Create `src/lib/validations/evento.ts` with eventoSchema (fecha: future date, descripcion: 1-300)
    - Create `src/lib/validations/auth.ts` with loginSchema (email, password)
    - Export TypeScript types inferred from each schema
    - _Requirements: 1.2, 1.3, 1.5, 1.7, 5.2, 5.4_

  - [x] 1.4 Write property tests for validation schemas
    - **Property 3: Schema validation correctly accepts and rejects inputs**
    - **Property 4: Validation errors identify exactly the invalid fields**
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.7, 5.2, 5.4, 1.6, 5.6**

- [x] 2. Implement authentication and authorization
  - [x] 2.1 Configure Auth.js v5 with Credentials provider
    - Create `src/lib/auth.ts` with NextAuth configuration
    - Implement Credentials provider with email/password
    - Use bcrypt for password hashing/verification
    - Configure JWT session strategy with role claim
    - Implement failed login attempt tracking and account locking (5 attempts, 15 min lockout)
    - Reset failed attempts counter on successful login
    - Create `src/app/api/auth/[...nextauth]/route.ts` route handler
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.2 Implement middleware for route protection and RBAC
    - Create `src/middleware.ts` with route protection logic
    - Define public routes: ["/login"]
    - Define admin-only routes: ["/dashboard"]
    - Define member routes: ["/empresas", "/universidades"]
    - Redirect unauthenticated users to /login
    - Redirect miembro users accessing /dashboard to /empresas
    - Allow both roles access to member routes
    - _Requirements: 6.1, 6.5, 6.6_

  - [x] 2.3 Create login page and auth server action
    - Create `src/app/(auth)/login/page.tsx` with login form
    - Create `src/actions/auth.ts` with signIn server action
    - Implement client-side Zod validation on form
    - Display generic error message on failed login ("Correo electrónico o contraseña incorrectos")
    - Display account locked message when applicable
    - Redirect admin to /dashboard, miembro to /empresas on success
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.4 Write property tests for authentication logic
    - **Property 13: Authentication redirect matches user role**
    - **Property 14: Authentication error message is generic**
    - **Property 15: Account locks after exactly 5 consecutive failed attempts**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 2.5 Write property test for authorization
    - **Property 8: Admin-only operations are denied for Miembros**
    - **Validates: Requirements 3.2, 5.8, 6.6**

- [x] 3. Checkpoint - Ensure authentication and database work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement empresa management (CRUD + state)
  - [x] 4.1 Create empresa server actions
    - Create `src/actions/empresas.ts` with `crearEmpresa` server action
    - Validate input with Zod empresaSchema
    - Check for duplicate nombre before creation
    - Set initial estado to "pendiente"
    - Link empresa to authenticated user (miembroId)
    - Create `cambiarEstadoEmpresa` server action (admin-only)
    - Implement same-state no-op check
    - Create EmpresaHistorial entry on state change
    - Handle database errors with sanitized messages
    - _Requirements: 1.1, 1.4, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.4, 3.6, 8.3_

  - [x] 4.2 Write property tests for empresa creation
    - **Property 1: Entity creation initializes estado as "pendiente"**
    - **Property 2: Entity creation links to the authenticated creator**
    - **Property 7: Duplicate empresa name is rejected**
    - **Validates: Requirements 1.1, 1.4, 1.8**

  - [x] 4.3 Write property tests for empresa state management
    - **Property 9: State change creates a historial entry with correct data**
    - **Property 10: Same-state transition is a no-op**
    - **Validates: Requirements 3.1, 3.4, 3.6**

  - [x] 4.4 Create empresa list page with filters
    - Create `src/app/(dashboard)/empresas/page.tsx` as Server Component
    - Query all empresas ordered alphabetically by nombre
    - Display nombre, modalidad, estado (color badge), miembro asignado
    - Implement modalidad filter (dropdown/select)
    - Implement estado filter (dropdown/select)
    - Apply combined filters when both active
    - Show empty state message when no results
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.5 Write property tests for empresa filtering and sorting
    - **Property 5: Filtering returns only matching results**
    - **Property 6: Empresa list is sorted alphabetically by name**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 4.6 Create empresa registration and detail pages
    - Create `src/app/(dashboard)/empresas/nueva/page.tsx` with EmpresaForm
    - Create `src/components/empresas/EmpresaForm.tsx` with client-side validation
    - Use `useActionState` to preserve form data on errors
    - Display field-specific error messages in Spanish
    - Create `src/app/(dashboard)/empresas/[id]/page.tsx` with detail view
    - Show full empresa info + historial de cambios de estado
    - Add estado change dropdown for admin users only
    - Create `src/components/empresas/EstadoBadge.tsx` with color-coded badges
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 1.8, 2.5, 3.1, 3.4, 3.5, 8.5_

- [x] 5. Implement universidad management
  - [x] 5.1 Create universidad server actions
    - Create `src/actions/universidades.ts` with `crearUniversidad` server action
    - Validate input with Zod universidadSchema
    - Set initial estado to "pendiente"
    - Link universidad to authenticated user (miembroId)
    - Create `cambiarEstadoUniversidad` server action (admin-only)
    - Create `agendarEvento` server action
    - Validate universidad estado is "confirmada" before allowing event scheduling
    - Validate evento input with eventoSchema (future date, description)
    - Handle authorization and validation errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 5.8, 5.9, 5.10_

  - [x] 5.2 Write property tests for universidad and events
    - **Property 12: Event scheduling requires universidad in estado "confirmada"**
    - **Validates: Requirements 5.9**

  - [x] 5.3 Create universidad list, registration, and detail pages
    - Create `src/app/(dashboard)/universidades/page.tsx` with list view
    - Display nombre, estado, miembro asignado, fecha evento (or "sin evento agendado")
    - Create `src/app/(dashboard)/universidades/nueva/page.tsx` with registration form
    - Create `src/components/universidades/UniversidadForm.tsx` with validation
    - Use `useActionState` to preserve form data on errors
    - Create `src/app/(dashboard)/universidades/[id]/page.tsx` with detail + event scheduling
    - Show event scheduling form only when estado is "confirmada"
    - Add estado change dropdown for admin users only
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9_

- [x] 6. Checkpoint - Ensure empresa and universidad features work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement admin dashboard
  - [x] 7.1 Create dashboard page with metrics
    - Create `src/app/(dashboard)/dashboard/page.tsx` (admin-only Server Component)
    - Query and display per-member metrics: total empresas, empresas confirmadas, total universidades, universidades confirmadas
    - Display general estado summary: total empresas grouped by estado
    - Show empty state message when no data exists
    - Show members with zero values when they have no assignments
    - Create `src/components/dashboard/MemberMetrics.tsx`
    - Create `src/components/dashboard/EstadoSummary.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.2 Write property test for dashboard aggregation
    - **Property 11: Dashboard aggregation matches underlying data**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 8. Implement UI layout, navigation, and styling
  - [x] 8.1 Create dashboard layout with navigation and responsive design
    - Create `src/app/(dashboard)/layout.tsx` with sidebar navigation
    - Implement responsive navigation: sidebar on desktop, collapsible hamburger menu on mobile
    - Apply minimalist design: neutral color palette (max 3 + 1 accent), sans-serif typography with 4 size levels
    - Ensure 16px spacing between grouped elements, 32px between sections, 30% whitespace on desktop
    - Ensure minimum 44x44px touch targets on mobile
    - Implement 2 breakpoints: mobile (<768px) and desktop (>=768px)
    - Add logout button to navigation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Create shared UI components
    - Create `src/components/ui/Button.tsx` (primary, secondary, danger variants)
    - Create `src/components/ui/Input.tsx` with error state support
    - Create `src/components/ui/Select.tsx` for dropdowns
    - Create `src/components/ui/Card.tsx` for content containers
    - Create `src/components/ui/EmptyState.tsx` for no-data messages
    - Style all components with Tailwind CSS following minimalist guidelines
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Implement error handling and database resilience
  - [x] 9.1 Add global error handling and sanitized responses
    - Create error boundary components for unexpected errors
    - Implement try/catch in all server actions with sanitized error messages
    - Ensure database connection errors show "El servicio no está disponible temporalmente"
    - Ensure constraint violation (duplicate name) shows specific message
    - Never expose server hostnames, connection strings, credentials, SQL, or stack traces
    - Preserve form data on all error scenarios using useActionState
    - _Requirements: 8.3, 8.5, 1.6, 5.6_

  - [x] 9.2 Write property test for error sanitization
    - **Property 16: Database error responses are sanitized**
    - **Validates: Requirements 8.3**

- [x] 10. Final checkpoint - Ensure all tests pass and integration is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript throughout with Vitest + fast-check for testing
- All validation is dual: client-side (UX) and server-side (security)
- Server Actions handle all mutations; React Server Components handle reads

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4", "2.1"] },
    { "id": 4, "tasks": ["2.2", "2.3"] },
    { "id": 5, "tasks": ["2.4", "2.5", "4.1", "5.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "4.4", "5.2", "5.3"] },
    { "id": 7, "tasks": ["4.5", "4.6", "8.1", "8.2"] },
    { "id": 8, "tasks": ["7.1"] },
    { "id": 9, "tasks": ["7.2", "9.1"] },
    { "id": 10, "tasks": ["9.2"] }
  ]
}
```
