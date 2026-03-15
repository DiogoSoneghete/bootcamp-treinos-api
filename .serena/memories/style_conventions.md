# Style and Conventions

## General

- **Naming:** Use camelCase for variables, methods, and functions. Use PascalCase for classes, interfaces, and types.
- **Type Safety:** Use TypeScript's strict mode. Avoid `any`.
- **Imports:** Use ESM (with `.js` extension in relative imports as required by `nodenext`).

## Git

- **SEMPRE** use [Conventional Commits](https://www.conventionalcommits.org/).
- **NUNCA** faça commit sem permissão explícita.

## API Routes (`src/routes/`)

- Follow REST principles.
- Use `fastify-type-provider-zod`.
- Always include `tags` and `summary` in the route schema.
- Routes should NOT contain business logic; they only validate (Zod/Auth) and call use cases.
- Handle use case errors with try/catch and map them to appropriate HTTP status codes using `ErrorSchema`.

## Use Cases (`src/usecases/`)

- Named as verbs (e.g., `CreateWorkoutPlan`).
- Classes with an `execute` method.
- Use `InputDto` and `OutputDto` interfaces within the same file.
- **NEVER** return Prisma models directly; map them to `OutputDto`.
- Call Prisma directly (no repositories).
- Do not handle errors (no try/catch); throw custom errors from `src/errors/index.ts`.

## Validation (`src/schemas/`)

- Use Zod v4.
- Use `z.enum(Weekday)` from `../generated/prisma/enums.js`.
- Shared schemas for request/response bodies and errors.
