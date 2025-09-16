import type { PlanConfiguration } from "@/types/configuration";
import type { TrainingPlan, WeeklyPlan } from "@/types/trainingPlan";
import type { TrainingPhase } from "@/types/workout";
import { validatePlanConfiguration } from "@/utils/configurationValidation";
import { useDeloadScheduling } from "./useDeloadScheduling";
import { usePhasePeriodization } from "./usePhasePeriodization";
import { useProgressionRules } from "./useProgressionRules";
import { useWorkoutDistribution } from "./useWorkoutDistribution";
import { useWorkoutScheduling } from "./useWorkoutScheduling";

/**
 * Main plan generation orchestrator that coordinates all generation steps
 * Implements step-by-step plan creation:
 * 1. Validate configuration
 * 2. Determine phases
 * 3. Calculate distributions
 * 4. Generate sequences
 * 5. Optimize schedules
 * 6. Apply deload weeks
 * 7. Validate complete plan
 */

export interface PlanGenerationResult {
	success: boolean;
	plan: TrainingPlan | null;
	errors: string[];
	warnings: string[];
	validationResult?: ReturnType<typeof validatePlanConfiguration>;
}

export interface PlanGenerationOptions {
	validateOnly?: boolean;
	skipDeloadWeeks?: boolean;
	customPhaseDistribution?: Record<TrainingPhase, number>;
}

export interface GenerationStep {
	step: string;
	status: "pending" | "in_progress" | "completed" | "failed";
	message: string;
	duration?: number;
}

export function usePlanGenerator() {
	const { calculatePhasePeriodization, getPhaseForWeek } =
		usePhasePeriodization();
	const { calculateWeeklyVolumes, validateProgression } = useProgressionRules();
	const { createWeeklyDistribution, validateWorkoutDistribution } =
		useWorkoutDistribution();
	const { scheduleWeeklyWorkouts, createSchedulingConstraints } =
		useWorkoutScheduling();
	const { scheduleDeloadWeeks, applyDeloadToWeeklyPlan } =
		useDeloadScheduling();

	/**
	 * Main plan generation orchestrator
	 */
	function generatePlan(
		config: PlanConfiguration,
		options: PlanGenerationOptions = {},
	): PlanGenerationResult {
		const startTime = Date.now();
		const errors: string[] = [];
		const warnings: string[] = [];
		const steps: GenerationStep[] = [];

		try {
			// Step 1: Validate configuration
			const validationStep = executeStep(
				"Validating configuration",
				() => validateConfiguration(config),
				steps,
			);

			if (!validationStep.success) {
				return {
					success: false,
					plan: null,
					errors: validationStep.errors,
					warnings: validationStep.warnings,
					validationResult: validationStep.validationResult,
				};
			}

			warnings.push(...validationStep.warnings);

			// Return early if validation-only mode
			if (options.validateOnly) {
				return {
					success: true,
					plan: null,
					errors: [],
					warnings,
					validationResult: validationStep.validationResult,
				};
			}

			// Step 2: Determine training phases
			const phasesStep = executeStep(
				"Determining training phases",
				() => determineTrainingPhases(config, options),
				steps,
			);

			if (!phasesStep.success) {
				return {
					success: false,
					plan: null,
					errors: phasesStep.errors,
					warnings: [...warnings, ...phasesStep.warnings],
				};
			}

			warnings.push(...phasesStep.warnings);
			const periodization = phasesStep.result;

			// Step 3: Calculate weekly volume progression
			const volumesStep = executeStep(
				"Calculating weekly volume progression",
				() => calculateVolumeProgression(config),
				steps,
			);

			if (!volumesStep.success) {
				return {
					success: false,
					plan: null,
					errors: volumesStep.errors,
					warnings: [...warnings, ...volumesStep.warnings],
				};
			}

			warnings.push(...volumesStep.warnings);
			const weeklyVolumes = volumesStep.result;

			// Step 4: Generate weekly workout distributions
			const distributionsStep = executeStep(
				"Generating workout distributions",
				() =>
					generateWorkoutDistributions(config, weeklyVolumes, periodization),
				steps,
			);

			if (!distributionsStep.success) {
				return {
					success: false,
					plan: null,
					errors: distributionsStep.errors,
					warnings: [...warnings, ...distributionsStep.warnings],
				};
			}

			warnings.push(...distributionsStep.warnings);
			const weeklyDistributions = distributionsStep.result;

			// Step 5: Optimize weekly schedules
			const schedulesStep = executeStep(
				"Optimizing weekly schedules",
				() => optimizeWeeklySchedules(config, weeklyDistributions, periodization),
				steps,
			);

			if (!schedulesStep.success) {
				return {
					success: false,
					plan: null,
					errors: schedulesStep.errors,
					warnings: [...warnings, ...schedulesStep.warnings],
				};
			}

			warnings.push(...schedulesStep.warnings);
			let weeklyPlans = schedulesStep.result;

			// Step 6: Apply deload weeks (if not skipped)
			if (!options.skipDeloadWeeks) {
				const deloadStep = executeStep(
					"Applying deload week modifications",
					() => applyDeloadWeeks(config, weeklyPlans),
					steps,
				);

				if (!deloadStep.success) {
					return {
						success: false,
						plan: null,
						errors: deloadStep.errors,
						warnings: [...warnings, ...deloadStep.warnings],
					};
				}

				warnings.push(...deloadStep.warnings);
				weeklyPlans = deloadStep.result;
			}

			// Step 7: Create final training plan
			const finalPlanStep = executeStep(
				"Creating final training plan",
				() => createFinalTrainingPlan(config, weeklyPlans, periodization),
				steps,
			);

			if (!finalPlanStep.success) {
				return {
					success: false,
					plan: null,
					errors: finalPlanStep.errors,
					warnings: [...warnings, ...finalPlanStep.warnings],
				};
			}

			warnings.push(...finalPlanStep.warnings);
			const finalPlan = finalPlanStep.result;

			// Step 8: Validate complete plan
			const planValidationStep = executeStep(
				"Validating complete plan",
				() => validateCompletePlan(finalPlan),
				steps,
			);

			if (!planValidationStep.success) {
				return {
					success: false,
					plan: null,
					errors: planValidationStep.errors,
					warnings: [...warnings, ...planValidationStep.warnings],
				};
			}

			warnings.push(...planValidationStep.warnings);

			const totalTime = Date.now() - startTime;
			console.log(`Plan generation completed in ${totalTime}ms`);

			return {
				success: true,
				plan: finalPlan,
				errors: [],
				warnings,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			errors.push(`Plan generation failed: ${errorMessage}`);

			return {
				success: false,
				plan: null,
				errors,
				warnings,
			};
		}
	}

	/**
	 * Step 1: Validate configuration
	 */
	function validateConfiguration(config: PlanConfiguration): {
		success: boolean;
		errors: string[];
		warnings: string[];
		validationResult: ReturnType<typeof validatePlanConfiguration>;
	} {
		const validationResult = validatePlanConfiguration(config);

		return {
			success: validationResult.isValid,
			errors: validationResult.errors.map((error) => error.message),
			warnings: validationResult.warnings.map((warning) => warning.message),
			validationResult,
		};
	}

	/**
	 * Step 2: Determine training phases
	 */
	function determineTrainingPhases(
		config: PlanConfiguration,
		options: PlanGenerationOptions,
	): {
		success: boolean;
		errors: string[];
		warnings: string[];
		result: ReturnType<typeof calculatePhasePeriodization>;
	} {
		try {
			const periodization = calculatePhasePeriodization(
				config.programLength,
				config.raceDistance,
			);

			// Apply custom phase distribution if provided
			if (options.customPhaseDistribution) {
				// This would modify the periodization based on custom distribution
				// For now, we'll use the calculated periodization as-is
			}

			const warnings: string[] = [];

			// Add warnings for suboptimal phase distributions
			const basePhase = periodization.phases.find((p) => p.phase === "base");
			if (basePhase && basePhase.percentage < 25) {
				warnings.push(
					"Base phase may be too short for adequate aerobic development",
				);
			}

			const taperPhase = periodization.phases.find((p) => p.phase === "taper");
			if (taperPhase && taperPhase.durationWeeks < 2) {
				warnings.push("Taper phase may be too short for adequate recovery");
			}

			return {
				success: true,
				errors: [],
				warnings,
				result: periodization,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Failed to determine training phases: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings: [],
				result: null as any,
			};
		}
	}

	/**
	 * Step 3: Calculate weekly volume progression
	 */
	function calculateVolumeProgression(config: PlanConfiguration): {
		success: boolean;
		errors: string[];
		warnings: string[];
		result: ReturnType<typeof calculateWeeklyVolumes>;
	} {
		try {
			const progressionConfig = {
				raceDistance: config.raceDistance,
				programLength: config.programLength,
				trainingDaysPerWeek: config.trainingDaysPerWeek,
				deloadFrequency: config.deloadFrequency,
				userExperience: config.userExperience || "intermediate",
			};

			const weeklyVolumes = calculateWeeklyVolumes(progressionConfig);

			// Validate progression for safety
			const progressionValidation = validateProgression(weeklyVolumes);

			return {
				success: progressionValidation.isValid,
				errors: progressionValidation.isValid
					? []
					: ["Progression validation failed"],
				warnings: [
					...progressionValidation.warnings,
					...progressionValidation.adjustments,
				],
				result: weeklyVolumes,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Failed to calculate volume progression: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings: [],
				result: null as any,
			};
		}
	}

	/**
	 * Step 4: Generate workout distributions for each week
	 */
	function generateWorkoutDistributions(
		config: PlanConfiguration,
		weeklyVolumes: ReturnType<typeof calculateWeeklyVolumes>,
		periodization: ReturnType<typeof calculatePhasePeriodization>,
	): {
		success: boolean;
		errors: string[];
		warnings: string[];
		result: Array<{
			weekNumber: number;
			phase: TrainingPhase;
			distribution: ReturnType<typeof createWeeklyDistribution>;
		}>;
	} {
		try {
			const distributions: Array<{
				weekNumber: number;
				phase: TrainingPhase;
				distribution: ReturnType<typeof createWeeklyDistribution>;
			}> = [];
			const warnings: string[] = [];

			for (let week = 1; week <= config.programLength; week++) {
				const weekVolume = weeklyVolumes.find((v) => v.weekNumber === week);
				if (!weekVolume) {
					throw new Error(`No volume data found for week ${week}`);
				}

				const phase = getPhaseForWeek(week, periodization);
				const distribution = createWeeklyDistribution(
					config,
					weekVolume.adjustedVolume,
					phase,
				);

				// Validate each week's distribution
				const distributionValidation = validateWorkoutDistribution(distribution);
				if (!distributionValidation.isValid) {
					warnings.push(
						`Week ${week}: ${distributionValidation.warnings.join(", ")}`,
					);
				}

				warnings.push(...distributionValidation.recommendations);

				distributions.push({
					weekNumber: week,
					phase,
					distribution,
				});
			}

			return {
				success: true,
				errors: [],
				warnings,
				result: distributions,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Failed to generate workout distributions: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings: [],
				result: null as any,
			};
		}
	}

	/**
	 * Step 5: Optimize weekly schedules
	 */
	function optimizeWeeklySchedules(
		config: PlanConfiguration,
		weeklyDistributions: Array<{
			weekNumber: number;
			phase: TrainingPhase;
			distribution: ReturnType<typeof createWeeklyDistribution>;
		}>,
		periodization: ReturnType<typeof calculatePhasePeriodization>,
	): {
		success: boolean;
		errors: string[];
		warnings: string[];
		result: WeeklyPlan[];
	} {
		try {
			const weeklyPlans: WeeklyPlan[] = [];
			const warnings: string[] = [];
			const constraints = createSchedulingConstraints(config);

			for (const weekData of weeklyDistributions) {
				const { weekNumber, phase, distribution } = weekData;

				// Convert distribution to workout array for scheduling
				const workouts = distribution.dailyWorkouts
					.filter((day) => !day.isRestDay && day.workout)
					.map((day) => ({
						type: day.workout!.type,
						workout: day.workout!,
					}));

				// Schedule workouts for the week
				const schedulingResult = scheduleWeeklyWorkouts(
					weekNumber,
					constraints,
					workouts,
					phase,
				);

				if (!schedulingResult.success) {
					warnings.push(
						`Week ${weekNumber}: ${schedulingResult.errors.join(", ")}`,
					);
				}

				warnings.push(...schedulingResult.warnings);

				// Create weekly plan from scheduled workouts
				const weeklyPlan: WeeklyPlan = {
					weekNumber,
					phase,
					isDeloadWeek: false, // Will be set in deload step
					days: schedulingResult.scheduledWeek?.dailyWorkouts || [],
					weeklyVolume: 0, // Will be calculated from workouts
					weeklyVolumeKm: 0, // Will be calculated from workouts
					weeklyDuration: 0, // Will be calculated from workouts
					workoutCount: distribution.totalWorkouts,
					qualityWorkoutCount: distribution.workoutCounts.quality,
					weeklyFocus: getWeeklyFocus(phase, weekNumber, periodization),
				};

				// Calculate weekly totals
				calculateWeeklyTotals(weeklyPlan);

				weeklyPlans.push(weeklyPlan);
			}

			return {
				success: true,
				errors: [],
				warnings,
				result: weeklyPlans,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Failed to optimize weekly schedules: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings: [],
				result: null as any,
			};
		}
	}

	/**
	 * Step 6: Apply deload weeks
	 */
	function applyDeloadWeeks(
		config: PlanConfiguration,
		weeklyPlans: WeeklyPlan[],
	): {
		success: boolean;
		errors: string[];
		warnings: string[];
		result: WeeklyPlan[];
	} {
		try {
			const deloadSchedulingResult = scheduleDeloadWeeks(config);

			// Don't fail the entire plan generation for deload conflicts - just warn
			const hasHighSeverityConflicts = deloadSchedulingResult.phaseConflicts.some(
				(conflict) => conflict.severity === "high",
			);

			if (hasHighSeverityConflicts) {
				// Filter out deload weeks that have high-severity conflicts
				const filteredDeloadWeeks = deloadSchedulingResult.deloadWeeks.filter(
					(deloadWeek) =>
						!deloadSchedulingResult.phaseConflicts.some(
							(conflict) =>
								conflict.weekNumber === deloadWeek.weekNumber &&
								conflict.severity === "high",
						),
				);

				deloadSchedulingResult.deloadWeeks = filteredDeloadWeeks;
			}

			const modifiedPlans = weeklyPlans.map((plan) => {
				const deloadConfig = deloadSchedulingResult.deloadWeeks.find(
					(dw) => dw.weekNumber === plan.weekNumber,
				);

				if (deloadConfig) {
					return applyDeloadToWeeklyPlan(plan, deloadConfig);
				}

				return plan;
			});

			return {
				success: true,
				errors: [],
				warnings: deloadSchedulingResult.warnings,
				result: modifiedPlans,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Failed to apply deload weeks: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings: [],
				result: null as any,
			};
		}
	}

	/**
	 * Step 7: Create final training plan
	 */
	function createFinalTrainingPlan(
		config: PlanConfiguration,
		weeklyPlans: WeeklyPlan[],
		periodization: ReturnType<typeof calculatePhasePeriodization>,
	): {
		success: boolean;
		errors: string[];
		warnings: string[];
		result: TrainingPlan;
	} {
		try {
			// Calculate plan metadata
			const totalKilometers = weeklyPlans.reduce(
				(sum, week) => sum + week.weeklyVolumeKm,
				0,
			);
			const totalMiles = totalKilometers * 0.621371; // Convert km to miles
			const totalWorkouts = weeklyPlans.reduce(
				(sum, week) => sum + week.workoutCount,
				0,
			);
			const totalTrainingDays = weeklyPlans.reduce(
				(sum, week) => sum + week.days.filter((day) => !day.isRestDay).length,
				0,
			);
			const totalRestDays = weeklyPlans.reduce(
				(sum, week) => sum + week.days.filter((day) => day.isRestDay).length,
				0,
			);

			// Calculate workout type distribution
			const workoutTypeDistribution = calculateWorkoutTypeDistribution(weeklyPlans);

			// Calculate phase distribution
			const phaseDistribution = {
				base: periodization.phases.find((p) => p.phase === "base")?.durationWeeks || 0,
				build: periodization.phases.find((p) => p.phase === "build")?.durationWeeks || 0,
				peak: periodization.phases.find((p) => p.phase === "peak")?.durationWeeks || 0,
				taper: periodization.phases.find((p) => p.phase === "taper")?.durationWeeks || 0,
			};

			const plan: TrainingPlan = {
				id: generatePlanId(),
				configuration: config,
				weeks: weeklyPlans,
				metadata: {
					totalMiles,
					totalKilometers,
					totalWorkouts,
					totalTrainingDays,
					totalRestDays,
					createdAt: new Date(),
					lastModified: new Date(),
					estimatedTimeCommitment: calculateEstimatedTimeCommitment(weeklyPlans),
					workoutTypeDistribution,
					phaseDistribution,
					version: "1.0.0",
				},
			};

			return {
				success: true,
				errors: [],
				warnings: [],
				result: plan,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Failed to create final training plan: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings: [],
				result: null as any,
			};
		}
	}

	/**
	 * Step 8: Validate complete plan
	 */
	function validateCompletePlan(plan: TrainingPlan): {
		success: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Validate plan structure
			if (!plan.id || !plan.configuration || !plan.weeks || !plan.metadata) {
				errors.push("Plan structure is incomplete");
			}

			// Validate week count matches configuration
			if (plan.weeks.length !== plan.configuration.programLength) {
				errors.push(
					`Plan has ${plan.weeks.length} weeks but configuration specifies ${plan.configuration.programLength}`,
				);
			}

			// Validate each week has proper structure
			for (const week of plan.weeks) {
				if (!week.days || week.days.length !== 7) {
					errors.push(`Week ${week.weekNumber} does not have 7 days`);
				}

				// Check training days match configuration
				const trainingDays = week.days.filter((day) => !day.isRestDay).length;
				if (trainingDays !== plan.configuration.trainingDaysPerWeek) {
					warnings.push(
						`Week ${week.weekNumber} has ${trainingDays} training days, expected ${plan.configuration.trainingDaysPerWeek}`,
					);
				}
			}

			// Validate progression principles
			validateProgressionPrinciples(plan, warnings);

			// Validate 80/20 rule adherence
			validate80_20Rule(plan, warnings);

			return {
				success: errors.length === 0,
				errors,
				warnings,
			};
		} catch (error) {
			return {
				success: false,
				errors: [
					`Plan validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
				warnings,
			};
		}
	}

	/**
	 * Helper function to execute a generation step with error handling
	 */
	function executeStep<T>(
		stepName: string,
		stepFunction: () => T,
		steps: GenerationStep[],
	): T & { success: boolean } {
		const step: GenerationStep = {
			step: stepName,
			status: "in_progress",
			message: `Executing ${stepName}...`,
		};
		steps.push(step);

		const startTime = Date.now();

		try {
			const result = stepFunction();
			const duration = Date.now() - startTime;

			step.status = "completed";
			step.message = `${stepName} completed successfully`;
			step.duration = duration;

			return result as T & { success: boolean };
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			step.status = "failed";
			step.message = `${stepName} failed: ${errorMessage}`;
			step.duration = duration;

			throw error;
		}
	}

	/**
	 * Helper functions for plan creation and validation
	 */
	function getWeeklyFocus(
		phase: TrainingPhase,
		weekNumber: number,
		periodization: ReturnType<typeof calculatePhasePeriodization>,
	): string {
		const phaseConfig = periodization.phases.find((p) => p.phase === phase);
		return phaseConfig?.focus || `${phase} phase training`;
	}

	function calculateWeeklyTotals(weeklyPlan: WeeklyPlan): void {
		let totalDistance = 0;
		let totalDuration = 0;

		for (const day of weeklyPlan.days) {
			if (!day.isRestDay && day.workout) {
				totalDistance += day.workout.distance || 0;
				totalDuration += day.workout.duration || 0;
			}
		}

		weeklyPlan.weeklyVolumeKm = totalDistance;
		weeklyPlan.weeklyVolume = totalDistance * 0.621371; // Convert to miles
		weeklyPlan.weeklyDuration = totalDuration;
	}

	function calculateWorkoutTypeDistribution(weeklyPlans: WeeklyPlan[]) {
		let easy = 0;
		let long = 0;
		let quality = 0;
		let rest = 0;

		for (const week of weeklyPlans) {
			for (const day of week.days) {
				if (day.isRestDay) {
					rest++;
				} else if (day.workout) {
					switch (day.workout.type) {
						case "easy":
							easy++;
							break;
						case "long":
							long++;
							break;
						case "quality":
							quality++;
							break;
						default:
							break;
					}
				}
			}
		}

		return { easy, long, quality, rest };
	}

	function calculateEstimatedTimeCommitment(weeklyPlans: WeeklyPlan[]): number {
		const totalMinutes = weeklyPlans.reduce(
			(sum, week) => sum + week.weeklyDuration,
			0,
		);
		return Math.round(totalMinutes / weeklyPlans.length); // Average per week
	}

	function generatePlanId(): string {
		return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	function validateProgressionPrinciples(
		plan: TrainingPlan,
		warnings: string[],
	): void {
		// Check for excessive weekly increases
		for (let i = 1; i < plan.weeks.length; i++) {
			const currentWeek = plan.weeks[i]!;
			const previousWeek = plan.weeks[i - 1]!;

			if (!currentWeek.isDeloadWeek && !previousWeek.isDeloadWeek) {
				const increase =
					(currentWeek.weeklyVolumeKm - previousWeek.weeklyVolumeKm) /
					previousWeek.weeklyVolumeKm;

				if (increase > 0.1) {
					warnings.push(
						`Week ${currentWeek.weekNumber}: ${Math.round(increase * 100)}% volume increase exceeds 10% rule`,
					);
				}
			}
		}
	}

	function validate80_20Rule(plan: TrainingPlan, warnings: string[]): void {
		const totalWorkouts = plan.metadata.totalWorkouts;
		const qualityWorkouts = plan.metadata.workoutTypeDistribution.quality;
		const qualityPercentage = (qualityWorkouts / totalWorkouts) * 100;

		if (qualityPercentage > 25) {
			warnings.push(
				`Quality workouts represent ${Math.round(qualityPercentage)}% of total workouts, exceeding recommended 20%`,
			);
		}
	}

	return {
		generatePlan,
		validateConfiguration,
		determineTrainingPhases,
		calculateVolumeProgression,
		generateWorkoutDistributions,
		optimizeWeeklySchedules,
		applyDeloadWeeks,
		createFinalTrainingPlan,
		validateCompletePlan,
	};
}
