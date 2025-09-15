import { describe, expect, it } from "vitest";
import type { PlanConfiguration } from "@/types/configuration";
import { useWorkoutScheduling } from "../useWorkoutScheduling";

describe("useWorkoutScheduling", () => {
	const {
		getQualityWorkoutRotation,
		createSchedulingConstraints,
		validateSchedulingConstraints,
		scheduleWeeklyWorkouts,
		calculateDaysBetween,
		getNextQualityWorkoutType,
		getQualityWorkoutSchedule,
		QUALITY_WORKOUT_CYCLE,
	} = useWorkoutScheduling();

	// Sample configuration for testing
	const sampleConfig: PlanConfiguration = {
		raceDistance: "Half Marathon",
		programLength: 12,
		trainingDaysPerWeek: 4,
		restDays: ["Monday", "Friday"],
		longRunDay: "Sunday",
		deloadFrequency: 4,
	};

	// Sample workouts for testing - need 4 workouts for 4 training days
	const sampleWorkouts = [
		{
			type: "easy" as const,
			workout: {
				type: "easy" as const,
				duration: 45,
				distance: 6,
				intensity: "zone2" as const,
				description: "Easy run",
				paceGuidance: "Conversational pace",
				recoveryTime: 0,
			},
		},
		{
			type: "easy" as const,
			workout: {
				type: "easy" as const,
				duration: 40,
				distance: 5,
				intensity: "zone2" as const,
				description: "Easy run 2",
				paceGuidance: "Conversational pace",
				recoveryTime: 0,
			},
		},
		{
			type: "long" as const,
			workout: {
				type: "long" as const,
				duration: 90,
				distance: 12,
				intensity: "zone2" as const,
				description: "Long run",
				paceGuidance: "Steady effort",
				recoveryTime: 24,
			},
		},
		{
			type: "quality" as const,
			workout: {
				type: "quality" as const,
				duration: 60,
				distance: 8,
				intensity: "zone4" as const,
				description: "Quality workout",
				paceGuidance: "Hard effort",
				recoveryTime: 48,
			},
		},
	];

	describe("Quality Workout Rotation", () => {
		it("should follow tempo → threshold → intervals → hills → fartlek cycle", () => {
			expect(QUALITY_WORKOUT_CYCLE).toEqual([
				"tempo",
				"threshold",
				"intervals",
				"hills",
				"fartlek",
			]);
		});

		it("should return correct quality workout type for each week", () => {
			const week1 = getQualityWorkoutRotation(1);
			const week2 = getQualityWorkoutRotation(2);
			const week3 = getQualityWorkoutRotation(3);
			const week4 = getQualityWorkoutRotation(4);
			const week5 = getQualityWorkoutRotation(5);
			const week6 = getQualityWorkoutRotation(6); // Should cycle back to tempo

			expect(week1.qualityType).toBe("tempo");
			expect(week2.qualityType).toBe("threshold");
			expect(week3.qualityType).toBe("intervals");
			expect(week4.qualityType).toBe("hills");
			expect(week5.qualityType).toBe("fartlek");
			expect(week6.qualityType).toBe("tempo"); // Cycle repeats
		});

		it("should provide correct next rotation information", () => {
			const week1 = getQualityWorkoutRotation(1);
			const week2 = getQualityWorkoutRotation(2);
			const week3 = getQualityWorkoutRotation(3);
			const week4 = getQualityWorkoutRotation(4);
			const week5 = getQualityWorkoutRotation(5);

			expect(week1.nextRotation).toBe("threshold");
			expect(week2.nextRotation).toBe("intervals");
			expect(week3.nextRotation).toBe("hills");
			expect(week4.nextRotation).toBe("fartlek");
			expect(week5.nextRotation).toBe("tempo");
		});

		it("should include descriptive information for each workout type", () => {
			const tempoWeek = getQualityWorkoutRotation(1);
			const thresholdWeek = getQualityWorkoutRotation(2);
			const intervalWeek = getQualityWorkoutRotation(3);
			const hillWeek = getQualityWorkoutRotation(4);
			const fartlekWeek = getQualityWorkoutRotation(5);

			expect(tempoWeek.description).toContain("Tempo Run");
			expect(thresholdWeek.description).toContain("Threshold Intervals");
			expect(intervalWeek.description).toContain("Interval Training");
			expect(hillWeek.description).toContain("Hill Repeats");
			expect(fartlekWeek.description).toContain("Fartlek Training");
		});
	});

	describe("Scheduling Constraints", () => {
		it("should create constraints from plan configuration", () => {
			const constraints = createSchedulingConstraints(sampleConfig);

			expect(constraints.restDays).toEqual(["Monday", "Friday"]);
			expect(constraints.longRunDay).toBe("Sunday");
			expect(constraints.trainingDaysPerWeek).toBe(4);
			expect(constraints.minimumRecoveryHours).toBe(48);
		});

		it("should validate feasible constraints", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const validation = validateSchedulingConstraints(constraints);

			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it("should detect insufficient available days", () => {
			const invalidConfig: PlanConfiguration = {
				...sampleConfig,
				trainingDaysPerWeek: 6,
				restDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], // Only 2 days available
			};

			const constraints = createSchedulingConstraints(invalidConfig);
			const validation = validateSchedulingConstraints(constraints);

			expect(validation.isValid).toBe(false);
			expect(validation.errors[0]).toContain("Not enough available days");
		});

		it("should detect long run day conflict with rest days", () => {
			const conflictConfig: PlanConfiguration = {
				...sampleConfig,
				longRunDay: "Monday", // Monday is also a rest day
				restDays: ["Monday", "Friday"],
			};

			const constraints = createSchedulingConstraints(conflictConfig);
			const validation = validateSchedulingConstraints(constraints);

			expect(validation.isValid).toBe(false);
			expect(validation.errors[0]).toContain(
				"Long run day (Monday) conflicts with rest day",
			);
		});

		it("should warn about consecutive rest days", () => {
			const consecutiveRestConfig: PlanConfiguration = {
				...sampleConfig,
				restDays: ["Monday", "Tuesday"], // Consecutive rest days
			};

			const constraints = createSchedulingConstraints(consecutiveRestConfig);
			const validation = validateSchedulingConstraints(constraints);

			expect(validation.isValid).toBe(true);
			expect(validation.warnings[0]).toContain("Consecutive rest days");
		});

		it("should warn about training 7 days per week", () => {
			const sevenDayConfig: PlanConfiguration = {
				...sampleConfig,
				trainingDaysPerWeek: 7,
				restDays: [],
			};

			const constraints = createSchedulingConstraints(sevenDayConfig);
			const validation = validateSchedulingConstraints(constraints);

			expect(validation.warnings[0]).toContain(
				"Training 7 days per week increases injury risk",
			);
		});
	});

	describe("Day Calculation Utilities", () => {
		it("should calculate days between correctly", () => {
			// Monday (0) to Wednesday (2) = 2 days
			expect(calculateDaysBetween(0, 2)).toBe(2);

			// Wednesday (2) to Monday (0) = 2 days (going backwards)
			expect(calculateDaysBetween(2, 0)).toBe(2);

			// Sunday (6) to Tuesday (1) = 2 days (wrap around)
			expect(calculateDaysBetween(6, 1)).toBe(2);

			// Same day should be 0
			expect(calculateDaysBetween(3, 3)).toBe(0);
		});
	});

	describe("Weekly Workout Scheduling", () => {
		it("should successfully schedule workouts for a valid configuration", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(true);
			expect(result.scheduledWeek).toBeDefined();
			expect(result.errors).toHaveLength(0);
		});

		it("should place long run on specified day", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(true);
			const sundayWorkout = result.scheduledWeek?.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Sunday",
			);

			expect(sundayWorkout?.workout?.type).toBe("long");
			expect(sundayWorkout?.isRestDay).toBe(false);
		});

		it("should respect rest day preferences", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(true);
			const mondayWorkout = result.scheduledWeek?.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Monday",
			);
			const fridayWorkout = result.scheduledWeek?.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Friday",
			);

			expect(mondayWorkout?.isRestDay).toBe(true);
			expect(fridayWorkout?.isRestDay).toBe(true);
		});

		it("should schedule quality workout with rotation", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(true);
			expect(result.scheduledWeek?.qualityWorkoutRotation.qualityType).toBe(
				"tempo",
			);

			// Find the quality workout in the schedule
			const qualityWorkout = result.scheduledWeek?.dailyWorkouts.find(
				(day) => day.workout?.type === "quality",
			);

			expect(qualityWorkout).toBeDefined();
			expect(qualityWorkout?.workout?.description).toContain("Tempo Run");
		});

		it("should distribute easy workouts across remaining days", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(true);

			// Count easy workouts
			const easyWorkouts = result.scheduledWeek?.dailyWorkouts.filter(
				(day) => day.workout?.type === "easy",
			);

			expect(easyWorkouts?.length).toBe(2); // Two easy workouts from sample
		});

		it("should fail with invalid constraints", () => {
			const invalidConfig: PlanConfiguration = {
				...sampleConfig,
				trainingDaysPerWeek: 6,
				restDays: [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
				],
			};

			const constraints = createSchedulingConstraints(invalidConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should provide scheduling notes", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);

			expect(result.success).toBe(true);
			expect(result.scheduledWeek?.schedulingNotes.length).toBeGreaterThan(0);
			expect(result.scheduledWeek?.schedulingNotes[0]).toContain(
				"Long run scheduled on Sunday",
			);
		});
	});

	describe("Quality Workout Schedule Generation", () => {
		it("should generate schedule for multiple weeks", () => {
			const schedule = getQualityWorkoutSchedule(1, 10);

			expect(schedule).toHaveLength(10);
			expect(schedule[0].qualityType).toBe("tempo");
			expect(schedule[1].qualityType).toBe("threshold");
			expect(schedule[2].qualityType).toBe("intervals");
			expect(schedule[3].qualityType).toBe("hills");
			expect(schedule[4].qualityType).toBe("fartlek");
			expect(schedule[5].qualityType).toBe("tempo"); // Cycle repeats
			expect(schedule[6].qualityType).toBe("threshold");
			expect(schedule[7].qualityType).toBe("intervals");
			expect(schedule[8].qualityType).toBe("hills");
			expect(schedule[9].qualityType).toBe("fartlek");
		});

		it("should provide next workout type correctly", () => {
			expect(getNextQualityWorkoutType(1)).toBe("threshold");
			expect(getNextQualityWorkoutType(2)).toBe("intervals");
			expect(getNextQualityWorkoutType(3)).toBe("hills");
			expect(getNextQualityWorkoutType(4)).toBe("fartlek");
			expect(getNextQualityWorkoutType(5)).toBe("tempo");
			expect(getNextQualityWorkoutType(6)).toBe("threshold");
		});
	});

	describe("Phase-Specific Workout Enhancement", () => {
		it("should enhance quality workouts with phase-specific details", () => {
			const constraints = createSchedulingConstraints(sampleConfig);

			// Test different phases
			const baseResult = scheduleWeeklyWorkouts(
				1,
				constraints,
				sampleWorkouts,
				"base",
			);
			const buildResult = scheduleWeeklyWorkouts(
				2,
				constraints,
				sampleWorkouts,
				"build",
			);

			expect(baseResult.success).toBe(true);
			expect(buildResult.success).toBe(true);

			const baseQuality = baseResult.scheduledWeek?.dailyWorkouts.find(
				(day) => day.workout?.type === "quality",
			);
			const buildQuality = buildResult.scheduledWeek?.dailyWorkouts.find(
				(day) => day.workout?.type === "quality",
			);

			// Descriptions should be different for different phases
			// Week 1 = tempo, Week 2 = threshold due to rotation
			expect(baseQuality?.workout?.description).toContain("Tempo Run");
			expect(buildQuality?.workout?.description).toContain(
				"Threshold Intervals",
			);
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should handle empty workout list", () => {
			const constraints = createSchedulingConstraints(sampleConfig);
			const result = scheduleWeeklyWorkouts(1, constraints, [], "base");

			// Should fail because we can't schedule the required training days with no workouts
			expect(result.success).toBe(false);
			expect(result.errors[0]).toContain(
				"Scheduled 0 training days, expected 4",
			);
		});

		it("should handle configuration with no rest days", () => {
			const noRestConfig: PlanConfiguration = {
				...sampleConfig,
				trainingDaysPerWeek: 7, // 7 training days with no rest days
				restDays: [],
			};

			// Create enough workouts for 7 training days
			const sevenDayWorkouts = [
				...sampleWorkouts, // 4 workouts
				{
					type: "easy" as const,
					workout: { ...sampleWorkouts[0].workout, description: "Easy run 3" },
				},
				{
					type: "easy" as const,
					workout: { ...sampleWorkouts[0].workout, description: "Easy run 4" },
				},
				{
					type: "easy" as const,
					workout: { ...sampleWorkouts[0].workout, description: "Easy run 5" },
				},
			];

			const constraints = createSchedulingConstraints(noRestConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				sevenDayWorkouts,
				"base",
			);

			expect(result.success).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0); // Should warn about 7 days per week
		});

		it("should handle long run day being the only available day", () => {
			const limitedConfig: PlanConfiguration = {
				...sampleConfig,
				trainingDaysPerWeek: 1,
				restDays: [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
				],
				longRunDay: "Sunday",
			};

			const constraints = createSchedulingConstraints(limitedConfig);
			const result = scheduleWeeklyWorkouts(
				1,
				constraints,
				[sampleWorkouts[2]],
				"base",
			); // Only long run workout

			expect(result.success).toBe(true);
			const sundayWorkout = result.scheduledWeek?.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Sunday",
			);
			expect(sundayWorkout?.workout?.type).toBe("long");
		});
	});
});
