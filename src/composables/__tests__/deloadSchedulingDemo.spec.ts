import { describe, expect, it } from "vitest";
import type { PlanConfiguration } from "@/types/configuration";
import { useDeloadScheduling } from "../useDeloadScheduling";

describe("Deload Scheduling Demo", () => {
	const deloadScheduling = useDeloadScheduling();

	it("should demonstrate deload scheduling for a 16-week marathon plan", () => {
		const config: PlanConfiguration = {
			raceDistance: "Marathon",
			programLength: 16,
			trainingDaysPerWeek: 5,
			restDays: ["Monday", "Friday"],
			longRunDay: "Sunday",
			deloadFrequency: 3, // More frequent for marathon
		};

		const result = deloadScheduling.scheduleDeloadWeeks(config);

		console.log("\n=== 16-Week Marathon Training Plan - Deload Schedule ===");
		console.log(`Total deload weeks: ${result.totalDeloadWeeks}`);
		console.log(
			`Deload weeks: ${result.deloadWeeks.map((d) => d.weekNumber).join(", ")}`,
		);

		result.deloadWeeks.forEach((deload) => {
			console.log(`\nWeek ${deload.weekNumber}:`);
			console.log(
				`  - Volume reduction: ${Math.round(deload.volumeReduction * 100)}%`,
			);
			console.log(
				`  - Phase conflicts: ${deload.phaseConflicts.length > 0 ? deload.phaseConflicts.join("; ") : "None"}`,
			);
			console.log(`  - Notes: ${deload.schedulingNotes.join("; ")}`);
		});

		if (result.phaseConflicts.length > 0) {
			console.log("\n=== Phase Conflicts ===");
			result.phaseConflicts.forEach((conflict) => {
				console.log(
					`Week ${conflict.weekNumber} (${conflict.phase}): ${conflict.severity} - ${conflict.recommendation}`,
				);
			});
		}

		if (result.warnings.length > 0) {
			console.log("\n=== Warnings ===");
			result.warnings.forEach((warning) => console.log(`- ${warning}`));
		}

		if (result.recommendations.length > 0) {
			console.log("\n=== Recommendations ===");
			result.recommendations.forEach((rec) => console.log(`- ${rec}`));
		}

		// Verify expected deload weeks for 3-week frequency
		expect(result.deloadWeeks.map((d) => d.weekNumber)).toEqual([
			3, 6, 9, 12, 15,
		]);
		expect(result.totalDeloadWeeks).toBe(5);
	});

	it("should demonstrate deload scheduling for a 12-week half marathon plan", () => {
		const config: PlanConfiguration = {
			raceDistance: "Half Marathon",
			programLength: 12,
			trainingDaysPerWeek: 4,
			restDays: ["Monday", "Friday"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		const result = deloadScheduling.scheduleDeloadWeeks(config);

		console.log(
			"\n=== 12-Week Half Marathon Training Plan - Deload Schedule ===",
		);
		console.log(`Total deload weeks: ${result.totalDeloadWeeks}`);
		console.log(
			`Deload weeks: ${result.deloadWeeks.map((d) => d.weekNumber).join(", ")}`,
		);

		// Get recommendations
		const recommendations = deloadScheduling.getDeloadRecommendations(config);
		console.log(
			`\nOptimal frequency: Every ${recommendations.optimalFrequency} weeks`,
		);
		console.log(
			`Expected deload weeks: ${recommendations.expectedDeloadWeeks.join(", ")}`,
		);
		console.log(
			`Volume reduction guidance: ${recommendations.volumeReductionGuidance}`,
		);

		console.log("\n=== Phase Considerations ===");
		recommendations.phaseConsiderations.forEach((consideration) => {
			console.log(`- ${consideration}`);
		});

		// Verify expected deload weeks for 4-week frequency
		expect(result.deloadWeeks.map((d) => d.weekNumber)).toEqual([4, 8, 12]);
		expect(result.totalDeloadWeeks).toBe(3);
	});

	it("should demonstrate workout modifications during deload week", () => {
		const mockWorkouts = [
			{
				type: "easy" as const,
				workout: {
					type: "easy" as const,
					duration: 45,
					distance: 8,
					intensity: "zone2" as const,
					description: "Easy run",
					paceGuidance: "Conversational pace",
					recoveryTime: 0,
				},
			},
			{
				type: "long" as const,
				workout: {
					type: "long" as const,
					duration: 90,
					distance: 16,
					intensity: "zone2" as const,
					description: "Long run",
					paceGuidance: "Easy pace",
					recoveryTime: 24,
				},
			},
			{
				type: "quality" as const,
				workout: {
					type: "quality" as const,
					duration: 60,
					distance: 10,
					intensity: "zone4" as const,
					description: "Tempo run",
					paceGuidance: "Comfortably hard",
					recoveryTime: 48,
				},
			},
		];

		const modifications = deloadScheduling.modifyWorkoutsForDeload(
			mockWorkouts,
			"base",
			0.25, // 25% volume reduction
		);

		console.log("\n=== Deload Week Workout Modifications ===");
		modifications.forEach((mod) => {
			console.log(`\n${mod.originalWorkout.type.toUpperCase()} WORKOUT:`);
			console.log(
				`  Original: ${mod.originalWorkout.distance}km, ${mod.originalWorkout.duration}min`,
			);

			if (mod.modificationType === "skip") {
				console.log(`  Modified: SKIPPED`);
			} else {
				console.log(
					`  Modified: ${mod.modifiedWorkout.distance}km, ${mod.modifiedWorkout.duration}min`,
				);
				console.log(`  Reduction: ${Math.round(mod.reductionAmount * 100)}%`);
			}

			console.log(`  Rationale: ${mod.rationale}`);
		});

		// Verify modifications were applied
		expect(modifications).toHaveLength(3);
		modifications.forEach((mod) => {
			if (mod.modificationType !== "skip") {
				expect(mod.modifiedWorkout.duration).toBeLessThan(
					mod.originalWorkout.duration,
				);
				if (mod.originalWorkout.distance) {
					expect(mod.modifiedWorkout.distance).toBeLessThan(
						mod.originalWorkout.distance,
					);
				}
			}
		});
	});

	it("should demonstrate phase conflict detection", () => {
		const config: PlanConfiguration = {
			raceDistance: "10K",
			programLength: 8,
			trainingDaysPerWeek: 5,
			restDays: ["Monday"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};

		const result = deloadScheduling.scheduleDeloadWeeks(config);

		console.log("\n=== 8-Week 10K Training Plan - Phase Conflict Analysis ===");
		console.log(`Program length: ${config.programLength} weeks`);
		console.log(`Deload frequency: Every ${config.deloadFrequency} weeks`);
		console.log(
			`Scheduled deload weeks: ${result.deloadWeeks.map((d) => d.weekNumber).join(", ")}`,
		);

		if (result.phaseConflicts.length > 0) {
			console.log("\n=== Detected Phase Conflicts ===");
			result.phaseConflicts.forEach((conflict) => {
				console.log(`Week ${conflict.weekNumber}:`);
				console.log(`  Phase: ${conflict.phase}`);
				console.log(`  Conflict: ${conflict.conflictType}`);
				console.log(`  Severity: ${conflict.severity}`);
				console.log(`  Recommendation: ${conflict.recommendation}`);
			});
		} else {
			console.log("\n✓ No phase conflicts detected");
		}

		console.log(`\nOverall success: ${result.success ? "✓" : "⚠️"}`);

		if (result.warnings.length > 0) {
			console.log("\nWarnings:");
			result.warnings.forEach((warning) => console.log(`- ${warning}`));
		}

		// Verify deload week was scheduled
		expect(result.deloadWeeks).toHaveLength(2); // Weeks 4 and 8
		expect(result.deloadWeeks.map((d) => d.weekNumber)).toEqual([4, 8]);
	});
});
