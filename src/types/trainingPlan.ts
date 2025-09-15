import type { PlanConfiguration, DayOfWeek } from './configuration';
import type { DailyWorkout, TrainingPhase, WorkoutType } from './workout';

export interface TrainingPlan {
  id: string;
  configuration: PlanConfiguration;
  weeks: WeeklyPlan[];
  metadata: PlanMetadata;
}

export interface PlanMetadata {
  totalMiles: number;
  totalKilometers: number;
  totalWorkouts: number;
  totalTrainingDays: number;
  totalRestDays: number;
  createdAt: Date;
  lastModified: Date;
  raceDate?: Date;
  estimatedTimeCommitment: number; // total minutes per week average
  workoutTypeDistribution: WorkoutTypeDistribution;
  phaseDistribution: PhaseDistribution;
  version: string;
}

export interface WorkoutTypeDistribution {
  easy: number;
  long: number;
  quality: number;
  rest: number;
}

export interface PhaseDistribution {
  base: number; // weeks
  build: number; // weeks
  peak: number; // weeks
  taper: number; // weeks
}

export interface WeeklyPlan {
  weekNumber: number;
  phase: TrainingPhase;
  isDeloadWeek: boolean;
  days: DailyWorkout[];
  weeklyVolume: number; // miles
  weeklyVolumeKm: number; // kilometers
  weeklyDuration: number; // total minutes
  workoutCount: number;
  qualityWorkoutCount: number;
  notes?: string;
  weeklyFocus?: string; // e.g., "Base building", "Speed development"
}

// Enhanced daily workout interface
export interface EnhancedDailyWorkout extends DailyWorkout {
  date?: Date;
  completed?: boolean;
  actualDuration?: number;
  actualDistance?: number;
  perceivedEffort?: number; // 1-10 scale
  weatherConditions?: string;
  notes?: string;
}
// Plan statistics and analysis interfaces
export interface PlanStatistics {
  averageWeeklyMileage: number;
  peakWeekMileage: number;
  totalEasyMiles: number;
  totalQualityMiles: number;
  totalLongRunMiles: number;
  longestRun: number;
  averageWorkoutsPerWeek: number;
  deloadWeekCount: number;
  progressionRate: number; // average weekly increase percentage
}

export interface WeeklyStatistics {
  weekNumber: number;
  totalMiles: number;
  totalDuration: number;
  workoutBreakdown: {
    easy: number;
    long: number;
    quality: number;
    rest: number;
  };
  intensityDistribution: {
    zone1: number; // percentage
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

// Plan comparison interface for tracking changes
export interface PlanComparison {
  originalPlan: TrainingPlan;
  modifiedPlan: TrainingPlan;
  changes: PlanChange[];
  impactAssessment: string[];
}

export interface PlanChange {
  type: 'configuration' | 'workout' | 'schedule';
  field: string;
  oldValue: any;
  newValue: any;
  weekNumber?: number;
  dayOfWeek?: DayOfWeek;
  impact: 'low' | 'medium' | 'high';
  description: string;
}
