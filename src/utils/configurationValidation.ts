import type {
  PlanConfiguration,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  RaceDistance,
  DayOfWeek
} from '@/types/configuration';
import { CONFIGURATION_CONSTRAINTS, DAYS_OF_WEEK } from '@/types/configuration';

/**
 * Validates a complete plan configuration
 */
export function validatePlanConfiguration(config: PlanConfiguration): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate race distance
  const raceDistanceValidation = validateRaceDistance(config.raceDistance);
  errors.push(...raceDistanceValidation.errors);
  warnings.push(...raceDistanceValidation.warnings);

  // Validate program length
  const programLengthValidation = validateProgramLength(config.programLength, config.raceDistance);
  errors.push(...programLengthValidation.errors);
  warnings.push(...programLengthValidation.warnings);

  // Validate training days per week
  const trainingDaysValidation = validateTrainingDaysPerWeek(config.trainingDaysPerWeek);
  errors.push(...trainingDaysValidation.errors);
  warnings.push(...trainingDaysValidation.warnings);

  // Validate rest days
  const restDaysValidation = validateRestDays(config.restDays, config.trainingDaysPerWeek);
  errors.push(...restDaysValidation.errors);
  warnings.push(...restDaysValidation.warnings);

  // Validate long run day
  const longRunDayValidation = validateLongRunDay(config.longRunDay, config.restDays);
  errors.push(...longRunDayValidation.errors);
  warnings.push(...longRunDayValidation.warnings);

  // Validate deload frequency
  const deloadFrequencyValidation = validateDeloadFrequency(config.deloadFrequency, config.programLength);
  errors.push(...deloadFrequencyValidation.errors);
  warnings.push(...deloadFrequencyValidation.warnings);

  // Cross-validation checks
  const crossValidation = performCrossValidation(config);
  errors.push(...crossValidation.errors);
  warnings.push(...crossValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates race distance selection
 */
export function validateRaceDistance(raceDistance: RaceDistance): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const validDistances: RaceDistance[] = ['5K', '10K', 'Half Marathon', 'Marathon'];
  
  if (!validDistances.includes(raceDistance)) {
    errors.push({
      field: 'raceDistance',
      message: 'Invalid race distance. Must be 5K, 10K, Half Marathon, or Marathon.',
      code: 'INVALID_RACE_DISTANCE'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates program length based on race distance
 */
export function validateProgramLength(programLength: number, raceDistance: RaceDistance): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const constraints = CONFIGURATION_CONSTRAINTS.programLength;

  // Check absolute bounds
  if (programLength < constraints.min) {
    errors.push({
      field: 'programLength',
      message: `Program length must be at least ${constraints.min} weeks.`,
      code: 'PROGRAM_TOO_SHORT'
    });
  }

  if (programLength > constraints.max) {
    errors.push({
      field: 'programLength',
      message: `Program length cannot exceed ${constraints.max} weeks.`,
      code: 'PROGRAM_TOO_LONG'
    });
  }

  // Check race-specific recommendations
  const raceConstraints = constraints.recommended[raceDistance];
  if (programLength < raceConstraints.min) {
    if (programLength >= constraints.min) {
      warnings.push({
        field: 'programLength',
        message: `For ${raceDistance}, we recommend at least ${raceConstraints.min} weeks for optimal preparation.`,
        code: 'SUBOPTIMAL_PROGRAM_LENGTH',
        severity: 'medium'
      });
    }
  }

  // Provide optimal length guidance
  if (programLength !== raceConstraints.optimal) {
    warnings.push({
      field: 'programLength',
      message: `For ${raceDistance}, the optimal program length is ${raceConstraints.optimal} weeks.`,
      code: 'NON_OPTIMAL_LENGTH',
      severity: 'low'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates training days per week
 */
export function validateTrainingDaysPerWeek(trainingDaysPerWeek: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const constraints = CONFIGURATION_CONSTRAINTS.trainingDays;

  if (trainingDaysPerWeek < constraints.min) {
    errors.push({
      field: 'trainingDaysPerWeek',
      message: `Training days per week must be at least ${constraints.min}.`,
      code: 'TOO_FEW_TRAINING_DAYS'
    });
  }

  if (trainingDaysPerWeek > constraints.max) {
    errors.push({
      field: 'trainingDaysPerWeek',
      message: `Training days per week cannot exceed ${constraints.max}.`,
      code: 'TOO_MANY_TRAINING_DAYS'
    });
  }

  // Warn about suboptimal training frequency
  if (trainingDaysPerWeek === 3) {
    warnings.push({
      field: 'trainingDaysPerWeek',
      message: 'Training only 3 days per week may limit your progress. Consider 4-5 days for better results.',
      code: 'LIMITED_TRAINING_FREQUENCY',
      severity: 'medium'
    });
  }

  if (trainingDaysPerWeek >= 6) {
    warnings.push({
      field: 'trainingDaysPerWeek',
      message: 'Training 6+ days per week increases injury risk. Ensure adequate recovery.',
      code: 'HIGH_TRAINING_FREQUENCY',
      severity: 'high'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates rest days configuration
 */
export function validateRestDays(restDays: DayOfWeek[], trainingDaysPerWeek: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const constraints = CONFIGURATION_CONSTRAINTS.restDays;
  const expectedRestDays = 7 - trainingDaysPerWeek;

  // Check if rest days array length matches expected
  if (restDays.length !== expectedRestDays) {
    errors.push({
      field: 'restDays',
      message: `Expected ${expectedRestDays} rest days for ${trainingDaysPerWeek} training days per week, but got ${restDays.length}.`,
      code: 'INCORRECT_REST_DAYS_COUNT'
    });
  }

  // Check for valid day names
  const invalidDays = restDays.filter(day => !DAYS_OF_WEEK.includes(day));
  if (invalidDays.length > 0) {
    errors.push({
      field: 'restDays',
      message: `Invalid day names: ${invalidDays.join(', ')}. Must be valid day names.`,
      code: 'INVALID_DAY_NAMES'
    });
  }

  // Check for duplicate days
  const uniqueDays = new Set(restDays);
  if (uniqueDays.size !== restDays.length) {
    errors.push({
      field: 'restDays',
      message: 'Rest days cannot contain duplicates.',
      code: 'DUPLICATE_REST_DAYS'
    });
  }

  // Check for consecutive rest days (warning)
  if (hasConsecutiveRestDays(restDays)) {
    warnings.push({
      field: 'restDays',
      message: 'Consecutive rest days may disrupt training rhythm. Consider spreading them out.',
      code: 'CONSECUTIVE_REST_DAYS',
      severity: 'medium'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates long run day selection
 */
export function validateLongRunDay(longRunDay: DayOfWeek, restDays: DayOfWeek[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check if long run day is valid
  if (!DAYS_OF_WEEK.includes(longRunDay)) {
    errors.push({
      field: 'longRunDay',
      message: 'Invalid long run day. Must be a valid day of the week.',
      code: 'INVALID_LONG_RUN_DAY'
    });
  }

  // Check if long run day conflicts with rest days
  if (restDays.includes(longRunDay)) {
    errors.push({
      field: 'longRunDay',
      message: 'Long run day cannot be a rest day.',
      code: 'LONG_RUN_ON_REST_DAY'
    });
  }

  // Recommend weekend for long runs
  if (!['Saturday', 'Sunday'].includes(longRunDay)) {
    warnings.push({
      field: 'longRunDay',
      message: 'Long runs are typically scheduled on weekends for better recovery.',
      code: 'NON_WEEKEND_LONG_RUN',
      severity: 'low'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates deload frequency
 */
export function validateDeloadFrequency(deloadFrequency: 3 | 4, programLength: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check valid values
  if (![3, 4].includes(deloadFrequency)) {
    errors.push({
      field: 'deloadFrequency',
      message: 'Deload frequency must be either 3 or 4 weeks.',
      code: 'INVALID_DELOAD_FREQUENCY'
    });
  }

  // Check if program is long enough for deload weeks
  const minWeeksForDeload = deloadFrequency + 2; // At least one deload cycle plus buffer
  if (programLength < minWeeksForDeload) {
    warnings.push({
      field: 'deloadFrequency',
      message: `Program may be too short for effective deload scheduling with ${deloadFrequency}-week frequency.`,
      code: 'SHORT_PROGRAM_DELOAD',
      severity: 'low'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Performs cross-validation checks between different configuration parameters
 */
function performCrossValidation(config: PlanConfiguration): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check if marathon training with very short program
  if (config.raceDistance === 'Marathon' && config.programLength < 12) {
    warnings.push({
      field: 'programLength',
      message: 'Marathon training with less than 12 weeks significantly increases injury risk.',
      code: 'RISKY_MARATHON_PREPARATION',
      severity: 'high'
    });
  }

  // Check if high training frequency with short program
  if (config.trainingDaysPerWeek >= 6 && config.programLength < 8) {
    warnings.push({
      field: 'trainingDaysPerWeek',
      message: 'High training frequency with short program duration may lead to overtraining.',
      code: 'HIGH_INTENSITY_SHORT_PROGRAM',
      severity: 'high'
    });
  }

  // Check if 5K with very long program
  if (config.raceDistance === '5K' && config.programLength > 16) {
    warnings.push({
      field: 'programLength',
      message: '5K training programs longer than 16 weeks may lead to staleness.',
      code: 'EXCESSIVE_5K_PROGRAM',
      severity: 'medium'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Helper function to check for consecutive rest days
 */
function hasConsecutiveRestDays(restDays: DayOfWeek[]): boolean {
  const dayIndices = restDays.map(day => DAYS_OF_WEEK.indexOf(day)).sort((a, b) => a - b);
  
  for (let i = 0; i < dayIndices.length - 1; i++) {
    if (dayIndices[i + 1] - dayIndices[i] === 1) {
      return true;
    }
  }
  
  // Check wrap-around (Sunday to Monday)
  if (dayIndices.includes(0) && dayIndices.includes(6)) {
    return true;
  }
  
  return false;
}

/**
 * Creates a default configuration for a given race distance
 */
export function createDefaultConfiguration(raceDistance: RaceDistance): PlanConfiguration {
  const constraints = CONFIGURATION_CONSTRAINTS.programLength.recommended[raceDistance];
  
  return {
    raceDistance,
    programLength: constraints.optimal,
    trainingDaysPerWeek: 4,
    restDays: ['Monday', 'Wednesday', 'Friday'],
    longRunDay: 'Sunday',
    deloadFrequency: 4
  };
}

/**
 * Suggests optimal configuration adjustments
 */
export function suggestConfigurationImprovements(config: PlanConfiguration): string[] {
  const suggestions: string[] = [];
  const validation = validatePlanConfiguration(config);
  
  // Convert high-severity warnings to suggestions
  validation.warnings
    .filter(warning => warning.severity === 'high')
    .forEach(warning => {
      suggestions.push(warning.message);
    });
  
  // Add specific improvement suggestions
  if (config.trainingDaysPerWeek === 3) {
    suggestions.push('Consider increasing to 4-5 training days per week for better fitness gains.');
  }
  
  if (!['Saturday', 'Sunday'].includes(config.longRunDay)) {
    suggestions.push('Schedule long runs on weekends for better recovery and time availability.');
  }
  
  const raceConstraints = CONFIGURATION_CONSTRAINTS.programLength.recommended[config.raceDistance];
  if (config.programLength < raceConstraints.optimal) {
    suggestions.push(`Consider extending to ${raceConstraints.optimal} weeks for optimal ${config.raceDistance} preparation.`);
  }
  
  return suggestions;
}
