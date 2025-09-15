import type { RaceDistance, DayOfWeek, PlanConfiguration } from '@/types/configuration';
import type { WorkoutType, DailyWorkout, TrainingPhase } from '@/types/workout';
import { MVP_WORKOUT_TYPES } from '@/constants/workoutTypes';
import { usePhasePeriodization } from './usePhasePeriodization';

/**
 * Basic workout distribution algorithm for MVP
 * Creates simple workout distribution templates for 3-7 training days per week
 * Implements basic logic with mostly easy runs, one long run, and one quality workout per week
 * All distance calculations use metric units (kilometers)
 */

export interface WorkoutDistributionTemplate {
  trainingDays: number;
  workoutPattern: WorkoutType[];
  description: string;
  restDayPattern: number[]; // indices of rest days (0-6, where 0 = Monday)
}

export interface WeeklyWorkoutDistribution {
  totalWorkouts: number;
  workoutCounts: {
    easy: number;
    long: number;
    quality: number;
    rest: number;
  };
  dailyWorkouts: DailyWorkout[];
}

export interface RaceDistanceScaling {
  raceDistance: RaceDistance;
  baseDistanceMultiplier: number;
  longRunMultiplier: number;
  qualityDistanceMultiplier: number;
  weeklyVolumeBase: number; // kilometers
}

/**
 * Workout distribution templates for different training frequencies
 * Each template defines the pattern of workouts across a week
 */
const WORKOUT_DISTRIBUTION_TEMPLATES: Record<number, WorkoutDistributionTemplate> = {
  3: {
    trainingDays: 3,
    workoutPattern: ['easy', 'quality', 'long'],
    description: '3 days: Easy run, Quality workout, Long run',
    restDayPattern: [0, 2, 3, 5] // Monday, Wednesday, Thursday, Saturday
  },
  4: {
    trainingDays: 4,
    workoutPattern: ['easy', 'quality', 'easy', 'long'],
    description: '4 days: Easy, Quality, Easy, Long run',
    restDayPattern: [0, 2, 4] // Monday, Wednesday, Friday
  },
  5: {
    trainingDays: 5,
    workoutPattern: ['easy', 'quality', 'easy', 'easy', 'long'],
    description: '5 days: Mostly easy runs with one quality and one long run',
    restDayPattern: [0, 3] // Monday, Thursday
  },
  6: {
    trainingDays: 6,
    workoutPattern: ['easy', 'quality', 'easy', 'easy', 'easy', 'long'],
    description: '6 days: Mostly easy runs with one quality and one long run',
    restDayPattern: [3] // Thursday
  },
  7: {
    trainingDays: 7,
    workoutPattern: ['easy', 'quality', 'easy', 'easy', 'easy', 'easy', 'long'],
    description: '7 days: Daily running with mostly easy runs',
    restDayPattern: [] // No rest days
  }
};

/**
 * Race distance specific scaling factors for workout distances (in kilometers)
 * All calculations use metric units as the base measurement system
 */
const RACE_DISTANCE_SCALING: Record<RaceDistance, RaceDistanceScaling> = {
  '5K': {
    raceDistance: '5K',
    baseDistanceMultiplier: 1.0,
    longRunMultiplier: 2.0, // Long runs 2x base distance
    qualityDistanceMultiplier: 0.8, // Quality workouts slightly shorter
    weeklyVolumeBase: 25 // Base weekly volume in kilometers
  },
  '10K': {
    raceDistance: '10K',
    baseDistanceMultiplier: 1.2,
    longRunMultiplier: 2.2,
    qualityDistanceMultiplier: 1.0,
    weeklyVolumeBase: 35
  },
  'Half Marathon': {
    raceDistance: 'Half Marathon',
    baseDistanceMultiplier: 1.5,
    longRunMultiplier: 2.5,
    qualityDistanceMultiplier: 1.2,
    weeklyVolumeBase: 45
  },
  'Marathon': {
    raceDistance: 'Marathon',
    baseDistanceMultiplier: 2.0,
    longRunMultiplier: 3.0,
    qualityDistanceMultiplier: 1.5,
    weeklyVolumeBase: 60
  }
};

/**
 * Days of the week mapping for array indices
 */
const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function useWorkoutDistribution() {
  const { getPhaseCharacteristics } = usePhasePeriodization();
  /**
   * Gets the workout distribution template for a given number of training days
   */
  function getDistributionTemplate(trainingDaysPerWeek: number): WorkoutDistributionTemplate {
    if (trainingDaysPerWeek < 3 || trainingDaysPerWeek > 7) {
      throw new Error(`Invalid training days per week: ${trainingDaysPerWeek}. Must be between 3-7.`);
    }
    
    return WORKOUT_DISTRIBUTION_TEMPLATES[trainingDaysPerWeek];
  }

  /**
   * Gets race distance scaling factors
   */
  function getRaceDistanceScaling(raceDistance: RaceDistance): RaceDistanceScaling {
    return RACE_DISTANCE_SCALING[raceDistance];
  }

  /**
   * Calculates base workout distances based on race distance and weekly volume (in kilometers)
   */
  function calculateWorkoutDistances(
    raceDistance: RaceDistance,
    weeklyVolumeKm: number,
    trainingDaysPerWeek: number
  ): Record<WorkoutType, number> {
    const scaling = getRaceDistanceScaling(raceDistance);
    const template = getDistributionTemplate(trainingDaysPerWeek);
    
    // Calculate base distance per workout
    const baseDistance = weeklyVolumeKm / trainingDaysPerWeek;
    
    // Apply race-specific scaling
    const distances: Record<WorkoutType, number> = {
      easy: Math.round(baseDistance * scaling.baseDistanceMultiplier * 10) / 10, // Round to 1 decimal
      long: Math.round(baseDistance * scaling.longRunMultiplier * 10) / 10,
      quality: Math.round(baseDistance * scaling.qualityDistanceMultiplier * 10) / 10,
      rest: 0
    };

    // Ensure minimum distances (in kilometers)
    distances.easy = Math.max(distances.easy, 3.0); // Minimum 3km easy run
    distances.long = Math.max(distances.long, 8.0); // Minimum 8km long run
    distances.quality = Math.max(distances.quality, 4.0); // Minimum 4km quality workout

    return distances;
  }

  /**
   * Creates a weekly workout distribution based on configuration
   */
  function createWeeklyDistribution(
    config: PlanConfiguration,
    weeklyVolumeKm: number,
    phase: TrainingPhase = 'base'
  ): WeeklyWorkoutDistribution {
    const template = getDistributionTemplate(config.trainingDaysPerWeek);
    const workoutDistances = calculateWorkoutDistances(
      config.raceDistance,
      weeklyVolumeKm,
      config.trainingDaysPerWeek
    );

    // Create daily workout schedule
    const dailyWorkouts: DailyWorkout[] = [];
    
    // Initialize all days as rest days
    for (let i = 0; i < 7; i++) {
      dailyWorkouts.push({
        dayOfWeek: DAYS_OF_WEEK[i],
        isRestDay: true
      });
    }

    // Place workouts according to user preferences and template
    const workoutSchedule = scheduleWorkouts(template, config, workoutDistances, phase);
    
    // Apply the scheduled workouts
    workoutSchedule.forEach((scheduledWorkout, dayIndex) => {
      if (scheduledWorkout) {
        dailyWorkouts[dayIndex] = {
          dayOfWeek: DAYS_OF_WEEK[dayIndex],
          isRestDay: false,
          workout: scheduledWorkout
        };
      }
    });

    // Count workout types
    const workoutCounts = {
      easy: 0,
      long: 0,
      quality: 0,
      rest: 0
    };

    dailyWorkouts.forEach(day => {
      if (day.isRestDay) {
        workoutCounts.rest++;
      } else if (day.workout) {
        workoutCounts[day.workout.type]++;
      }
    });

    return {
      totalWorkouts: config.trainingDaysPerWeek,
      workoutCounts,
      dailyWorkouts
    };
  }

  /**
   * Schedules workouts across the week based on user preferences
   */
  function scheduleWorkouts(
    template: WorkoutDistributionTemplate,
    config: PlanConfiguration,
    workoutDistances: Record<WorkoutType, number>,
    phase: TrainingPhase
  ): (any | null)[] {
    const schedule: (any | null)[] = new Array(7).fill(null);
    
    // First, place the long run on the specified day
    const longRunDayIndex = DAYS_OF_WEEK.indexOf(config.longRunDay);
    if (longRunDayIndex !== -1) {
      schedule[longRunDayIndex] = createWorkout('long', workoutDistances.long, phase);
    }

    // Get available training days (excluding rest days and long run day)
    const availableDays = DAYS_OF_WEEK
      .map((day, index) => ({ day, index }))
      .filter(({ day, index }) => 
        !config.restDays.includes(day) && 
        index !== longRunDayIndex
      )
      .map(({ index }) => index);

    // Place remaining workouts from template (excluding the long run)
    const remainingWorkouts = template.workoutPattern.filter(workout => workout !== 'long');
    
    for (let i = 0; i < remainingWorkouts.length && i < availableDays.length; i++) {
      const workoutType = remainingWorkouts[i];
      const dayIndex = availableDays[i];
      
      schedule[dayIndex] = createWorkout(workoutType, workoutDistances[workoutType], phase);
    }

    return schedule;
  }

  /**
   * Creates a workout object with appropriate properties
   */
  function createWorkout(type: WorkoutType, distance: number, phase: TrainingPhase) {
    const workoutDef = MVP_WORKOUT_TYPES[type];
    
    // Calculate duration based on distance and typical paces (in minutes)
    const duration = calculateWorkoutDuration(type, distance);
    
    return {
      type,
      duration,
      distance,
      intensity: workoutDef.intensity,
      description: getWorkoutDescription(type, distance, phase),
      paceGuidance: getWorkoutPaceGuidance(type, phase),
      recoveryTime: workoutDef.recoveryHours
    };
  }

  /**
   * Calculates workout duration based on type and distance
   */
  function calculateWorkoutDuration(type: WorkoutType, distance: number): number {
    // Typical pace assumptions for duration calculation (minutes per km)
    const typicalPaces = {
      easy: 6.0,    // 6 min/km for easy runs
      long: 6.5,    // 6.5 min/km for long runs (slightly slower)
      quality: 5.0, // 5 min/km for quality workouts
      rest: 0
    };

    return Math.round(distance * typicalPaces[type]);
  }

  /**
   * Gets workout description based on type, distance, and phase
   */
  function getWorkoutDescription(type: WorkoutType, distance: number, phase: TrainingPhase): string {
    const distanceStr = `${distance} km`;
    
    switch (type) {
      case 'easy':
        return `Easy run - ${distanceStr} at conversational pace`;
      case 'long':
        return `Long run - ${distanceStr} at steady, comfortable effort`;
      case 'quality':
        return getQualityWorkoutDescription(distance, phase);
      case 'rest':
        return 'Rest day - complete rest or light cross-training';
      default:
        return `${type} workout - ${distanceStr}`;
    }
  }

  /**
   * Gets quality workout description based on training phase
   */
  function getQualityWorkoutDescription(distance: number, phase: TrainingPhase): string {
    const distanceStr = `${distance} km`;
    const phaseChar = getPhaseCharacteristics(phase);
    
    switch (phase) {
      case 'base':
        return `Tempo run - ${distanceStr} at comfortably hard pace (${phaseChar.primaryAdaptations[0]})`;
      case 'build':
        return `Interval workout - ${distanceStr} total with speed intervals (${phaseChar.primaryAdaptations[0]})`;
      case 'peak':
        return `Race pace workout - ${distanceStr} at goal race pace (${phaseChar.primaryAdaptations[0]})`;
      case 'taper':
        return `Sharpening workout - ${distanceStr} with short, fast intervals (${phaseChar.primaryAdaptations[0]})`;
      default:
        return `Quality workout - ${distanceStr} at moderate to hard effort`;
    }
  }

  /**
   * Gets pace guidance for workout type and phase
   */
  function getWorkoutPaceGuidance(type: WorkoutType, phase: TrainingPhase): string {
    switch (type) {
      case 'easy':
        return 'Conversational pace - you should be able to speak in full sentences';
      case 'long':
        return 'Steady effort - start easy and can build to moderate effort in later miles';
      case 'quality':
        return getQualityPaceGuidance(phase);
      case 'rest':
        return 'Complete rest or very light activity';
      default:
        return 'Follow prescribed effort level';
    }
  }

  /**
   * Gets quality workout pace guidance based on phase
   */
  function getQualityPaceGuidance(phase: TrainingPhase): string {
    const phaseChar = getPhaseCharacteristics(phase);
    
    switch (phase) {
      case 'base':
        return `Comfortably hard - sustainable for 20-40 minutes (Focus: ${phaseChar.keyMetrics[0]})`;
      case 'build':
        return `Hard effort - 5K to 10K race pace with recovery intervals (Focus: ${phaseChar.keyMetrics[0]})`;
      case 'peak':
        return `Goal race pace - practice your target race effort (Focus: ${phaseChar.keyMetrics[0]})`;
      case 'taper':
        return `Short, sharp efforts - faster than race pace but brief (Focus: ${phaseChar.keyMetrics[0]})`;
      default:
        return 'Moderate to hard effort as prescribed';
    }
  }

  /**
   * Validates workout distribution for safety and effectiveness
   */
  function validateWorkoutDistribution(distribution: WeeklyWorkoutDistribution): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let isValid = true;

    // Check for minimum training frequency
    if (distribution.totalWorkouts < 3) {
      warnings.push('Less than 3 training days per week may limit training effectiveness');
      isValid = false;
    }

    // Check for adequate easy running (80/20 rule approximation)
    const easyRunRatio = distribution.workoutCounts.easy / distribution.totalWorkouts;
    if (easyRunRatio < 0.6) { // At least 60% easy runs for MVP
      warnings.push('Consider more easy runs to follow the 80/20 training principle');
    }

    // Check for quality workout frequency
    if (distribution.workoutCounts.quality > 2) {
      warnings.push('More than 2 quality workouts per week may increase injury risk');
      recommendations.push('Limit quality workouts to 1-2 per week for optimal recovery');
    }

    // Check for long run inclusion
    if (distribution.workoutCounts.long === 0) {
      warnings.push('No long run scheduled - important for endurance development');
      isValid = false;
    }

    // Check for rest days
    if (distribution.workoutCounts.rest === 0) {
      warnings.push('No rest days scheduled - recovery is essential for adaptation');
      recommendations.push('Include at least 1 rest day per week');
    }

    return {
      isValid,
      warnings,
      recommendations
    };
  }

  /**
   * Gets all available distribution templates
   */
  function getAvailableTemplates(): WorkoutDistributionTemplate[] {
    return Object.values(WORKOUT_DISTRIBUTION_TEMPLATES);
  }

  /**
   * Gets race distance scaling information
   */
  function getAllRaceDistanceScaling(): Record<RaceDistance, RaceDistanceScaling> {
    return RACE_DISTANCE_SCALING;
  }

  /**
   * Gets phase-specific workout recommendations
   */
  function getPhaseWorkoutRecommendations(phase: TrainingPhase): {
    emphasis: string[];
    workoutTypes: string[];
    intensityGuidance: string;
    volumeGuidance: string;
  } {
    const phaseChar = getPhaseCharacteristics(phase);
    
    return {
      emphasis: phaseChar.primaryAdaptations,
      workoutTypes: phaseChar.workoutTypes,
      intensityGuidance: `${phaseChar.intensityEmphasis} intensity emphasis`,
      volumeGuidance: `${phaseChar.volumeEmphasis} volume emphasis`
    };
  }

  /**
   * Adjusts workout distribution based on training phase characteristics
   */
  function adjustDistributionForPhase(
    baseDistribution: WeeklyWorkoutDistribution,
    phase: TrainingPhase
  ): WeeklyWorkoutDistribution {
    const phaseChar = getPhaseCharacteristics(phase);
    
    // Create adjusted distribution based on phase characteristics
    const adjustedDistribution = { ...baseDistribution };
    
    // Update workout descriptions to include phase-specific information
    adjustedDistribution.dailyWorkouts = baseDistribution.dailyWorkouts.map(day => {
      if (!day.isRestDay && day.workout) {
        const updatedWorkout = { ...day.workout };
        
        // Add phase-specific notes to workout description
        if (updatedWorkout.type === 'quality') {
          updatedWorkout.description = getQualityWorkoutDescription(
            updatedWorkout.distance || 0, 
            phase
          );
          updatedWorkout.paceGuidance = getQualityPaceGuidance(phase);
        }
        
        return {
          ...day,
          workout: updatedWorkout,
          notes: `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase: ${phaseChar.primaryAdaptations[0]}`
        };
      }
      return day;
    });
    
    return adjustedDistribution;
  }

  return {
    getDistributionTemplate,
    getRaceDistanceScaling,
    calculateWorkoutDistances,
    createWeeklyDistribution,
    validateWorkoutDistribution,
    getAvailableTemplates,
    getAllRaceDistanceScaling,
    getPhaseWorkoutRecommendations,
    adjustDistributionForPhase,
    WORKOUT_DISTRIBUTION_TEMPLATES,
    RACE_DISTANCE_SCALING
  };
}
