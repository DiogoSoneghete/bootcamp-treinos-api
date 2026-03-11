//Data Transfer Object - DTO -> recebido do controller, para ser processado no use case (eu defino os tipos dos dados que eu vou receber do controller, e o que eu vou retornar para o controller)

import { NotFoundError } from "../errors/index.js";
import { Weekday } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";


interface Dto {
  userId: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekday: string;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeSeconds: number;
    }>;
  }>;
}

// export interface OutputDto {
//   id: string;
//   name: string;}

class CreateWorkoutPlan {
  async execute(dto: Dto) {
    const existingActivePlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true,
      },
    });
    //transação para garantir que não haja condições de corrida - transaction é um recurso do banco de dados que permite agrupar várias operações em uma única unidade de trabalho, garantindo que todas as operações sejam concluídas com sucesso ou revertidas em caso de falha. Isso é especialmente importante para evitar condições de corrida, onde múltiplas operações concorrentes podem interferir umas nas outras, levando a resultados inconsistentes ou corrompidos.
    // Se já existir um plano ativo, desativa ele antes de criar o novo plano
    return prisma.$transaction(async (tx) => {
            if (existingActivePlan) {
      await tx.workoutPlan.update({
        where: {
          id: existingActivePlan.id,
        },
        data: {
          isActive: false,
        },
      });
    }
    // Cria o novo plano de treino com os dias de treino e exercícios associados
    const workoutPlan = await tx.workoutPlan.create({
      data: {
        name: dto.name,
        userId: dto.userId,
        isActive: true,
        workoutDays: {
          create: dto.workoutDays.map((workoutDay) => ({
            name: workoutDay.name,
            weekday: workoutDay.weekday as Weekday,
            isRest: workoutDay.isRest,
            estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
            exercises: {
              create: workoutDay.exercises.map((exercise) => ({
                order: exercise.order,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                restTimeSeconds: exercise.restTimeSeconds,
              })),
            },
          })),
        },
      },
    });
    const result = await tx.workoutPlan.findUnique({
        where: { id: workoutPlan.id },
        include: {
          workoutDays: {
            include: {
              exercises: true,
            },
          },
        },
    });
    if (!result) {
      throw new NotFoundError("Workout plan not found after creation");
    }
    return result;
    });
  }
}

export { CreateWorkoutPlan };