import { beforeEach, describe, expect, it } from "vitest";
import type { PlanConfiguration } from "@/types/configuration";
import { usePlanGenerator } from "../usePlanGenerator";

describe("usePlanGenerator", () => {
	let planGenerator: ReturnType<typeof usePlanGenerator>;

	beforeEach(() => {
		planGenerator = usePlanGenerator();
	});

	describe("generatePlan", () => {
		it("should generate a complete training plan for 5K race", () => {
			const config: PlanConfiguration = {
				raceDistance: "5K",
				programLength: 8,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();
			expect(result.plan!.weeks).toHaveLength(8);
			expect(result.plan!.configuration).toEqual(config);
			expect(result.plan!.metadata).toBeDefined();
		});

		it("should generate a complete training plan for Marathon race", () => {
			const config: PlanConfiguration = {
				raceDistance: "Marathon",
				programLength: 16,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Friday"],
				longRunDay: "Saturday",
				deloadFrequency: 3,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();
			expect(result.plan!.weeks).toHaveLength(16);
			expect(result.plan!.configuration).toEqual(config);
		});

		it("should fail with invalid configuration", () => {
			const config: PlanConfiguration = {
				raceDistance: "5K",
				programLength: 2, // Too short
				trainingDaysPerWeek: 8, // Too many
				restDays: ["Monday"],
				longRunDay: "Monday", // Conflicts with rest day
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(false);
			expect(result.plan).toBeNull();
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should return validation result when validateOnly is true", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 10,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config, { validateOnly: true });

			expect(result.success).toBe(true);
			expect(result.plan).toBeNull();
			expect(result.validationResult).toBeDefined();
		});

		it("should skip deload weeks when option is set", () => {
			const config: PlanConfiguration = {
				raceDistance: "Half Marathon",
				programLength: 12,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config, {
				skipDeloadWeeks: true,
			});

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			// Check that no weeks are marked as deload weeks
			const deloadWeeks = result.plan!.weeks.filter(
				(week) => week.isDeloadWeek,
			);
			expect(deloadWeeks).toHaveLength(0);
		});
	});

	describe("validateConfiguration", () => {
		it("should validate a correct configuration", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 10,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.validateConfiguration(config);

			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should identify configuration errors", () => {
			const config: PlanConfiguration = {
				raceDistance: "Marathon",
				programLength: 4, // Too short for marathon
				trainingDaysPerWeek: 2, // Too few training days
				restDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
				longRunDay: "Monday", // Conflicts with rest day
				deloadFrequency: 4,
			};

			const result = planGenerator.validateConfiguration(config);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe("plan structure validation", () => {
		it("should create plans with proper weekly structure", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 8,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			// Check each week has 7 days
			result.plan!.weeks.forEach((week) => {
				expect(week.days).toHaveLength(7);

				// Check training days count
				const trainingDays = week.days.filter((day) => !day.isRestDay);
				expect(trainingDays).toHaveLength(config.trainingDaysPerWeek);

				// Check rest days are respected
				config.restDays.forEach((restDay) => {
					const dayPlan = week.days.find((day) => day.dayOfWeek === restDay);
					expect(dayPlan?.isRestDay).toBe(true);
				});

				// Check long run is on specified day
				const longRunDay = week.days.find(
					(day) => day.dayOfWeek === config.longRunDay,
				);
				if (longRunDay && !longRunDay.isRestDay) {
					expect(longRunDay.workout?.type).toBe("long");
				}
			});
		});

		it("should include proper training phases", () => {
			const config: PlanConfiguration = {
				raceDistance: "Half Marathon",
				programLength: 12,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			// Check that all training phases are represented
			const phases = result.plan!.weeks.map((week) => week.phase);
			const uniquePhases = [...new Set(phases)];

			expect(uniquePhases).toContain("base");
			expect(uniquePhases).toContain("build");
			expect(uniquePhases).toContain("peak");
			expect(uniquePhases).toContain("taper");
		});

		it("should apply deload weeks correctly", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 12,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			// Check for deload weeks (should be weeks 4, 8, 12 with frequency 4)
			const deloadWeeks = result.plan!.weeks.filter(
				(week) => week.isDeloadWeek,
			);
			expect(deloadWeeks.length).toBeGreaterThan(0);

			// Deload weeks should have reduced volume
			deloadWeeks.forEach((deloadWeek) => {
				const regularWeeks = result.plan!.weeks.filter(
					(week) => !week.isDeloadWeek && week.phase === deloadWeek.phase,
				);

				if (regularWeeks.length > 0) {
					const avgRegularVolume =
						regularWeeks.reduce((sum, week) => sum + week.weeklyVolumeKm, 0) /
						regularWeeks.length;

					expect(deloadWeek.weeklyVolumeKm).toBeLessThan(avgRegularVolume);
				}
			});
		});
	});

	describe("plan metadata", () => {
		it("should calculate correct plan metadata", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 8,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			const metadata = result.plan!.metadata;

			expect(metadata.totalKilometers).toBeGreaterThan(0);
			expect(metadata.totalMiles).toBeGreaterThan(0);
			expect(metadata.totalWorkouts).toBeGreaterThan(0);
			expect(metadata.totalTrainingDays).toBe(
				config.trainingDaysPerWeek * config.programLength,
			);
			expect(metadata.totalRestDays).toBe(
				config.restDays.length * config.programLength,
			);
			expect(metadata.createdAt).toBeInstanceOf(Date);
			expect(metadata.lastModified).toBeInstanceOf(Date);
			expect(metadata.estimatedTimeCommitment).toBeGreaterThan(0);
			expect(metadata.workoutTypeDistribution).toBeDefined();
			expect(metadata.phaseDistribution).toBeDefined();
			expect(metadata.version).toBe("1.0.0");
		});

		it("should calculate workout type distribution correctly", () => {
			const config: PlanConfiguration = {
				raceDistance: "5K",
				programLength: 8,
				trainingDaysPerWeek: 4,
				restDays: ["Monday", "Wednesday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			const distribution = result.plan!.metadata.workoutTypeDistribution;

			expect(distribution.easy).toBeGreaterThan(0);
			expect(distribution.long).toBeGreaterThan(0);
			expect(distribution.quality).toBeGreaterThan(0);
			expect(distribution.rest).toBeGreaterThan(0);

			// Total should equal total days in plan
			const total =
				distribution.easy +
				distribution.long +
				distribution.quality +
				distribution.rest;
			expect(total).toBe(config.programLength * 7);
		});
	});

	describe("progressive overload validation", () => {
		it("should follow 10% rule for volume increases", () => {
			const config: PlanConfiguration = {
				raceDistance: "Half Marathon",
				programLength: 12,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			// Check volume progression follows 10% rule
			for (let i = 1; i < result.plan!.weeks.length; i++) {
				const currentWeek = result.plan!.weeks[i]!;
				const previousWeek = result.plan!.weeks[i - 1]!;

				// Skip deload weeks and weeks following deload weeks
				if (currentWeek.isDeloadWeek || previousWeek.isDeloadWeek) {
					continue;
				}

				const increase =
					(currentWeek.weeklyVolumeKm - previousWeek.weeklyVolumeKm) /
					previousWeek.weeklyVolumeKm;

				// Allow for some rounding tolerance
				expect(increase).toBeLessThanOrEqual(0.12); // 12% with tolerance
			}
		});
	});

	describe("80/20 rule validation", () => {
		it("should maintain approximately 80/20 easy/hard distribution", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 10,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Friday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const result = planGenerator.generatePlan(config);

			expect(result.success).toBe(true);
			expect(result.plan).toBeDefined();

			const distribution = result.plan!.metadata.workoutTypeDistribution;
			const totalWorkouts =
				distribution.easy + distribution.long + distribution.quality;

			const easyPercentage =
				((distribution.easy + distribution.long) / totalWorkouts) * 100;
			const qualityPercentage = (distribution.quality / totalWorkouts) * 100;

			// Allow some tolerance for the 80/20 rule
			expect(easyPercentage).toBeGreaterThanOrEqual(75); // At least 75% easy
			expect(qualityPercentage).toBeLessThanOrEqual(25); // At most 25% quality
		});
	});
});
