import { NotFoundError, UnauthorizedError } from "../errors/index.js";
import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

interface OutputDto {
  id: string;
  name: string;
  isRest: boolean;
  coverImageUrl?: string;
  estimatedDurationInSeconds: number;
  weekDay: Weekday;
  exercises: Array<{
    id: string;
    name: string;
    order: number;
    workoutDayId: string;
    sets: number;
    reps: number;
    restTimeSeconds: number;
  }>;
  sessions: Array<{
    id: string;
    workoutDayId: string;
    startedAt: string;
    completedAt: string | null;
  }>;
}

export class GetWorkoutDay {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError("You are not the owner of this workout plan");
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { 
        id: dto.workoutDayId,
        workoutPlanId: dto.workoutPlanId 
      },
      include: {
        exercises: {
          orderBy: { order: "asc" }
        },
        sessions: {
          orderBy: { startedAt: "desc" }
        }
      }
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    return {
      id: workoutDay.id,
      name: workoutDay.name,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl ?? undefined,
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      weekDay: workoutDay.weekday,
      exercises: workoutDay.exercises.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        order: exercise.order,
        workoutDayId: exercise.workoutDayId,
        sets: exercise.sets,
        reps: exercise.reps,
        restTimeSeconds: exercise.restTimeSeconds,
      })),
      sessions: workoutDay.sessions.map(session => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
      }))
    };
  }
}
