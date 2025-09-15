import type {
  TrainingPlan,
  WeeklyPlan,
  PlanMetadata,
  PlanStatistics,
  WeeklyStatistics,
  WorkoutTypeDistribution,
  PhaseDistribution,
  PlanComparison,
  PlanChange
} from '@/types/trainingPlan';
import type { DailyWorkout, WorkoutType, TrainingPhase } from '@/types/workout';
import type { PlanConfiguration, DayOfWeek } from '@/types/configuration';

/**
 * Creates a new training plan with generated metadata
 */
export function createTrainingPlan(
  configuration: PlanConfiguration,
  weeks: WeeklyPlan[]
): TrainingPlan {
  const id = generatePlanId();
  const metadata = calculatePlanMetadata(weeks, configuration);

  return {
    id,
    configuration,
    weeks,
    metadata
  };
}

/**
 * Generates a unique plan ID
 */
export function generatePlanId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `plan_${timestamp}_${random}`;
}

/**
 * Calculates comprehensive metadata for a training plan
 */
export function calculatePlanMetadata(
  weeks: WeeklyPlan[],
  configuration: PlanConfiguration
): PlanMetadata {
  const totalMiles = weeks.reduce((sum, week) => sum + week.weeklyVolume, 0);
  const totalKilometers = totalMiles * 1.60934; // Convert miles to km
  
  const workoutTypeDistribution = calculateWorkoutTypeDistribution(weeks);
  const phaseDistribution = calculatePhaseDistribution(weeks);
  
  const totalWorkouts = weeks.reduce((sum, week) => sum + week.workoutCount, 0);
  const totalTrainingDays = weeks.reduce((sum, week) => 
    sum + week.days.filter(day => !day.isRestDay).length, 0
  );
  const totalRestDays = weeks.reduce((sum, week) => 
    sum + week.days.filter(day => day.isRestDay).length, 0
  );

  const estimatedTimeCommitment = calculateEstimatedTimeCommitment(weeks);

  return {
    totalMiles,
    totalKilometers,
    totalWorkouts,
    totalTrainingDays,
    totalRestDays,
    createdAt: new Date(),
    lastModified: new Date(),
    estimatedTimeCommitment,
    workoutTypeDistribution,
    phaseDistribution,
    version: '1.0.0'
  };
}

/**
 * Calculates workout type distribution across the plan
 */
export function calculateWorkoutTypeDistribution(weeks: WeeklyPlan[]): WorkoutTypeDistribution {
  const distribution = { easy: 0, long: 0, quality: 0, rest: 0 };
  
  weeks.forEach(week => {
    week.days.forEach(day => {
      if (day.isRestDay) {
        distribution.rest++;
      } else if (day.workout) {
        distribution[day.workout.type as keyof WorkoutTypeDistribution]++;
      }
    });
  });

  return distribution;
}

/**
 * Calculates phase distribution across the plan
 */
export function calculatePhaseDistribution(weeks: WeeklyPlan[]): PhaseDistribution {
  const distribution = { base: 0, build: 0, peak: 0, taper: 0 };
  
  weeks.forEach(week => {
    distribution[week.phase]++;
  });

  return distribution;
}

/**
 * Calculates estimated time commitment per week
 */
export function calculateEstimatedTimeCommitment(weeks: WeeklyPlan[]): number {
  const totalMinutes = weeks.reduce((sum, week) => sum + week.weeklyDuration, 0);
  return Math.round(totalMinutes / weeks.length);
}

/**
 * Calculates comprehensive plan statistics
 */
export function calculatePlanStatistics(plan: TrainingPlan): PlanStatistics {
  const weeks = plan.weeks;
  const weeklyMileages = weeks.map(week => week.weeklyVolume);
  
  const averageWeeklyMileage = weeklyMileages.reduce((sum, miles) => sum + miles, 0) / weeks.length;
  const peakWeekMileage = Math.max(...weeklyMileages);
  
  // Calculate workout type mileages
  let totalEasyMiles = 0;
  let totalQualityMiles = 0;
  let totalLongRunMiles = 0;
  let longestRun = 0;
  
  weeks.forEach(week => {
    week.days.forEach(day => {
      if (day.workout && day.workout.distance) {
        const distance = day.workout.distance;
        
        switch (day.workout.type) {
          case 'easy':
            totalEasyMiles += distance;
            break;
          case 'quality':
            totalQualityMiles += distance;
            break;
          case 'long':
            totalLongRunMiles += distance;
            longestRun = Math.max(longestRun, distance);
            break;
        }
      }
    });
  });

  const averageWorkoutsPerWeek = plan.metadata.totalWorkouts / weeks.length;
  const deloadWeekCount = weeks.filter(week => week.isDeloadWeek).length;
  
  // Calculate progression rate
  const progressionRate = calculateProgressionRate(weeklyMileages);

  return {
    averageWeeklyMileage,
    peakWeekMileage,
    totalEasyMiles,
    totalQualityMiles,
    totalLongRunMiles,
    longestRun,
    averageWorkoutsPerWeek,
    deloadWeekCount,
    progressionRate
  };
}

/**
 * Calculates weekly statistics for a specific week
 */
export function calculateWeeklyStatistics(week: WeeklyPlan): WeeklyStatistics {
  const workoutBreakdown = { easy: 0, long: 0, quality: 0, rest: 0 };
  
  week.days.forEach(day => {
    if (day.isRestDay) {
      workoutBreakdown.rest++;
    } else if (day.workout) {
      workoutBreakdown[day.workout.type as keyof typeof workoutBreakdown]++;
    }
  });

  // Simplified intensity distribution calculation
  const intensityDistribution = calculateIntensityDistribution(week);

  return {
    weekNumber: week.weekNumber,
    totalMiles: week.weeklyVolume,
    totalDuration: week.weeklyDuration,
    workoutBreakdown,
    intensityDistribution
  };
}

/**
 * Calculates intensity distribution for a week
 */
function calculateIntensityDistribution(week: WeeklyPlan) {
  // Simplified calculation - in a real implementation, this would be more sophisticated
  const totalWorkouts = week.days.filter(day => !day.isRestDay).length;
  
  if (totalWorkouts === 0) {
    return { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  }

  // Basic distribution based on workout types
  let zone1 = 0, zone2 = 0, zone3 = 0, zone4 = 0, zone5 = 0;
  
  week.days.forEach(day => {
    if (day.workout) {
      switch (day.workout.intensity) {
        case 'zone1': zone1++; break;
        case 'zone2': zone2++; break;
        case 'zone3': zone3++; break;
        case 'zone4': zone4++; break;
        case 'zone5': zone5++; break;
      }
    }
  });

  return {
    zone1: Math.round((zone1 / totalWorkouts) * 100),
    zone2: Math.round((zone2 / totalWorkouts) * 100),
    zone3: Math.round((zone3 / totalWorkouts) * 100),
    zone4: Math.round((zone4 / totalWorkouts) * 100),
    zone5: Math.round((zone5 / totalWorkouts) * 100)
  };
}

/**
 * Calculates progression rate from weekly mileages
 */
function calculateProgressionRate(weeklyMileages: number[]): number {
  if (weeklyMileages.length < 2) return 0;
  
  let totalIncrease = 0;
  let increaseCount = 0;
  
  for (let i = 1; i < weeklyMileages.length; i++) {
    const previousWeek = weeklyMileages[i - 1];
    const currentWeek = weeklyMileages[i];
    
    if (previousWeek > 0) {
      const increase = ((currentWeek - previousWeek) / previousWeek) * 100;
      totalIncrease += increase;
      increaseCount++;
    }
  }
  
  return increaseCount > 0 ? totalIncrease / increaseCount : 0;
}

/**
 * Finds a specific workout in the plan
 */
export function findWorkout(
  plan: TrainingPlan,
  weekNumber: number,
  dayOfWeek: DayOfWeek
): DailyWorkout | null {
  const week = plan.weeks.find(w => w.weekNumber === weekNumber);
  if (!week) return null;
  
  return week.days.find(day => day.dayOfWeek === dayOfWeek) || null;
}

/**
 * Gets all workouts of a specific type from the plan
 */
export function getWorkoutsByType(
  plan: TrainingPlan,
  workoutType: WorkoutType
): DailyWorkout[] {
  const workouts: DailyWorkout[] = [];
  
  plan.weeks.forEach(week => {
    week.days.forEach(day => {
      if (day.workout && day.workout.type === workoutType) {
        workouts.push(day);
      }
    });
  });
  
  return workouts;
}

/**
 * Gets all weeks in a specific training phase
 */
export function getWeeksByPhase(
  plan: TrainingPlan,
  phase: TrainingPhase
): WeeklyPlan[] {
  return plan.weeks.filter(week => week.phase === phase);
}

/**
 * Updates plan metadata after modifications
 */
export function updatePlanMetadata(plan: TrainingPlan): TrainingPlan {
  const updatedMetadata = {
    ...plan.metadata,
    ...calculatePlanMetadata(plan.weeks, plan.configuration),
    lastModified: new Date()
  };

  return {
    ...plan,
    metadata: updatedMetadata
  };
}

/**
 * Validates plan structure and data integrity
 */
export function validatePlanStructure(plan: TrainingPlan): string[] {
  const errors: string[] = [];
  
  // Check basic structure
  if (!plan.id) errors.push('Plan must have an ID');
  if (!plan.configuration) errors.push('Plan must have configuration');
  if (!plan.weeks || plan.weeks.length === 0) errors.push('Plan must have weeks');
  if (!plan.metadata) errors.push('Plan must have metadata');
  
  // Check week numbering
  const expectedWeeks = plan.configuration.programLength;
  if (plan.weeks.length !== expectedWeeks) {
    errors.push(`Expected ${expectedWeeks} weeks, but found ${plan.weeks.length}`);
  }
  
  // Check week sequence
  for (let i = 0; i < plan.weeks.length; i++) {
    if (plan.weeks[i].weekNumber !== i + 1) {
      errors.push(`Week ${i + 1} has incorrect week number: ${plan.weeks[i].weekNumber}`);
    }
  }
  
  // Check daily structure
  plan.weeks.forEach((week, weekIndex) => {
    if (week.days.length !== 7) {
      errors.push(`Week ${weekIndex + 1} must have 7 days, but has ${week.days.length}`);
    }
    
    // Check for correct rest day count
    const restDayCount = week.days.filter(day => day.isRestDay).length;
    const expectedRestDays = 7 - plan.configuration.trainingDaysPerWeek;
    if (restDayCount !== expectedRestDays) {
      errors.push(`Week ${weekIndex + 1} has ${restDayCount} rest days, expected ${expectedRestDays}`);
    }
  });
  
  return errors;
}

/**
 * Creates a deep copy of a training plan
 */
export function clonePlan(plan: TrainingPlan): TrainingPlan {
  return JSON.parse(JSON.stringify(plan));
}

/**
 * Compares two training plans and identifies differences
 */
export function comparePlans(
  originalPlan: TrainingPlan,
  modifiedPlan: TrainingPlan
): PlanComparison {
  const changes: PlanChange[] = [];
  
  // Compare configurations
  const configChanges = compareConfigurations(
    originalPlan.configuration,
    modifiedPlan.configuration
  );
  changes.push(...configChanges);
  
  // Compare weeks (simplified comparison)
  const weekChanges = compareWeeks(originalPlan.weeks, modifiedPlan.weeks);
  changes.push(...weekChanges);
  
  // Generate impact assessment
  const impactAssessment = generateImpactAssessment(changes);
  
  return {
    originalPlan,
    modifiedPlan,
    changes,
    impactAssessment
  };
}

/**
 * Compares two configurations
 */
function compareConfigurations(
  original: PlanConfiguration,
  modified: PlanConfiguration
): PlanChange[] {
  const changes: PlanChange[] = [];
  
  (Object.keys(original) as Array<keyof PlanConfiguration>).forEach(key => {
    if (JSON.stringify(original[key]) !== JSON.stringify(modified[key])) {
      changes.push({
        type: 'configuration',
        field: key,
        oldValue: original[key],
        newValue: modified[key],
        impact: determineConfigurationChangeImpact(key),
        description: `Changed ${key} from ${original[key]} to ${modified[key]}`
      });
    }
  });
  
  return changes;
}

/**
 * Compares two week arrays (simplified)
 */
function compareWeeks(originalWeeks: WeeklyPlan[], modifiedWeeks: WeeklyPlan[]): PlanChange[] {
  const changes: PlanChange[] = [];
  
  // This is a simplified comparison - in practice, you'd want more detailed comparison
  if (originalWeeks.length !== modifiedWeeks.length) {
    changes.push({
      type: 'schedule',
      field: 'weekCount',
      oldValue: originalWeeks.length,
      newValue: modifiedWeeks.length,
      impact: 'high',
      description: `Changed program length from ${originalWeeks.length} to ${modifiedWeeks.length} weeks`
    });
  }
  
  return changes;
}

/**
 * Determines the impact level of a configuration change
 */
function determineConfigurationChangeImpact(field: keyof PlanConfiguration): 'low' | 'medium' | 'high' {
  const highImpactFields: Array<keyof PlanConfiguration> = ['raceDistance', 'programLength', 'trainingDaysPerWeek'];
  const mediumImpactFields: Array<keyof PlanConfiguration> = ['restDays', 'longRunDay', 'deloadFrequency'];
  
  if (highImpactFields.includes(field)) return 'high';
  if (mediumImpactFields.includes(field)) return 'medium';
  return 'low';
}

/**
 * Generates impact assessment from changes
 */
function generateImpactAssessment(changes: PlanChange[]): string[] {
  const assessments: string[] = [];
  
  const highImpactChanges = changes.filter(change => change.impact === 'high');
  const mediumImpactChanges = changes.filter(change => change.impact === 'medium');
  
  if (highImpactChanges.length > 0) {
    assessments.push(`${highImpactChanges.length} high-impact changes detected. Plan regeneration recommended.`);
  }
  
  if (mediumImpactChanges.length > 0) {
    assessments.push(`${mediumImpactChanges.length} medium-impact changes detected. Review workout distribution.`);
  }
  
  if (changes.length === 0) {
    assessments.push('No significant changes detected.');
  }
  
  return assessments;
}
