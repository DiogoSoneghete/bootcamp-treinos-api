---
name: api-auditor
description: Auditoria local do projeto (Fastify/Zod/Prisma) em src/
---

# API Auditor Skill

Este arquivo fornece orientações ao Gemini ao trabalhar com código neste repositório.

## Stack

- Node.js (ES modules)
- pnpm como package manager
- TypeScript (target ES2024)
- Fastify com Zod type provider
- Prisma ORM com PostgreSQL (usando pg adapter)
- better-auth para autenticação
- Zod v4

## Comandos

```bash
# Desenvolvimento
pnpm dev                    # Inicia servidor dev com watch mode (tsx --watch)

# Build
pnpm build                  # Build com tsup

# Banco de dados
pnpm prisma generate        # Gera o Prisma client (também roda no postinstall)
pnpm prisma migrate dev     # Executa migrations em desenvolvimento
pnpm prisma studio          # Abre o Prisma Studio GUI

# Linting
pnpm eslint .               # Executa ESLint
```

## Arquitetura

### Estrutura de Diretórios

- `src/` - Código fonte da aplicação
  - `lib/db.ts` - Setup do client do banco (Prisma com pg adapter)
  - `entities/` - Interfaces TypeScript para entidades de domínio
  - `errors/` - Arquivos com classes de erro
  - `schemas/` - Schemas Zod para validação de request/response
  - `usecases/` - Classes de lógica de negócio (padrão use case)
  - `generated/` - Prisma client gerado automaticamente (output em `generated/prisma/`)
- `prisma/` - Schema e migrations do Prisma

### Documentação da API

Swagger UI disponível em `/docs` quando o servidor está rodando (porta 3000).

## MCPs

- **SEMPRE** use Context7 para buscar documentações
- **SEMPRE** use Serena para semantic code retrieval e editing tools.

## Regras de Conduta

- **PROIBIÇÃO DE COMMITS AUTOMÁTICOS:** **NUNCA** execute `git add`, `git commit` ou `git push` sem a permissão explícita do usuário para a tarefa atual. Sempre proponha o que será commitado e aguarde o "ok" final.

## Regras de Automação

- **MANUTENÇÃO DE DOCUMENTAÇÃO DUPLA:** A cada interação, atualize obrigatoriamente:
  - **`README.md` (Raiz):** Visão geral, stack básica e exemplos rápidos para o GitHub. Foco em usuários/contribuidores externos.
  - **`obsidian/ProjectDescption.md`:** Documentação técnica detalhada para o desenvolvedor. Deve conter detalhes minuciosos sobre arquitetura, fluxos de autenticação, mudanças no schema do banco, lógica de novos use cases e especificações de versões das bibliotecas.
