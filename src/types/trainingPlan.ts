import type { PlanConfiguration } from './configuration';
import type { DailyWorkout, TrainingPhase } from './workout';

export interface TrainingPlan {
  id: string;
  configuration: PlanConfiguration;
  weeks: WeeklyPlan[];
  metadata: {
    totalMiles: number;
    totalWorkouts: number;
    createdAt: Date;
    raceDate?: Date;
  };
}

export interface WeeklyPlan {
  weekNumber: number;
  phase: TrainingPhase;
  isDeloadWeek: boolean;
  days: DailyWorkout[];
  weeklyVolume: number;
}
