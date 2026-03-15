# Project Overview: Bootcamp Treinos API

## Purpose

A Fastify-based REST API for managing workout plans, days, and exercises. It serves as the backend for a workout bootcamp (FSC).

## Tech Stack

- **Framework:** Fastify v5 (with `fastify-type-provider-zod`)
- **Database/ORM:** PostgreSQL with Prisma v7
- **Authentication:** Better Auth
- **Validation:** Zod v4
- **API Documentation:** Scalar (via `@fastify/swagger` and `@scalar/fastify-api-reference`)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Development Tools:** tsx (watch mode), ESLint, Prettier

## Core Architecture

The project follows a Clean Architecture/Use Case pattern:

- **Routes (`src/routes/`):** Handle HTTP concerns (routing, request validation with Zod, authentication checks, calling use cases, and error handling).
- **Use Cases (`src/usecases/`):** Contain business logic. Each use case is a class with an `execute` method, using DTOs for input and output. They interact directly with Prisma.
- **Schemas (`src/schemas/`):** Centralized Zod schemas for shared data structures and error responses.
- **Errors (`src/errors/index.ts`):** Custom error classes for domain-specific failures.
- **Libraries (`src/lib/`):** Shared utilities for database connection and authentication.
