import type { RaceDistance } from '@/types/configuration';
import { RACE_DISTANCES } from '@/constants/raceDistances';

/**
 * Base building and progressive overload logic for training plans
 * Implements key running science principles:
 * - Maximum 10% weekly volume increase
 * - Race distance-specific starting volumes
 * - Deload week volume reduction (20-30%)
 * - Safety caps to prevent overtraining
 */

export interface ProgressionConfig {
  raceDistance: RaceDistance;
  programLength: number;
  trainingDaysPerWeek: number;
  deloadFrequency: 3 | 4;
  userExperience?: 'beginner' | 'intermediate' | 'advanced';
}

export interface WeeklyVolumeCalculation {
  weekNumber: number;
  baseVolume: number;
  adjustedVolume: number;
  isDeloadWeek: boolean;
  progressionRate: number;
  notes: string[];
}

export interface ProgressionValidation {
  isValid: boolean;
  warnings: string[];
  adjustments: string[];
}

/**
 * Base weekly distance recommendations by race distance and experience level (in kilometers)
 * Based on established training principles and safe progression rates
 * Note: All distances are in kilometers (metric system)
 */
const BASE_WEEKLY_DISTANCE = {
  '5K': {
    beginner: 24,    // ~15 miles converted to km
    intermediate: 32, // ~20 miles converted to km
    advanced: 40     // ~25 miles converted to km
  },
  '10K': {
    beginner: 32,    // ~20 miles converted to km
    intermediate: 40, // ~25 miles converted to km
    advanced: 48     // ~30 miles converted to km
  },
  'Half Marathon': {
    beginner: 40,    // ~25 miles converted to km
    intermediate: 48, // ~30 miles converted to km
    advanced: 64     // ~40 miles converted to km
  },
  'Marathon': {
    beginner: 48,    // ~30 miles converted to km
    intermediate: 64, // ~40 miles converted to km
    advanced: 80     // ~50 miles converted to km
  }
} as const;

/**
 * Maximum weekly distance caps by race distance to prevent overtraining (in kilometers)
 * Note: All distances are in kilometers (metric system)
 */
const MAX_WEEKLY_DISTANCE = {
  '5K': {
    beginner: 56,    // ~35 miles converted to km
    intermediate: 72, // ~45 miles converted to km
    advanced: 88     // ~55 miles converted to km
  },
  '10K': {
    beginner: 72,    // ~45 miles converted to km
    intermediate: 88, // ~55 miles converted to km
    advanced: 104    // ~65 miles converted to km
  },
  'Half Marathon': {
    beginner: 88,    // ~55 miles converted to km
    intermediate: 104, // ~65 miles converted to km
    advanced: 128    // ~80 miles converted to km
  },
  'Marathon': {
    beginner: 104,   // ~65 miles converted to km
    intermediate: 128, // ~80 miles converted to km
    advanced: 160    // ~100 miles converted to km
  }
} as const;

/**
 * Progressive overload constants
 */
const PROGRESSION_CONSTANTS = {
  MAX_WEEKLY_INCREASE: 0.10, // 10% maximum weekly increase
  SAFE_WEEKLY_INCREASE: 0.08, // 8% recommended weekly increase
  DELOAD_REDUCTION_MIN: 0.20, // 20% minimum deload reduction
  DELOAD_REDUCTION_MAX: 0.30, // 30% maximum deload reduction
  AGGRESSIVE_THRESHOLD: 0.12, // 12% increase triggers aggressive warning
  PLATEAU_WEEKS: 2, // Weeks to plateau before continuing progression
};

export function useProgressionRules() {
  /**
   * Calculates starting weekly distance based on race distance and experience (in kilometers)
   */
  function calculateStartingDistance(
    raceDistance: RaceDistance,
    userExperience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): number {
    return BASE_WEEKLY_DISTANCE[raceDistance][userExperience];
  }

  /**
   * Calculates maximum safe weekly distance for the race distance and experience (in kilometers)
   */
  function getMaxWeeklyDistance(
    raceDistance: RaceDistance,
    userExperience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): number {
    return MAX_WEEKLY_DISTANCE[raceDistance][userExperience];
  }

  /**
   * Calculates weekly volume progression with safety caps and deload weeks
   */
  function calculateWeeklyVolumes(config: ProgressionConfig): WeeklyVolumeCalculation[] {
    const { raceDistance, programLength, deloadFrequency, userExperience = 'intermediate' } = config;

    const startingDistance = calculateStartingDistance(raceDistance, userExperience);
    const maxDistance = getMaxWeeklyDistance(raceDistance, userExperience);

    const volumes: WeeklyVolumeCalculation[] = [];
    let currentVolume = startingDistance;
    let consecutiveIncreaseWeeks = 0;

    for (let week = 1; week <= programLength; week++) {
      const isDeloadWeek = isDeloadWeekNumber(week, deloadFrequency);

      if (isDeloadWeek) {
        // Deload week: reduce volume by 20-30%
        const deloadReduction = PROGRESSION_CONSTANTS.DELOAD_REDUCTION_MIN +
          (Math.random() * (PROGRESSION_CONSTANTS.DELOAD_REDUCTION_MAX - PROGRESSION_CONSTANTS.DELOAD_REDUCTION_MIN));

        const deloadVolume = Math.round(currentVolume * (1 - deloadReduction));

        volumes.push({
          weekNumber: week,
          baseVolume: currentVolume,
          adjustedVolume: deloadVolume,
          isDeloadWeek: true,
          progressionRate: -deloadReduction,
          notes: [`Deload week: ${Math.round(deloadReduction * 100)}% volume reduction for recovery`]
        });

        consecutiveIncreaseWeeks = 0; // Reset progression counter
      } else {
        // Regular training week
        let targetVolume = currentVolume;
        const notes: string[] = [];
        let progressionRate = 0;

        if (week > 1 && !volumes[week - 2]?.isDeloadWeek) {
          // Calculate progression from previous non-deload week
          const previousVolume = volumes[week - 2]?.adjustedVolume || currentVolume;

          // Determine progression rate based on consecutive weeks and safety
          let weeklyIncrease = PROGRESSION_CONSTANTS.SAFE_WEEKLY_INCREASE;

          if (consecutiveIncreaseWeeks >= PROGRESSION_CONSTANTS.PLATEAU_WEEKS) {
            // After plateau weeks, allow slightly higher increase
            weeklyIncrease = Math.min(
              PROGRESSION_CONSTANTS.MAX_WEEKLY_INCREASE,
              PROGRESSION_CONSTANTS.SAFE_WEEKLY_INCREASE * 1.2
            );
          }

          targetVolume = previousVolume * (1 + weeklyIncrease);
          progressionRate = weeklyIncrease;

          // Apply safety cap
          if (targetVolume > maxDistance) {
            targetVolume = maxDistance;
            progressionRate = (maxDistance - previousVolume) / previousVolume;
            notes.push(`Volume capped at ${maxDistance} km for safety`);
          }

          // Check for aggressive progression
          if (weeklyIncrease > PROGRESSION_CONSTANTS.AGGRESSIVE_THRESHOLD) {
            notes.push('Aggressive progression detected - monitor for overtraining signs');
          }

          consecutiveIncreaseWeeks++;
        }

        volumes.push({
          weekNumber: week,
          baseVolume: currentVolume,
          adjustedVolume: Math.round(targetVolume),
          isDeloadWeek: false,
          progressionRate,
          notes
        });

        currentVolume = targetVolume;
      }
    }

    return volumes;
  }

  /**
   * Determines if a given week number should be a deload week
   */
  function isDeloadWeekNumber(weekNumber: number, deloadFrequency: 3 | 4): boolean {
    // Deload weeks occur every 3rd or 4th week
    // Week 1 is never a deload week
    if (weekNumber === 1) return false;

    return weekNumber % deloadFrequency === 0;
  }

  /**
   * Calculates deload week volume reduction
   */
  function calculateDeloadVolume(baseVolume: number, reductionPercentage?: number): number {
    const reduction = reductionPercentage ||
      (PROGRESSION_CONSTANTS.DELOAD_REDUCTION_MIN + PROGRESSION_CONSTANTS.DELOAD_REDUCTION_MAX) / 2;

    return Math.round(baseVolume * (1 - reduction));
  }

  /**
   * Validates progression plan for safety and effectiveness
   */
  function validateProgression(volumes: WeeklyVolumeCalculation[]): ProgressionValidation {
    const warnings: string[] = [];
    const adjustments: string[] = [];
    let isValid = true;

    // Check for excessive weekly increases
    for (let i = 1; i < volumes.length; i++) {
      const current = volumes[i];
      const previous = volumes[i - 1];

      if (!current.isDeloadWeek && !previous.isDeloadWeek) {
        const increase = (current.adjustedVolume - previous.adjustedVolume) / previous.adjustedVolume;

        if (increase > PROGRESSION_CONSTANTS.MAX_WEEKLY_INCREASE) {
          warnings.push(
            `Week ${current.weekNumber}: ${Math.round(increase * 100)}% increase exceeds 10% safety limit`
          );
          isValid = false;
        }

        if (increase > PROGRESSION_CONSTANTS.AGGRESSIVE_THRESHOLD) {
          warnings.push(
            `Week ${current.weekNumber}: ${Math.round(increase * 100)}% increase is aggressive - monitor recovery`
          );
        }
      }
    }

    // Check for adequate deload frequency
    const deloadWeeks = volumes.filter(v => v.isDeloadWeek).length;
    const totalWeeks = volumes.length;
    const deloadRatio = deloadWeeks / totalWeeks;

    if (deloadRatio < 0.15) { // Less than 15% deload weeks
      warnings.push('Consider more frequent deload weeks for better recovery');
    }

    // Check for plateau periods
    let plateauWeeks = 0;
    for (let i = 1; i < volumes.length; i++) {
      const current = volumes[i];
      const previous = volumes[i - 1];

      if (!current.isDeloadWeek && !previous.isDeloadWeek) {
        if (Math.abs(current.adjustedVolume - previous.adjustedVolume) < 1) {
          plateauWeeks++;
        }
      }
    }

    if (plateauWeeks > totalWeeks * 0.3) {
      adjustments.push('Consider more progressive volume increases for continued adaptation');
    }

    return {
      isValid,
      warnings,
      adjustments
    };
  }

  /**
   * Adjusts progression for aggressive attempts
   */
  function adjustAggressiveProgression(
    targetVolume: number,
    previousVolume: number,
    maxSafeVolume: number
  ): { adjustedVolume: number; notes: string[] } {
    const notes: string[] = [];
    let adjustedVolume = targetVolume;

    const proposedIncrease = (targetVolume - previousVolume) / previousVolume;

    if (proposedIncrease > PROGRESSION_CONSTANTS.MAX_WEEKLY_INCREASE) {
      // Cap at maximum safe increase
      adjustedVolume = previousVolume * (1 + PROGRESSION_CONSTANTS.MAX_WEEKLY_INCREASE);
      notes.push(
        `Progression capped at ${Math.round(PROGRESSION_CONSTANTS.MAX_WEEKLY_INCREASE * 100)}% for injury prevention`
      );
    }

    if (adjustedVolume > maxSafeVolume) {
      adjustedVolume = maxSafeVolume;
      notes.push(`Volume capped at ${maxSafeVolume} km maximum for experience level`);
    }

    return { adjustedVolume: Math.round(adjustedVolume), notes };
  }

  /**
   * Gets recommended progression parameters for a race distance
   */
  function getProgressionRecommendations(raceDistance: RaceDistance) {
    const raceInfo = RACE_DISTANCES[raceDistance];

    return {
      minWeeks: raceInfo.minWeeks,
      recommendedWeeks: raceInfo.recommendedWeeks,
      maxWeeks: raceInfo.maxWeeks,
      startingDistance: {
        beginner: BASE_WEEKLY_DISTANCE[raceDistance].beginner,
        intermediate: BASE_WEEKLY_DISTANCE[raceDistance].intermediate,
        advanced: BASE_WEEKLY_DISTANCE[raceDistance].advanced
      },
      maxDistance: {
        beginner: MAX_WEEKLY_DISTANCE[raceDistance].beginner,
        intermediate: MAX_WEEKLY_DISTANCE[raceDistance].intermediate,
        advanced: MAX_WEEKLY_DISTANCE[raceDistance].advanced
      },
      recommendedDeloadFrequency: raceDistance === 'Marathon' ? 3 : 4,
      safeProgressionRate: PROGRESSION_CONSTANTS.SAFE_WEEKLY_INCREASE,
      maxProgressionRate: PROGRESSION_CONSTANTS.MAX_WEEKLY_INCREASE
    };
  }

  return {
    calculateStartingDistance,
    getMaxWeeklyDistance,
    calculateWeeklyVolumes,
    isDeloadWeekNumber,
    calculateDeloadVolume,
    validateProgression,
    adjustAggressiveProgression,
    getProgressionRecommendations,
    PROGRESSION_CONSTANTS
  };
}
