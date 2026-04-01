# Bootcamp Treinos API

API robusta para gerenciamento de planos de treino, desenvolvida com foco em performance e tipagem forte.

## Objetivo
Esta API resolve o problema de organização e acompanhamento de rotinas de exercícios físicos, permitindo a criação de planos de treino personalizados com dias específicos, exercícios detalhados (séries, repetições, descanso) e controle de planos ativos.

## Stack Tecnológica
- **Runtime:** Node.js v24.x
- **Framework:** Fastify v5
- **Linguagem:** TypeScript
- **ORM:** Prisma v7 (PostgreSQL)
- **Validação:** Zod v4
- **Autenticação:** Better-auth v1
- **Documentação:** Swagger / Scalar

## Requisitos
- Node.js 24 ou superior
- PostgreSQL
- pnpm

## Instalação e Execução

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pnpm install
   ```
3. Configure as variáveis de ambiente no `.env` (baseado no `.env.example`)
4. Execute as migrations do banco de dados:
   ```bash
   pnpm prisma migrate dev
   ```
5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   pnpm dev
   ```

## Funcionalidades
- [x] Autenticação completa com better-auth
- [x] Criação de planos de treino (Workout Plans)
- [x] Gestão de dias de treino e exercícios
- [x] Controle de plano ativo por usuário
- [x] Início de sessões de treino (Workout Sessions)
- [x] Finalização de sessões de treino
- [x] Geração de dados da Home (Streak, Consistência, Treino do dia)
- [x] Documentação interativa via Scalar (/docs)

## Exemplos de Uso
...
### Buscar Dados da Home
**GET** `/home/2026-03-15`
```json
// Response (200)
{
  "activeWorkoutPlanId": "uuid_do_plano",
  "todayWorkoutDay": {
    "workoutPlanId": "uuid_do_plano",
    "id": "uuid_do_dia",
    "name": "Treino A",
    "isRest": false,
    "weekDay": "MONDAY",
    "estimatedDurationInSeconds": 3600,
    "exercisesCount": 5
  },
  "workoutStreak": 3,
  "consistencyByDay": {
    "2026-03-15": {
      "workoutDayCompleted": true,
      "workoutDayStarted": true
    },
    "2026-03-16": {
      "workoutDayCompleted": false,
      "workoutDayStarted": false
    }
  }
}
```

### Criar Plano de Treino
**POST** `/workout-plans/{workoutPlanId}/days/{workoutDayId}/sessions`
```json
// Response (201)
{
  "userWorkoutSessionId": "uuid_da_sessao"
}
```

### Finalizar Sessão de Treino
**PATCH** `/workout-plans/{workoutPlanId}/days/{workoutDayId}/sessions/{sessionId}`
```json
{
  "completedAt": "2026-03-15T15:30:00.000Z"
}

// Response (200)
{
  "id": "uuid_da_sessao",
  "completedAt": "2026-03-15T15:30:00.000Z",
  "startedAt": "2026-03-15T14:30:00.000Z"
}
```

## Comandos Úteis
- `pnpm dev`: Inicia o servidor com hot-reload.
- `pnpm prisma studio`: Interface gráfica para o banco de dados.
- `pnpm eslint .`: Executa o linter.
- `pnpm build`: Gera o build de produção.
