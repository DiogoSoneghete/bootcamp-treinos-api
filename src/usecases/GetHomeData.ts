import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  date: string;
}

interface OutputDto {
  activeWorkoutPlanId: string;
  todayWorkoutDay: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: string;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercisesCount: number;
  } | null;
  workoutStreak: number;
  consistencyByDay: {
    [key: string]: {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    };
  };
}

const mapDayjsToWeekday = (day: number): Weekday => {
  const map: Record<number, Weekday> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };
  return map[day] as Weekday;
};

class GetHomeData {
  async execute({ userId, date }: InputDto): Promise<OutputDto> {
    const targetDate = dayjs.utc(date);
    const startOfWeek = targetDate.startOf("week");
    const endOfWeek = targetDate.endOf("week");

    const activePlan = await prisma.workoutPlan.findFirst({
      where: { userId, isActive: true },
      include: {
        workoutDays: {
          include: {
            exercises: true,
          },
        },
      },
    });

    if (!activePlan) {
      throw new NotFoundError("Active workout plan not found");
    }

    const todayWeekday = mapDayjsToWeekday(targetDate.day());
    const todayWorkoutDayData = activePlan.workoutDays.find(
      (day) => day.weekday === todayWeekday
    );

    let todayWorkoutDay = null;
    if (todayWorkoutDayData) {
      todayWorkoutDay = {
        workoutPlanId: activePlan.id,
        id: todayWorkoutDayData.id,
        name: todayWorkoutDayData.name,
        isRest: todayWorkoutDayData.isRest,
        weekDay: todayWorkoutDayData.weekday,
        estimatedDurationInSeconds: todayWorkoutDayData.estimatedDurationInSeconds,
        coverImageUrl: todayWorkoutDayData.coverImageUrl ?? undefined,
        exercisesCount: todayWorkoutDayData.exercises.length,
      };
    }

    // Consistency
    const sessionsThisWeek = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: userId,
          },
        },
        startedAt: {
          gte: startOfWeek.toDate(),
          lte: endOfWeek.toDate(),
        },
      },
    });

    const consistencyByDay: Record<string, { workoutDayCompleted: boolean; workoutDayStarted: boolean }> = {};
    
    // Initialize consistency map for the 7 days of the week
    for (let i = 0; i < 7; i++) {
      const currentDay = startOfWeek.add(i, "day").format("YYYY-MM-DD");
      consistencyByDay[currentDay] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    }

    for (const session of sessionsThisWeek) {
      const sessionDateStr = dayjs(session.startedAt).utc().format("YYYY-MM-DD");
      if (consistencyByDay[sessionDateStr]) {
        consistencyByDay[sessionDateStr].workoutDayStarted = true;
        if (session.completedAt) {
          consistencyByDay[sessionDateStr].workoutDayCompleted = true;
        }
      }
    }

    // Workout Streak Calculation
    // Find consecutive days the user has completed a session backwards from "targetDate".
    // Only scheduled days (present in the active plan) break the streak if missed.
    let streak = 0;
    
    const allCompletedSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: { workoutPlan: { userId } },
        completedAt: { not: null },
      },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' }
    });

    const completedDates = new Set(
      allCompletedSessions.map(s => dayjs(s.startedAt).utc().format("YYYY-MM-DD"))
    );

    const planWeekdays = new Set(activePlan.workoutDays.map(d => d.weekday));

    // Check from targetDate backwards
    // A maximum arbitrary search space (e.g. 365 days) to avoid infinite loops
    let currentCheckDate = targetDate.clone();
    for (let i = 0; i < 365; i++) {
      const dateStr = currentCheckDate.format("YYYY-MM-DD");
      const weekday = mapDayjsToWeekday(currentCheckDate.day());
      
      const isScheduled = planWeekdays.has(weekday);
      const isCompleted = completedDates.has(dateStr);

      if (isCompleted) {
        streak++;
      } else if (isScheduled) {
        // If it's today and not completed, we don't break the streak yet
        if (i > 0) {
          break; // Missed a scheduled day in the past, streak breaks
        }
      }

      currentCheckDate = currentCheckDate.subtract(1, "day");
    }

    return {
      activeWorkoutPlanId: activePlan.id,
      todayWorkoutDay,
      workoutStreak: streak,
      consistencyByDay,
    };
  }
}

export { GetHomeData };