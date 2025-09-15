import type { PlanConfiguration, DayOfWeek } from "@/types/configuration";
import type {
	WorkoutType,
	DailyWorkout,
	TrainingPhase,
	Workout,
} from "@/types/workout";

/**
 * Workout scheduling algorithm that implements:
 * - Quality workout rotation logic (tempo → intervals → hills cycle)
 * - Constraint satisfaction for long run day placement
 * - Distribution of easy and recovery runs across remaining training days
 * - Respect for user's rest day preferences in weekly scheduling
 */

export interface SchedulingConstraints {
	restDays: DayOfWeek[];
	longRunDay: DayOfWeek;
	trainingDaysPerWeek: number;
	minimumRecoveryHours: number; // Between quality workouts
}

export interface QualityWorkoutRotation {
	weekNumber: number;
	qualityType: "tempo" | "threshold" | "intervals" | "hills" | "fartlek";
	description: string;
	nextRotation: "tempo" | "threshold" | "intervals" | "hills" | "fartlek";
}

export interface ScheduledWeek {
	weekNumber: number;
	dailyWorkouts: DailyWorkout[];
	qualityWorkoutRotation: QualityWorkoutRotation;
	schedulingNotes: string[];
	constraintViolations: string[];
}

export interface WorkoutSchedulingResult {
	success: boolean;
	scheduledWeek: ScheduledWeek | null;
	errors: string[];
	warnings: string[];
}

/**
 * Days of the week mapping for array indices and calculations
 */
const DAYS_OF_WEEK: DayOfWeek[] = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

/**
 * Quality workout rotation cycle - follows periodization principles
 * Tempo → Threshold → Intervals → Hills → Fartlek provides balanced development
 */
const QUALITY_WORKOUT_CYCLE: (
	| "tempo"
	| "threshold"
	| "intervals"
	| "hills"
	| "fartlek"
)[] = ["tempo", "threshold", "intervals", "hills", "fartlek"];

/**
 * Quality workout definitions with specific characteristics
 */
const QUALITY_WORKOUT_DEFINITIONS = {
	tempo: {
		name: "Tempo Run",
		description: "Comfortably hard sustained effort",
		intensity: "zone3" as const,
		recoveryHours: 48,
		purpose: "Lactate threshold development",
	},
	threshold: {
		name: "Threshold Intervals",
		description: "Broken lactate threshold efforts with short recoveries",
		intensity: "zone3" as const,
		recoveryHours: 42,
		purpose: "Lactate threshold power and buffering",
	},
	intervals: {
		name: "Interval Training",
		description: "High-intensity intervals with recovery",
		intensity: "zone4" as const,
		recoveryHours: 48,
		purpose: "VO2 max and speed development",
	},
	hills: {
		name: "Hill Repeats",
		description: "Uphill intervals for strength and power",
		intensity: "zone4" as const,
		recoveryHours: 48,
		purpose: "Strength, power, and running economy",
	},
	fartlek: {
		name: "Fartlek Training",
		description: "Unstructured speed play with varied pace",
		intensity: "zone3" as const,
		recoveryHours: 36,
		purpose: "Speed development and mental adaptability",
	},
} as const;

export function useWorkoutScheduling() {
	/**
	 * Determines the quality workout type for a given week using rotation logic
	 */
	function getQualityWorkoutRotation(
		weekNumber: number,
	): QualityWorkoutRotation {
		const cycleIndex = (weekNumber - 1) % QUALITY_WORKOUT_CYCLE.length;
		const currentType = QUALITY_WORKOUT_CYCLE[cycleIndex];
		const nextIndex = (cycleIndex + 1) % QUALITY_WORKOUT_CYCLE.length;
		const nextType = QUALITY_WORKOUT_CYCLE[nextIndex];

		const workoutDef = QUALITY_WORKOUT_DEFINITIONS[currentType];

		return {
			weekNumber,
			qualityType: currentType,
			description: `${workoutDef.name}: ${workoutDef.description} (${workoutDef.purpose})`,
			nextRotation: nextType,
		};
	}

	/**
	 * Creates scheduling constraints from plan configuration
	 */
	function createSchedulingConstraints(
		config: PlanConfiguration,
	): SchedulingConstraints {
		return {
			restDays: config.restDays,
			longRunDay: config.longRunDay,
			trainingDaysPerWeek: config.trainingDaysPerWeek,
			minimumRecoveryHours: 48, // Standard 48-hour recovery between quality workouts
		};
	}

	/**
	 * Validates that scheduling constraints are feasible
	 */
	function validateSchedulingConstraints(constraints: SchedulingConstraints): {
		isValid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check if we have enough training days
		const availableDays = 7 - constraints.restDays.length;
		if (availableDays < constraints.trainingDaysPerWeek) {
			errors.push(
				`Not enough available days: ${availableDays} available, ${constraints.trainingDaysPerWeek} required`,
			);
		}

		// Check if long run day conflicts with rest days
		if (constraints.restDays.includes(constraints.longRunDay)) {
			errors.push(
				`Long run day (${constraints.longRunDay}) conflicts with rest day preference`,
			);
		}

		// Warn about consecutive rest days
		const restDayIndices = constraints.restDays
			.map((day) => DAYS_OF_WEEK.indexOf(day))
			.sort();
		for (let i = 0; i < restDayIndices.length - 1; i++) {
			const current = restDayIndices[i];
			const next = restDayIndices[i + 1];

			// Check for consecutive days (including wrap-around from Sunday to Monday)
			if (next - current === 1 || (current === 0 && next === 6)) {
				warnings.push("Consecutive rest days may disrupt training rhythm");
				break;
			}
		}

		// Warn about very high training frequency
		if (constraints.trainingDaysPerWeek > 6) {
			warnings.push(
				"Training 7 days per week increases injury risk - consider at least one rest day",
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Schedules workouts for a single week based on constraints and workout requirements
	 */
	function scheduleWeeklyWorkouts(
		weekNumber: number,
		constraints: SchedulingConstraints,
		workouts: { type: WorkoutType; workout: Workout }[],
		phase: TrainingPhase = "base",
	): WorkoutSchedulingResult {
		const errors: string[] = [];
		const warnings: string[] = [];
		const schedulingNotes: string[] = [];

		// Validate constraints first
		const constraintValidation = validateSchedulingConstraints(constraints);
		if (!constraintValidation.isValid) {
			return {
				success: false,
				scheduledWeek: null,
				errors: constraintValidation.errors,
				warnings: constraintValidation.warnings,
			};
		}

		// Initialize weekly schedule - all days start as rest days
		const dailyWorkouts: DailyWorkout[] = DAYS_OF_WEEK.map((day) => ({
			dayOfWeek: day,
			isRestDay: constraints.restDays.includes(day),
			workout: undefined,
		}));

		// Get quality workout rotation for this week
		const qualityRotation = getQualityWorkoutRotation(weekNumber);

		try {
			// Step 1: Place long run on specified day
			const longRunDayIndex = DAYS_OF_WEEK.indexOf(constraints.longRunDay);
			const longRunWorkout = workouts.find((w) => w.type === "long");

			if (longRunWorkout && longRunDayIndex !== -1) {
				dailyWorkouts[longRunDayIndex] = {
					dayOfWeek: constraints.longRunDay,
					isRestDay: false,
					workout: longRunWorkout.workout,
				};
				schedulingNotes.push(`Long run scheduled on ${constraints.longRunDay}`);
			}

			// Step 2: Place quality workout with proper recovery spacing
			const qualityWorkout = workouts.find((w) => w.type === "quality");
			if (qualityWorkout) {
				const qualityDayIndex = findOptimalQualityWorkoutDay(
					constraints,
					longRunDayIndex,
					dailyWorkouts,
				);

				if (qualityDayIndex !== -1) {
					// Update quality workout with rotation-specific details
					const enhancedQualityWorkout = enhanceQualityWorkout(
						qualityWorkout.workout,
						qualityRotation.qualityType,
						phase,
					);

					dailyWorkouts[qualityDayIndex] = {
						dayOfWeek: DAYS_OF_WEEK[qualityDayIndex],
						isRestDay: false,
						workout: enhancedQualityWorkout,
					};

					schedulingNotes.push(
						`${qualityRotation.qualityType} workout scheduled on ${DAYS_OF_WEEK[qualityDayIndex]}`,
					);
				} else {
					warnings.push(
						"Could not find optimal day for quality workout with adequate recovery",
					);
				}
			}

			// Step 3: Distribute easy runs across remaining available days
			const easyWorkouts = workouts.filter((w) => w.type === "easy");
			const availableDays = getAvailableTrainingDays(
				dailyWorkouts,
				constraints,
			);

			// Calculate how many more workouts we need to schedule
			const currentlyScheduled = dailyWorkouts.filter(
				(day) => !day.isRestDay && day.workout,
			).length;
			const remainingWorkoutsNeeded =
				constraints.trainingDaysPerWeek - currentlyScheduled;

			distributeEasyWorkouts(
				dailyWorkouts,
				easyWorkouts,
				availableDays,
				schedulingNotes,
				remainingWorkoutsNeeded,
			);

			// Step 4: Validate final schedule
			const constraintViolations = validateFinalSchedule(
				dailyWorkouts,
				constraints,
			);

			const scheduledWeek: ScheduledWeek = {
				weekNumber,
				dailyWorkouts,
				qualityWorkoutRotation: qualityRotation,
				schedulingNotes,
				constraintViolations,
			};

			return {
				success: constraintViolations.length === 0,
				scheduledWeek,
				errors: constraintViolations,
				warnings: [...constraintValidation.warnings, ...warnings],
			};
		} catch (error) {
			errors.push(
				`Scheduling failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			return {
				success: false,
				scheduledWeek: null,
				errors,
				warnings,
			};
		}
	}

	/**
	 * Finds the optimal day for quality workout considering recovery requirements
	 */
	function findOptimalQualityWorkoutDay(
		constraints: SchedulingConstraints,
		longRunDayIndex: number,
		currentSchedule: DailyWorkout[],
	): number {
		const availableDays: number[] = [];

		// Find all available training days (not rest days, not already scheduled)
		for (let i = 0; i < 7; i++) {
			const day = DAYS_OF_WEEK[i];
			if (
				!constraints.restDays.includes(day) &&
				!currentSchedule[i].workout &&
				i !== longRunDayIndex
			) {
				availableDays.push(i);
			}
		}

		if (availableDays.length === 0) {
			return -1; // No available days
		}

		// Prefer days that provide adequate recovery from long run
		// Ideally 48+ hours between quality workout and long run
		const optimalDays = availableDays.filter((dayIndex) => {
			const daysBetween = calculateDaysBetween(dayIndex, longRunDayIndex);
			return daysBetween >= 2; // At least 2 days separation
		});

		if (optimalDays.length > 0) {
			// Choose the first optimal day (could be enhanced with more sophisticated logic)
			return optimalDays[0];
		}

		// If no optimal days, choose the first available day
		return availableDays[0];
	}

	/**
	 * Calculates the minimum number of days between two day indices
	 */
	function calculateDaysBetween(day1Index: number, day2Index: number): number {
		const forward = (day2Index - day1Index + 7) % 7;
		const backward = (day1Index - day2Index + 7) % 7;
		return Math.min(forward, backward);
	}

	/**
	 * Enhances quality workout with rotation-specific details
	 */
	function enhanceQualityWorkout(
		baseWorkout: Workout,
		qualityType: "tempo" | "threshold" | "intervals" | "hills" | "fartlek",
		phase: TrainingPhase,
	): Workout {
		const qualityDef = QUALITY_WORKOUT_DEFINITIONS[qualityType];

		return {
			...baseWorkout,
			type: "quality",
			intensity: qualityDef.intensity,
			description: `${qualityDef.name} - ${getPhaseSpecificDescription(qualityType, phase)}`,
			paceGuidance: getPhaseSpecificPaceGuidance(qualityType, phase),
			recoveryTime: qualityDef.recoveryHours,
		};
	}

	/**
	 * Gets phase-specific description for quality workouts
	 */
	function getPhaseSpecificDescription(
		qualityType: "tempo" | "threshold" | "intervals" | "hills" | "fartlek",
		phase: TrainingPhase,
	): string {
		const descriptions = {
			tempo: {
				base: "Steady tempo effort to build lactate threshold",
				build: "Progressive tempo run with race pace segments",
				peak: "Race pace tempo with goal pace practice",
				taper: "Short tempo segments to maintain sharpness",
			},
			threshold: {
				base: "Broken threshold efforts to develop lactate buffering",
				build: "Progressive threshold intervals with race pace focus",
				peak: "Race-specific threshold intervals for power",
				taper: "Short threshold segments for neuromuscular activation",
			},
			intervals: {
				base: "Short intervals to introduce speed work",
				build: "VO2 max intervals at 5K-10K pace",
				peak: "Race-specific interval training",
				taper: "Short, sharp intervals for race preparation",
			},
			hills: {
				base: "Hill repeats for strength and form development",
				build: "Progressive hill intervals for power",
				peak: "Hill training for race-specific strength",
				taper: "Short hill strides for activation",
			},
			fartlek: {
				base: "Playful speed changes to develop pace variety",
				build: "Structured fartlek with race pace surges",
				peak: "Race simulation fartlek with tactical surges",
				taper: "Short, fun pickups to maintain leg speed",
			},
		};

		return descriptions[qualityType][phase];
	}

	/**
	 * Gets phase-specific pace guidance for quality workouts
	 */
	function getPhaseSpecificPaceGuidance(
		qualityType: "tempo" | "threshold" | "intervals" | "hills" | "fartlek",
		phase: TrainingPhase,
	): string {
		const paceGuidance = {
			tempo: {
				base: "Comfortably hard - sustainable for 20-30 minutes",
				build: "Lactate threshold pace - hard but controlled",
				peak: "Goal race pace for race-specific adaptation",
				taper: "Moderate effort - focus on feel rather than pace",
			},
			threshold: {
				base: "Threshold pace with short recoveries - comfortably hard",
				build: "Lactate threshold pace - maintain across all intervals",
				peak: "Goal race pace with race-specific recovery periods",
				taper: "Threshold effort but shorter duration - feel-based",
			},
			intervals: {
				base: "10K pace with full recovery between repeats",
				build: "5K pace with moderate recovery intervals",
				peak: "Goal race pace with race-specific recovery",
				taper: "Slightly faster than race pace, short duration",
			},
			hills: {
				base: "Moderate effort uphill - focus on form",
				build: "Hard effort uphill - 5K effort level",
				peak: "Strong uphill effort with quick turnover",
				taper: "Controlled effort - activation rather than stress",
			},
			fartlek: {
				base: "Vary effort by feel - mix easy with moderate surges",
				build: "Include 5K-10K pace surges with easy recovery",
				peak: "Practice race tactics with goal pace pickups",
				taper: "Light, playful surges - focus on leg turnover",
			},
		};

		return paceGuidance[qualityType][phase];
	}

	/**
	 * Gets available training days for easy workout distribution
	 */
	function getAvailableTrainingDays(
		currentSchedule: DailyWorkout[],
		constraints: SchedulingConstraints,
	): number[] {
		const availableDays: number[] = [];

		for (let i = 0; i < 7; i++) {
			const day = DAYS_OF_WEEK[i];
			if (!constraints.restDays.includes(day) && !currentSchedule[i].workout) {
				availableDays.push(i);
			}
		}

		return availableDays;
	}

	/**
	 * Distributes easy workouts across available training days
	 */
	function distributeEasyWorkouts(
		dailyWorkouts: DailyWorkout[],
		easyWorkouts: { type: WorkoutType; workout: Workout }[],
		availableDays: number[],
		schedulingNotes: string[],
		maxWorkoutsToSchedule: number,
	): void {
		// Sort available days to prefer even distribution
		const sortedDays = [...availableDays].sort();

		// Only schedule up to the maximum number of workouts needed
		const workoutsToSchedule = Math.min(
			easyWorkouts.length,
			sortedDays.length,
			maxWorkoutsToSchedule,
		);

		for (let i = 0; i < workoutsToSchedule; i++) {
			const dayIndex = sortedDays[i];
			const easyWorkout = easyWorkouts[i];

			dailyWorkouts[dayIndex] = {
				dayOfWeek: DAYS_OF_WEEK[dayIndex],
				isRestDay: false,
				workout: easyWorkout.workout,
			};

			schedulingNotes.push(`Easy run scheduled on ${DAYS_OF_WEEK[dayIndex]}`);
		}

		if (easyWorkouts.length > workoutsToSchedule) {
			schedulingNotes.push(
				`Note: ${easyWorkouts.length - workoutsToSchedule} easy workouts not scheduled due to training day limits`,
			);
		}
	}

	/**
	 * Validates the final schedule against constraints
	 */
	function validateFinalSchedule(
		dailyWorkouts: DailyWorkout[],
		constraints: SchedulingConstraints,
	): string[] {
		const violations: string[] = [];

		// Count scheduled training days
		const scheduledTrainingDays = dailyWorkouts.filter(
			(day) => !day.isRestDay && day.workout,
		).length;
		if (scheduledTrainingDays !== constraints.trainingDaysPerWeek) {
			violations.push(
				`Scheduled ${scheduledTrainingDays} training days, expected ${constraints.trainingDaysPerWeek}`,
			);
		}

		// Check rest day compliance
		constraints.restDays.forEach((restDay) => {
			const dayIndex = DAYS_OF_WEEK.indexOf(restDay);
			if (dayIndex !== -1 && !dailyWorkouts[dayIndex].isRestDay) {
				violations.push(
					`Rest day violation: ${restDay} has a scheduled workout`,
				);
			}
		});

		// Check for adequate recovery between quality workouts
		const qualityDays = dailyWorkouts
			.map((day, index) => ({ day, index }))
			.filter(({ day }) => day.workout?.type === "quality")
			.map(({ index }) => index);

		if (qualityDays.length > 1) {
			for (let i = 0; i < qualityDays.length - 1; i++) {
				const daysBetween = calculateDaysBetween(
					qualityDays[i],
					qualityDays[i + 1],
				);
				if (daysBetween < 2) {
					violations.push(
						"Insufficient recovery between quality workouts (less than 48 hours)",
					);
				}
			}
		}

		return violations;
	}

	/**
	 * Gets the next quality workout type in the rotation
	 */
	function getNextQualityWorkoutType(
		currentWeek: number,
	): "tempo" | "threshold" | "intervals" | "hills" | "fartlek" {
		const nextWeek = currentWeek + 1;
		const cycleIndex = (nextWeek - 1) % QUALITY_WORKOUT_CYCLE.length;
		return QUALITY_WORKOUT_CYCLE[cycleIndex];
	}

	/**
	 * Gets quality workout rotation schedule for multiple weeks
	 */
	function getQualityWorkoutSchedule(
		startWeek: number,
		numberOfWeeks: number,
	): QualityWorkoutRotation[] {
		const schedule: QualityWorkoutRotation[] = [];

		for (let week = startWeek; week < startWeek + numberOfWeeks; week++) {
			schedule.push(getQualityWorkoutRotation(week));
		}

		return schedule;
	}

	return {
		getQualityWorkoutRotation,
		createSchedulingConstraints,
		validateSchedulingConstraints,
		scheduleWeeklyWorkouts,
		findOptimalQualityWorkoutDay,
		calculateDaysBetween,
		enhanceQualityWorkout,
		getNextQualityWorkoutType,
		getQualityWorkoutSchedule,
		QUALITY_WORKOUT_CYCLE,
		QUALITY_WORKOUT_DEFINITIONS,
	};
}
