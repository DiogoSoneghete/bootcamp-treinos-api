import z from "zod";

import { Weekday } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  isActive: z.boolean().default(true),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekday: z.enum(Object.values(Weekday) as [string, ...string[]]),
      isRest: z.boolean(),
      estimatedDurationInSeconds: z.number().min(1),
      coverImageUrl: z.string().url().nullable().optional(),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeSeconds: z.number().min(1),
        }),
      ),
    }),
  ),
});
