/**
 * Simple demonstration of the workout distribution algorithm
 * Shows key features and outputs for different configurations
 */

import { describe, expect, it } from "vitest";
import type { PlanConfiguration } from "@/types/configuration";
import { useWorkoutDistribution } from "../useWorkoutDistribution";

describe("Workout Distribution Demo", () => {
	const {
		createWeeklyDistribution,
		getRaceDistanceScaling,
		calculateWorkoutDistances,
	} = useWorkoutDistribution();

	it("should demonstrate basic workout distribution for 10K plan", () => {
		const config: PlanConfiguration = {
			raceDistance: "10K",
			programLength: 12,
			trainingDaysPerWeek: 4,
			restDays: ["Monday", "Friday"] as PlanConfiguration["restDays"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		const weeklyVolumeKm = 35; // 35 km per week
		const distribution = createWeeklyDistribution(config, weeklyVolumeKm);

		// Verify basic structure
		expect(distribution.totalWorkouts).toBe(4);
		expect(distribution.workoutCounts.rest).toBe(3);
		expect(distribution.workoutCounts.long).toBe(1);
		expect(distribution.workoutCounts.quality).toBe(1);
		expect(distribution.workoutCounts.easy).toBe(2);

		// Verify long run placement
		const sundayWorkout = distribution.dailyWorkouts.find(
			(day) => day.dayOfWeek === "Sunday",
		);
		expect(sundayWorkout?.workout?.type).toBe("long");

		// Verify rest days
		const mondayWorkout = distribution.dailyWorkouts.find(
			(day) => day.dayOfWeek === "Monday",
		);
		const fridayWorkout = distribution.dailyWorkouts.find(
			(day) => day.dayOfWeek === "Friday",
		);
		expect(mondayWorkout?.isRestDay).toBe(true);
		expect(fridayWorkout?.isRestDay).toBe(true);

		console.log("\n=== 10K Training Plan (4 days/week, 35km) ===");
		distribution.dailyWorkouts.forEach((day) => {
			if (day.isRestDay) {
				console.log(`${day.dayOfWeek}: REST`);
			} else if (day.workout) {
				console.log(
					`${day.dayOfWeek}: ${day.workout.type.toUpperCase()} - ${day.workout.distance} km`,
				);
			}
		});
	});

	it("should demonstrate race distance scaling differences", () => {
		const _baseConfig: PlanConfiguration = {
			raceDistance: "5K",
			programLength: 12,
			trainingDaysPerWeek: 4,
			restDays: ["Monday", "Friday"] as PlanConfiguration["restDays"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		const weeklyVolume = 30;

		console.log(
			"\n=== Race Distance Scaling Comparison (30km weekly volume) ===",
		);

		(["5K", "10K", "Half Marathon", "Marathon"] as const).forEach(
			(raceDistance) => {
				const scaling = getRaceDistanceScaling(raceDistance);
				const distances = calculateWorkoutDistances(
					raceDistance,
					weeklyVolume,
					4,
				);

				// Add assertions to verify scaling works correctly
				expect(scaling.raceDistance).toBe(raceDistance);
				expect(distances.easy).toBeGreaterThan(0);
				expect(distances.long).toBeGreaterThan(distances.easy);

				console.log(`\n${raceDistance}:`);
				console.log(`  Base multiplier: ${scaling.baseDistanceMultiplier}x`);
				console.log(`  Long run multiplier: ${scaling.longRunMultiplier}x`);
				console.log(`  Easy run: ${distances.easy} km`);
				console.log(`  Long run: ${distances.long} km`);
				console.log(`  Quality: ${distances.quality} km`);
			},
		);
	});

	it("should demonstrate different training frequencies", () => {
		const baseConfig: PlanConfiguration = {
			raceDistance: "10K",
			programLength: 12,
			trainingDaysPerWeek: 4,
			restDays: ["Monday"] as PlanConfiguration["restDays"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		const weeklyVolume = 35;

		console.log("\n=== Training Frequency Comparison (10K, 35km weekly) ===");

		[3, 4, 5, 6, 7].forEach((trainingDays) => {
			const config = {
				...baseConfig,
				trainingDaysPerWeek: trainingDays,
				restDays: (trainingDays === 7
					? []
					: ["Monday"]) as PlanConfiguration["restDays"],
			};

			const distribution = createWeeklyDistribution(config, weeklyVolume);

			// Add assertions to verify distribution works correctly
			expect(distribution.totalWorkouts).toBe(trainingDays);
			expect(distribution.workoutCounts.long).toBe(1); // Always one long run
			expect(distribution.workoutCounts.quality).toBe(1); // Always one quality workout

			console.log(`\n${trainingDays} days/week:`);
			console.log(`  Easy runs: ${distribution.workoutCounts.easy}`);
			console.log(`  Long runs: ${distribution.workoutCounts.long}`);
			console.log(`  Quality: ${distribution.workoutCounts.quality}`);
			console.log(`  Rest days: ${distribution.workoutCounts.rest}`);
		});
	});

	it("should demonstrate metric unit consistency", () => {
		const config: PlanConfiguration = {
			raceDistance: "Half Marathon",
			programLength: 12,
			trainingDaysPerWeek: 5,
			restDays: ["Monday", "Thursday"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		const distribution = createWeeklyDistribution(config, 50); // 50 km weekly volume

		console.log(
			"\n=== Metric Unit Consistency (Half Marathon, 50km weekly) ===",
		);

		const workouts = distribution.dailyWorkouts
			.filter((day) => !day.isRestDay && day.workout)
			.map((day) => day.workout!);

		workouts.forEach((workout) => {
			console.log(
				`${workout.type.toUpperCase()}: ${workout.distance} km (${workout.duration} min)`,
			);
			console.log(`  Description: ${workout.description}`);

			// Verify all distances are reasonable for kilometers
			expect(workout.distance).toBeGreaterThan(2);
			expect(workout.distance).toBeLessThan(35);
			expect(workout.description).toContain("km");
		});

		const totalDistance = workouts.reduce(
			(sum, w) => sum + (w.distance || 0),
			0,
		);
		console.log(`\nTotal weekly distance: ${Math.round(totalDistance)} km`);
		console.log(
			`Average workout distance: ${Math.round(totalDistance / workouts.length)} km`,
		);
	});
});
