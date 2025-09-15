import type { PlanConfiguration } from "@/types/configuration";
import type { WeeklyPlan } from "@/types/trainingPlan";
import type { TrainingPhase, Workout, WorkoutType } from "@/types/workout";
import { usePhasePeriodization } from "./usePhasePeriodization";
import { useProgressionRules } from "./useProgressionRules";

/**
 * Deload week scheduling system that implements:
 * - Deload week placement every 3rd or 4th week based on user preference
 * - Deload week workout modification logic (20-30% volume reduction)
 * - Validation to ensure deload weeks don't conflict with key training phases
 */

export interface DeloadWeekConfiguration {
	weekNumber: number;
	isDeloadWeek: boolean;
	volumeReduction: number; // percentage (0.2 = 20% reduction)
	workoutModifications: DeloadWorkoutModification[];
	phaseConflicts: string[];
	schedulingNotes: string[];
}

export interface DeloadWorkoutModification {
	originalWorkout: Workout;
	modifiedWorkout: Workout;
	modificationType: "volume" | "intensity" | "duration" | "skip";
	reductionAmount: number; // percentage or absolute value
	rationale: string;
}

export interface DeloadSchedulingResult {
	success: boolean;
	deloadWeeks: DeloadWeekConfiguration[];
	totalDeloadWeeks: number;
	phaseConflicts: PhaseConflict[];
	warnings: string[];
	recommendations: string[];
}

export interface PhaseConflict {
	weekNumber: number;
	phase: TrainingPhase;
	conflictType: "critical_build" | "peak_preparation" | "taper_disruption";
	severity: "low" | "medium" | "high";
	recommendation: string;
}

/**
 * Deload modification rules by workout type
 */
const DELOAD_MODIFICATION_RULES = {
	easy: {
		volumeReduction: 0.25, // 25% distance reduction
		intensityAdjustment: 0, // No intensity change
		durationReduction: 0.2, // 20% duration reduction
		skipProbability: 0, // Never skip easy runs
		rationale: "Maintain easy pace but reduce volume for recovery",
	},
	long: {
		volumeReduction: 0.3, // 30% distance reduction
		intensityAdjustment: 0, // Keep easy intensity
		durationReduction: 0.25, // 25% duration reduction
		skipProbability: 0, // Never skip long runs, just reduce
		rationale:
			"Significant volume reduction while maintaining aerobic stimulus",
	},
	quality: {
		volumeReduction: 0.4, // 40% volume reduction
		intensityAdjustment: -0.1, // Slightly easier intensity
		durationReduction: 0.35, // 35% duration reduction
		skipProbability: 0.3, // 30% chance to skip entirely
		rationale: "Major reduction in quality work to promote recovery",
	},
	rest: {
		volumeReduction: 0, // No change
		intensityAdjustment: 0,
		durationReduction: 0,
		skipProbability: 0,
		rationale: "Rest days remain unchanged during deload",
	},
} as const;

/**
 * Phase-specific deload considerations
 */
const PHASE_DELOAD_GUIDELINES = {
	base: {
		allowDeload: true,
		volumeReductionRange: [0.2, 0.3],
		intensityMaintenance: true,
		criticalWeeks: [], // No critical weeks in base phase
		notes: "Deload weeks are beneficial during base building for adaptation",
	},
	build: {
		allowDeload: true,
		volumeReductionRange: [0.15, 0.25], // Less aggressive reduction
		intensityMaintenance: true,
		criticalWeeks: [1, 2], // First two weeks of build are critical
		notes: "Careful deload timing to not disrupt lactate threshold development",
	},
	peak: {
		allowDeload: false, // Generally avoid deloads during peak phase
		volumeReductionRange: [0.1, 0.15], // Minimal reduction if necessary
		intensityMaintenance: true,
		criticalWeeks: [1, 2, 3], // Most weeks are critical
		notes: "Avoid deloads during peak phase unless absolutely necessary",
	},
	taper: {
		allowDeload: false, // Taper is already a deload
		volumeReductionRange: [0, 0],
		intensityMaintenance: true,
		criticalWeeks: [1, 2], // All taper weeks are critical
		notes:
			"Taper phase already provides volume reduction - no additional deload needed",
	},
} as const;

export function useDeloadScheduling() {
	const { calculatePhasePeriodization, getPhaseForWeek } =
		usePhasePeriodization();
	const { isDeloadWeekNumber } = useProgressionRules();

	/**
	 * Schedules deload weeks for the entire training plan
	 */
	function scheduleDeloadWeeks(
		config: PlanConfiguration,
	): DeloadSchedulingResult {
		const { programLength, deloadFrequency, raceDistance } = config;

		// Calculate phase periodization to understand training phases
		const periodization = calculatePhasePeriodization(
			programLength,
			raceDistance,
		);

		const deloadWeeks: DeloadWeekConfiguration[] = [];
		const phaseConflicts: PhaseConflict[] = [];
		const warnings: string[] = [];
		const recommendations: string[] = [];

		// Identify all potential deload weeks
		for (let week = 1; week <= programLength; week++) {
			if (isDeloadWeekNumber(week, deloadFrequency)) {
				const phase = getPhaseForWeek(week, periodization);
				const deloadConfig = createDeloadWeekConfiguration(week, phase, config);

				deloadWeeks.push(deloadConfig);

				// Check for phase conflicts
				const conflict = checkPhaseConflict(week, phase, periodization);
				if (conflict) {
					phaseConflicts.push(conflict);

					if (conflict.severity === "high") {
						warnings.push(
							`Week ${week}: Deload conflicts with critical ${phase} phase training`,
						);
					}
				}
			}
		}

		// Validate overall deload scheduling
		const validation = validateDeloadScheduling(
			deloadWeeks,
			phaseConflicts,
			config,
		);

		warnings.push(...validation.warnings);
		recommendations.push(...validation.recommendations);

		return {
			success: phaseConflicts.filter((c) => c.severity === "high").length === 0,
			deloadWeeks,
			totalDeloadWeeks: deloadWeeks.length,
			phaseConflicts,
			warnings,
			recommendations,
		};
	}

	/**
	 * Creates deload week configuration with workout modifications
	 */
	function createDeloadWeekConfiguration(
		weekNumber: number,
		phase: TrainingPhase,
		config: PlanConfiguration,
	): DeloadWeekConfiguration {
		const phaseGuidelines = PHASE_DELOAD_GUIDELINES[phase];
		const schedulingNotes: string[] = [];
		const phaseConflicts: string[] = [];

		// Determine volume reduction based on phase
		const [minReduction, maxReduction] = phaseGuidelines.volumeReductionRange;
		const volumeReduction = minReduction + (maxReduction - minReduction) * 0.5; // Use middle of range

		// Check for phase conflicts
		if (!phaseGuidelines.allowDeload) {
			phaseConflicts.push(
				`Deload week conflicts with ${phase} phase - consider rescheduling`,
			);
		}

		// Add phase-specific notes
		schedulingNotes.push(phaseGuidelines.notes);

		// Create workout modifications (placeholder - would be populated with actual workouts)
		const workoutModifications: DeloadWorkoutModification[] = [];

		return {
			weekNumber,
			isDeloadWeek: true,
			volumeReduction,
			workoutModifications,
			phaseConflicts,
			schedulingNotes,
		};
	}

	/**
	 * Modifies workouts for deload week
	 */
	function modifyWorkoutsForDeload(
		originalWorkouts: { type: WorkoutType; workout: Workout }[],
		phase: TrainingPhase,
		volumeReduction: number,
	): DeloadWorkoutModification[] {
		const modifications: DeloadWorkoutModification[] = [];

		for (const { type, workout } of originalWorkouts) {
			const rules = DELOAD_MODIFICATION_RULES[type];

			// Determine if workout should be skipped
			const shouldSkip = Math.random() < rules.skipProbability;

			if (shouldSkip && type === "quality") {
				modifications.push({
					originalWorkout: workout,
					modifiedWorkout: { ...workout, type: "rest" as WorkoutType },
					modificationType: "skip",
					reductionAmount: 1.0, // 100% reduction (skipped)
					rationale:
						"Quality workout skipped during deload for enhanced recovery",
				});
				continue;
			}

			// Apply volume and duration modifications
			const modifiedWorkout = { ...workout };
			let actualReduction = volumeReduction;

			// Adjust distance if present
			if (workout.distance) {
				const distanceReduction = Math.max(
					volumeReduction,
					rules.volumeReduction,
				);
				modifiedWorkout.distance = Math.round(
					workout.distance * (1 - distanceReduction),
				);
				actualReduction = distanceReduction;
			}

			// Adjust duration
			const durationReduction = Math.max(
				volumeReduction * 0.8, // Duration reduction slightly less than volume
				rules.durationReduction,
			);
			modifiedWorkout.duration = Math.round(
				workout.duration * (1 - durationReduction),
			);

			// Adjust intensity for quality workouts
			if (type === "quality" && rules.intensityAdjustment !== 0) {
				modifiedWorkout.description = `${workout.description} (reduced intensity for deload)`;
				modifiedWorkout.paceGuidance = `${workout.paceGuidance} - aim for easier end of range`;
			}

			// Update description to reflect deload modifications
			modifiedWorkout.description = `DELOAD: ${modifiedWorkout.description}`;

			modifications.push({
				originalWorkout: workout,
				modifiedWorkout,
				modificationType: workout.distance ? "volume" : "duration",
				reductionAmount: actualReduction,
				rationale: rules.rationale,
			});
		}

		return modifications;
	}

	/**
	 * Checks for conflicts between deload weeks and critical training phases
	 */
	function checkPhaseConflict(
		weekNumber: number,
		phase: TrainingPhase,
		periodization: ReturnType<typeof calculatePhasePeriodization>,
	): PhaseConflict | null {
		const phaseGuidelines = PHASE_DELOAD_GUIDELINES[phase];
		const phaseConfig = periodization.phases.find((p) => p.phase === phase);

		if (!phaseConfig) return null;

		// Calculate week within phase
		const weekInPhase = weekNumber - phaseConfig.startWeek + 1;

		// Check if this is a critical week within the phase
		const isCriticalWeek = phaseGuidelines.criticalWeeks.includes(weekInPhase);

		if (!phaseGuidelines.allowDeload) {
			return {
				weekNumber,
				phase,
				conflictType:
					phase === "peak" ? "peak_preparation" : "taper_disruption",
				severity: "high",
				recommendation: `Consider moving deload to week ${weekNumber - 1} or ${weekNumber + 1} if possible`,
			};
		}

		if (isCriticalWeek) {
			return {
				weekNumber,
				phase,
				conflictType: "critical_build",
				severity: "medium",
				recommendation: `Week ${weekNumber} is critical for ${phase} phase development - monitor recovery carefully`,
			};
		}

		return null;
	}

	/**
	 * Validates the overall deload scheduling strategy
	 */
	function validateDeloadScheduling(
		deloadWeeks: DeloadWeekConfiguration[],
		phaseConflicts: PhaseConflict[],
		config: PlanConfiguration,
	): { warnings: string[]; recommendations: string[] } {
		const warnings: string[] = [];
		const recommendations: string[] = [];

		// Check deload frequency appropriateness
		const deloadRatio = deloadWeeks.length / config.programLength;

		if (deloadRatio < 0.15) {
			warnings.push("Low deload frequency may not provide adequate recovery");
			recommendations.push(
				"Consider more frequent deload weeks for better adaptation",
			);
		}

		if (deloadRatio > 0.3) {
			warnings.push("High deload frequency may limit training stimulus");
			recommendations.push(
				"Consider reducing deload frequency to maintain training load",
			);
		}

		// Check for consecutive deload weeks (should not happen with proper scheduling)
		for (let i = 0; i < deloadWeeks.length - 1; i++) {
			const current = deloadWeeks[i]!;
			const next = deloadWeeks[i + 1]!;

			if (next.weekNumber - current.weekNumber === 1) {
				warnings.push(
					`Consecutive deload weeks (${current.weekNumber}-${next.weekNumber}) detected`,
				);
				recommendations.push(
					"Avoid consecutive deload weeks to maintain training rhythm",
				);
			}
		}

		// Check for high-severity phase conflicts
		const highSeverityConflicts = phaseConflicts.filter(
			(c) => c.severity === "high",
		);
		if (highSeverityConflicts.length > 0) {
			warnings.push(
				`${highSeverityConflicts.length} high-priority phase conflicts detected`,
			);
			recommendations.push(
				"Consider adjusting deload frequency or program length to avoid critical phase disruption",
			);
		}

		// Race distance specific recommendations
		if (config.raceDistance === "Marathon" && config.deloadFrequency === 4) {
			recommendations.push(
				"Consider 3-week deload frequency for marathon training due to higher volume stress",
			);
		}

		if (config.raceDistance === "5K" && config.deloadFrequency === 3) {
			recommendations.push(
				"4-week deload frequency may be sufficient for 5K training",
			);
		}

		return { warnings, recommendations };
	}

	/**
	 * Applies deload modifications to a weekly plan
	 */
	function applyDeloadToWeeklyPlan(
		weeklyPlan: WeeklyPlan,
		deloadConfig: DeloadWeekConfiguration,
	): WeeklyPlan {
		const modifiedPlan = { ...weeklyPlan };

		// Apply volume reduction to weekly totals
		modifiedPlan.weeklyVolume = Math.round(
			weeklyPlan.weeklyVolume * (1 - deloadConfig.volumeReduction),
		);
		modifiedPlan.weeklyVolumeKm = Math.round(
			weeklyPlan.weeklyVolumeKm * (1 - deloadConfig.volumeReduction),
		);

		// Reduce weekly duration
		modifiedPlan.weeklyDuration = Math.round(
			weeklyPlan.weeklyDuration * (1 - deloadConfig.volumeReduction * 0.8),
		);

		// Mark as deload week
		modifiedPlan.isDeloadWeek = true;
		modifiedPlan.weeklyFocus = `Deload Week - Recovery and Adaptation`;
		modifiedPlan.notes = `Volume reduced by ${Math.round(deloadConfig.volumeReduction * 100)}% for recovery. ${deloadConfig.schedulingNotes.join(" ")}`;

		return modifiedPlan;
	}

	/**
	 * Gets deload week recommendations for a specific configuration
	 */
	function getDeloadRecommendations(config: PlanConfiguration): {
		optimalFrequency: 3 | 4;
		expectedDeloadWeeks: number[];
		phaseConsiderations: string[];
		volumeReductionGuidance: string;
	} {
		const { programLength, raceDistance, deloadFrequency } = config;

		// Calculate expected deload weeks
		const expectedDeloadWeeks: number[] = [];
		for (let week = 1; week <= programLength; week++) {
			if (isDeloadWeekNumber(week, deloadFrequency)) {
				expectedDeloadWeeks.push(week);
			}
		}

		// Determine optimal frequency based on race distance
		let optimalFrequency: 3 | 4 = 4;
		if (raceDistance === "Marathon") {
			optimalFrequency = 3; // More frequent deloads for marathon training
		}

		const phaseConsiderations = [
			"Base phase: Deload weeks support aerobic adaptation",
			"Build phase: Time deloads carefully to not disrupt lactate threshold development",
			"Peak phase: Avoid deloads during race-specific preparation",
			"Taper phase: No additional deloads needed - taper provides volume reduction",
		];

		const volumeReductionGuidance =
			"Reduce volume by 20-30% while maintaining workout variety and intensity zones";

		return {
			optimalFrequency,
			expectedDeloadWeeks,
			phaseConsiderations,
			volumeReductionGuidance,
		};
	}

	return {
		scheduleDeloadWeeks,
		createDeloadWeekConfiguration,
		modifyWorkoutsForDeload,
		checkPhaseConflict,
		validateDeloadScheduling,
		applyDeloadToWeeklyPlan,
		getDeloadRecommendations,
		DELOAD_MODIFICATION_RULES,
		PHASE_DELOAD_GUIDELINES,
	};
}
