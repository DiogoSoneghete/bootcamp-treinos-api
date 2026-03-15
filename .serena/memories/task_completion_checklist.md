# Task Completion Checklist

Before considering a task complete, ensure the following:

1. **Architecture Compliance:** Does the change follow the Routes -> Use Cases -> Prisma pattern? Are DTOs used?
2. **Type Safety:** Are all new types and interfaces correctly defined and used?
3. **Validation:** Are request and response schemas updated/created in `src/schemas/` and used in routes?
4. **Documentation:** Are Swagger `tags` and `summary` updated in the route schema?
5. **Code Style:** Run `pnpm exec eslint .` and `pnpm exec prettier . --write`.
6. **Git:** Prepare a commit message following Conventional Commits.
7. **Testing:** (When test infrastructure is available) Ensure all tests pass.
8. **Prisma:** If the schema changed, run `pnpm exec prisma generate` and consider `pnpm exec prisma db push`.
