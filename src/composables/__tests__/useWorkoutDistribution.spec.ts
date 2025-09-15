import { describe, it, expect } from "vitest";
import { useWorkoutDistribution } from "../useWorkoutDistribution";
import type { PlanConfiguration } from "@/types/configuration";

describe("useWorkoutDistribution", () => {
	const {
		getDistributionTemplate,
		getRaceDistanceScaling,
		calculateWorkoutDistances,
		createWeeklyDistribution,
		validateWorkoutDistribution,
		getAvailableTemplates,
		getAllRaceDistanceScaling,
	} = useWorkoutDistribution();

	describe("getDistributionTemplate", () => {
		it("should return correct template for 3 training days", () => {
			const template = getDistributionTemplate(3);

			expect(template.trainingDays).toBe(3);
			expect(template.workoutPattern).toEqual(["easy", "quality", "long"]);
			expect(template.description).toContain("3 days");
			expect(template.restDayPattern).toHaveLength(4); // 4 rest days for 3 training days
		});

		it("should return correct template for 5 training days", () => {
			const template = getDistributionTemplate(5);

			expect(template.trainingDays).toBe(5);
			expect(template.workoutPattern).toEqual([
				"easy",
				"quality",
				"easy",
				"easy",
				"long",
			]);
			expect(template.restDayPattern).toHaveLength(2); // 2 rest days for 5 training days
		});

		it("should return correct template for 7 training days", () => {
			const template = getDistributionTemplate(7);

			expect(template.trainingDays).toBe(7);
			expect(template.workoutPattern).toHaveLength(7);
			expect(template.restDayPattern).toHaveLength(0); // No rest days for 7 training days
		});

		it("should throw error for invalid training days", () => {
			expect(() => getDistributionTemplate(2)).toThrow(
				"Invalid training days per week: 2",
			);
			expect(() => getDistributionTemplate(8)).toThrow(
				"Invalid training days per week: 8",
			);
		});
	});

	describe("getRaceDistanceScaling", () => {
		it("should return correct scaling for 5K", () => {
			const scaling = getRaceDistanceScaling("5K");

			expect(scaling.raceDistance).toBe("5K");
			expect(scaling.baseDistanceMultiplier).toBe(1.0);
			expect(scaling.longRunMultiplier).toBe(2.0);
			expect(scaling.weeklyVolumeBase).toBe(25);
		});

		it("should return correct scaling for Marathon", () => {
			const scaling = getRaceDistanceScaling("Marathon");

			expect(scaling.raceDistance).toBe("Marathon");
			expect(scaling.baseDistanceMultiplier).toBe(2.0);
			expect(scaling.longRunMultiplier).toBe(3.0);
			expect(scaling.weeklyVolumeBase).toBe(60);
		});

		it("should have progressive scaling from 5K to Marathon", () => {
			const distances = ["5K", "10K", "Half Marathon", "Marathon"] as const;
			const scalings = distances.map((d) => getRaceDistanceScaling(d));

			// Base distance multipliers should increase
			for (let i = 1; i < scalings.length; i++) {
				expect(scalings[i].baseDistanceMultiplier).toBeGreaterThan(
					scalings[i - 1].baseDistanceMultiplier,
				);
			}

			// Weekly volume bases should increase
			for (let i = 1; i < scalings.length; i++) {
				expect(scalings[i].weeklyVolumeBase).toBeGreaterThan(
					scalings[i - 1].weeklyVolumeBase,
				);
			}
		});
	});

	describe("calculateWorkoutDistances", () => {
		it("should calculate distances in kilometers", () => {
			const distances = calculateWorkoutDistances("5K", 30, 4);

			// All distances should be in kilometers (reasonable values)
			expect(distances.easy).toBeGreaterThan(0);
			expect(distances.easy).toBeLessThan(15); // Reasonable easy run distance
			expect(distances.long).toBeGreaterThan(distances.easy);
			expect(distances.quality).toBeGreaterThan(0);
			expect(distances.rest).toBe(0);
		});

		it("should enforce minimum distances", () => {
			const distances = calculateWorkoutDistances("5K", 10, 7); // Very low weekly volume

			expect(distances.easy).toBeGreaterThanOrEqual(3.0); // Minimum 3km
			expect(distances.long).toBeGreaterThanOrEqual(8.0); // Minimum 8km
			expect(distances.quality).toBeGreaterThanOrEqual(4.0); // Minimum 4km
		});

		it("should scale distances appropriately for different race distances", () => {
			const fiveKDistances = calculateWorkoutDistances("5K", 30, 4);
			const marathonDistances = calculateWorkoutDistances("Marathon", 60, 4);

			// Marathon distances should be longer than 5K distances
			expect(marathonDistances.easy).toBeGreaterThan(fiveKDistances.easy);
			expect(marathonDistances.long).toBeGreaterThan(fiveKDistances.long);
			expect(marathonDistances.quality).toBeGreaterThan(fiveKDistances.quality);
		});

		it("should round distances to one decimal place", () => {
			const distances = calculateWorkoutDistances("10K", 35, 5);

			Object.values(distances).forEach((distance) => {
				if (distance > 0) {
					// Check that the distance has at most 1 decimal place
					const decimalPlaces = (distance.toString().split(".")[1] || "")
						.length;
					expect(decimalPlaces).toBeLessThanOrEqual(1);
				}
			});
		});
	});

	describe("createWeeklyDistribution", () => {
		const mockConfig: PlanConfiguration = {
			raceDistance: "10K",
			programLength: 12,
			trainingDaysPerWeek: 4,
			restDays: ["Monday", "Friday"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		it("should create correct weekly distribution", () => {
			const distribution = createWeeklyDistribution(mockConfig, 35);

			expect(distribution.totalWorkouts).toBe(4);
			expect(distribution.dailyWorkouts).toHaveLength(7); // All 7 days of week

			// Should have correct workout counts
			expect(distribution.workoutCounts.rest).toBe(3); // 7 - 4 training days
			expect(distribution.workoutCounts.long).toBe(1); // One long run
			expect(distribution.workoutCounts.quality).toBe(1); // One quality workout
			expect(distribution.workoutCounts.easy).toBe(2); // Remaining should be easy
		});

		it("should place long run on specified day", () => {
			const distribution = createWeeklyDistribution(mockConfig, 35);

			const sundayWorkout = distribution.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Sunday",
			);
			expect(sundayWorkout).toBeDefined();
			expect(sundayWorkout?.isRestDay).toBe(false);
			expect(sundayWorkout?.workout?.type).toBe("long");
		});

		it("should respect rest days", () => {
			const distribution = createWeeklyDistribution(mockConfig, 35);

			const mondayWorkout = distribution.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Monday",
			);
			const fridayWorkout = distribution.dailyWorkouts.find(
				(day) => day.dayOfWeek === "Friday",
			);

			expect(mondayWorkout?.isRestDay).toBe(true);
			expect(fridayWorkout?.isRestDay).toBe(true);
		});

		it("should create workouts with metric distances", () => {
			const distribution = createWeeklyDistribution(mockConfig, 35);

			const workouts = distribution.dailyWorkouts
				.filter((day) => !day.isRestDay && day.workout)
				.map((day) => day.workout!);

			workouts.forEach((workout) => {
				expect(workout.distance).toBeGreaterThan(0);
				expect(workout.distance).toBeLessThan(30); // Reasonable max distance in km
				expect(workout.duration).toBeGreaterThan(0);
				expect(workout.description).toContain("km"); // Should mention kilometers
			});
		});

		it("should handle different training day frequencies", () => {
			const configs = [3, 4, 5, 6, 7].map((days) => ({
				...mockConfig,
				trainingDaysPerWeek: days,
				restDays: days === 7 ? [] : ["Monday"], // Adjust rest days
			}));

			configs.forEach((config) => {
				const distribution = createWeeklyDistribution(config, 35);

				expect(distribution.totalWorkouts).toBe(config.trainingDaysPerWeek);
				expect(distribution.workoutCounts.rest).toBe(
					7 - config.trainingDaysPerWeek,
				);

				// Should always have exactly one long run
				expect(distribution.workoutCounts.long).toBe(1);

				// Should have at least one quality workout (except for 3-day plans might vary)
				if (config.trainingDaysPerWeek >= 4) {
					expect(distribution.workoutCounts.quality).toBeGreaterThanOrEqual(1);
				}
			});
		});
	});

	describe("validateWorkoutDistribution", () => {
		it("should validate a good distribution", () => {
			const goodDistribution = {
				totalWorkouts: 5,
				workoutCounts: {
					easy: 3,
					long: 1,
					quality: 1,
					rest: 2,
				},
				dailyWorkouts: [], // Not used in validation
			};

			const validation = validateWorkoutDistribution(goodDistribution);

			expect(validation.isValid).toBe(true);
			expect(validation.warnings).toHaveLength(0);
		});

		it("should warn about insufficient training frequency", () => {
			const lowFrequencyDistribution = {
				totalWorkouts: 2,
				workoutCounts: {
					easy: 1,
					long: 1,
					quality: 0,
					rest: 5,
				},
				dailyWorkouts: [],
			};

			const validation = validateWorkoutDistribution(lowFrequencyDistribution);

			expect(validation.isValid).toBe(false);
			expect(validation.warnings).toContain(
				"Less than 3 training days per week may limit training effectiveness",
			);
		});

		it("should warn about too many quality workouts", () => {
			const highQualityDistribution = {
				totalWorkouts: 6,
				workoutCounts: {
					easy: 2,
					long: 1,
					quality: 3,
					rest: 1,
				},
				dailyWorkouts: [],
			};

			const validation = validateWorkoutDistribution(highQualityDistribution);

			expect(validation.warnings).toContain(
				"More than 2 quality workouts per week may increase injury risk",
			);
			expect(validation.recommendations).toContain(
				"Limit quality workouts to 1-2 per week for optimal recovery",
			);
		});

		it("should warn about missing long run", () => {
			const noLongRunDistribution = {
				totalWorkouts: 4,
				workoutCounts: {
					easy: 3,
					long: 0,
					quality: 1,
					rest: 3,
				},
				dailyWorkouts: [],
			};

			const validation = validateWorkoutDistribution(noLongRunDistribution);

			expect(validation.isValid).toBe(false);
			expect(validation.warnings).toContain(
				"No long run scheduled - important for endurance development",
			);
		});

		it("should warn about no rest days", () => {
			const noRestDistribution = {
				totalWorkouts: 7,
				workoutCounts: {
					easy: 5,
					long: 1,
					quality: 1,
					rest: 0,
				},
				dailyWorkouts: [],
			};

			const validation = validateWorkoutDistribution(noRestDistribution);

			expect(validation.warnings).toContain(
				"No rest days scheduled - recovery is essential for adaptation",
			);
			expect(validation.recommendations).toContain(
				"Include at least 1 rest day per week",
			);
		});

		it("should warn about insufficient easy running", () => {
			const lowEasyDistribution = {
				totalWorkouts: 6,
				workoutCounts: {
					easy: 2, // Only 33% easy runs (should be ~60%+)
					long: 1,
					quality: 3,
					rest: 1,
				},
				dailyWorkouts: [],
			};

			const validation = validateWorkoutDistribution(lowEasyDistribution);

			expect(validation.warnings).toContain(
				"Consider more easy runs to follow the 80/20 training principle",
			);
		});
	});

	describe("getAvailableTemplates", () => {
		it("should return all templates", () => {
			const templates = getAvailableTemplates();

			expect(templates).toHaveLength(5); // 3, 4, 5, 6, 7 day templates

			templates.forEach((template) => {
				expect(template.trainingDays).toBeGreaterThanOrEqual(3);
				expect(template.trainingDays).toBeLessThanOrEqual(7);
				expect(template.workoutPattern).toHaveLength(template.trainingDays);
				expect(template.description).toBeTruthy();
			});
		});
	});

	describe("getAllRaceDistanceScaling", () => {
		it("should return all race distance scalings", () => {
			const scalings = getAllRaceDistanceScaling();

			expect(Object.keys(scalings)).toEqual([
				"5K",
				"10K",
				"Half Marathon",
				"Marathon",
			]);

			Object.values(scalings).forEach((scaling) => {
				expect(scaling.baseDistanceMultiplier).toBeGreaterThan(0);
				expect(scaling.longRunMultiplier).toBeGreaterThan(
					scaling.baseDistanceMultiplier,
				);
				expect(scaling.qualityDistanceMultiplier).toBeGreaterThan(0);
				expect(scaling.weeklyVolumeBase).toBeGreaterThan(0);
			});
		});
	});

	describe("metric unit consistency", () => {
		it("should use kilometers for all distance calculations", () => {
			const config: PlanConfiguration = {
				raceDistance: "Half Marathon",
				programLength: 12,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Thursday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const distribution = createWeeklyDistribution(config, 50); // 50 km weekly volume

			const workouts = distribution.dailyWorkouts
				.filter((day) => !day.isRestDay && day.workout)
				.map((day) => day.workout!);

			workouts.forEach((workout) => {
				// All distances should be reasonable for kilometers (not miles)
				expect(workout.distance).toBeGreaterThan(2); // Minimum reasonable km distance
				expect(workout.distance).toBeLessThan(35); // Maximum reasonable km distance for single workout

				// Descriptions should mention kilometers
				expect(workout.description).toContain("km");
			});
		});

		it("should calculate durations based on metric distances", () => {
			const distances = calculateWorkoutDistances("10K", 40, 4);

			// Duration calculations should be reasonable for km distances
			// Easy run of ~8km should take ~48 minutes at 6 min/km pace
			const easyRunDuration = distances.easy * 6; // Approximate duration
			expect(easyRunDuration).toBeGreaterThan(20); // At least 20 minutes
			expect(easyRunDuration).toBeLessThan(90); // Less than 90 minutes for easy run
		});
	});

	describe("workout type distribution", () => {
		it("should follow mostly easy runs principle", () => {
			const config: PlanConfiguration = {
				raceDistance: "10K",
				programLength: 12,
				trainingDaysPerWeek: 5,
				restDays: ["Monday", "Thursday"],
				longRunDay: "Sunday",
				deloadFrequency: 4,
			};

			const distribution = createWeeklyDistribution(config, 35);

			// Should have more easy runs than quality workouts
			expect(distribution.workoutCounts.easy).toBeGreaterThan(
				distribution.workoutCounts.quality,
			);

			// Should have exactly one long run
			expect(distribution.workoutCounts.long).toBe(1);

			// Easy runs should be the majority of training runs
			const trainingRuns =
				distribution.workoutCounts.easy +
				distribution.workoutCounts.quality +
				distribution.workoutCounts.long;
			expect(distribution.workoutCounts.easy / trainingRuns).toBeGreaterThan(
				0.5,
			);
		});

		it("should include one quality workout per week", () => {
			[3, 4, 5, 6, 7].forEach((trainingDays) => {
				const config: PlanConfiguration = {
					raceDistance: "10K",
					programLength: 12,
					trainingDaysPerWeek: trainingDays,
					restDays: trainingDays === 7 ? [] : ["Monday"],
					longRunDay: "Sunday",
					deloadFrequency: 4,
				};

				const distribution = createWeeklyDistribution(config, 35);

				// Should have exactly one quality workout per week
				expect(distribution.workoutCounts.quality).toBe(1);
			});
		});
	});
});
