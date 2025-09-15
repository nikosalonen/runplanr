import { beforeEach, describe, expect, it } from "vitest";
import type { PlanConfiguration } from "@/types/configuration";
import type { WeeklyPlan } from "@/types/trainingPlan";
import type { Workout, WorkoutType } from "@/types/workout";
import { useDeloadScheduling } from "../useDeloadScheduling";

describe("useDeloadScheduling", () => {
	let deloadScheduling: ReturnType<typeof useDeloadScheduling>;
	let mockConfig: PlanConfiguration;

	beforeEach(() => {
		deloadScheduling = useDeloadScheduling();
		mockConfig = {
			raceDistance: "Half Marathon",
			programLength: 12,
			trainingDaysPerWeek: 4,
			restDays: ["Monday", "Friday"],
			longRunDay: "Sunday",
			deloadFrequency: 4,
		};
	});

	describe("scheduleDeloadWeeks", () => {
		it("should schedule deload weeks at correct intervals", () => {
			const result = deloadScheduling.scheduleDeloadWeeks(mockConfig);

			// Success might be false due to taper phase conflict in week 12
			expect(result.deloadWeeks).toHaveLength(3); // Weeks 4, 8, and 12 for 12-week program with 4-week frequency
			expect(result.deloadWeeks[0]?.weekNumber).toBe(4);
			expect(result.deloadWeeks[1]?.weekNumber).toBe(8);
			expect(result.deloadWeeks[2]?.weekNumber).toBe(12);
		});

		it("should schedule more frequent deloads with 3-week frequency", () => {
			const config = { ...mockConfig, deloadFrequency: 3 as const };
			const result = deloadScheduling.scheduleDeloadWeeks(config);

			expect(result.deloadWeeks).toHaveLength(4); // Weeks 3, 6, 9, 12 for 12-week program
			expect(result.deloadWeeks.map((d) => d.weekNumber)).toEqual([3, 6, 9, 12]);
		});

		it("should identify phase conflicts during peak phase", () => {
			// 16-week program where deload might conflict with peak phase
			const config = {
				...mockConfig,
				programLength: 16,
				raceDistance: "Marathon" as const,
			};
			const result = deloadScheduling.scheduleDeloadWeeks(config);

			// Should have some phase conflicts or warnings
			expect(
				result.phaseConflicts.length + result.warnings.length,
			).toBeGreaterThan(0);
		});

		it("should provide appropriate warnings for low deload frequency", () => {
			const config = { ...mockConfig, programLength: 24 }; // Long program with standard frequency
			const result = deloadScheduling.scheduleDeloadWeeks(config);

			// Should suggest more frequent deloads for very long programs
			expect(
				result.warnings.length + result.recommendations.length,
			).toBeGreaterThan(0);
		});

		it("should handle short programs appropriately", () => {
			const config = { ...mockConfig, programLength: 6 };
			const result = deloadScheduling.scheduleDeloadWeeks(config);

			// Should have at most 1 deload week for 6-week program
			expect(result.deloadWeeks).toHaveLength(1);
			expect(result.deloadWeeks[0]?.weekNumber).toBe(4);
		});
	});

	describe("createDeloadWeekConfiguration", () => {
		it("should create appropriate deload configuration for base phase", () => {
			const config = deloadScheduling.createDeloadWeekConfiguration(
				4,
				"base",
				mockConfig,
			);

			expect(config.weekNumber).toBe(4);
			expect(config.isDeloadWeek).toBe(true);
			expect(config.volumeReduction).toBeGreaterThan(0.15);
			expect(config.volumeReduction).toBeLessThan(0.35);
			expect(config.phaseConflicts).toHaveLength(0); // Base phase allows deloads
		});

		it("should identify conflicts during peak phase", () => {
			const config = deloadScheduling.createDeloadWeekConfiguration(
				10,
				"peak",
				mockConfig,
			);

			expect(config.phaseConflicts.length).toBeGreaterThan(0);
			expect(config.phaseConflicts[0]).toContain("peak");
		});

		it("should identify conflicts during taper phase", () => {
			const config = deloadScheduling.createDeloadWeekConfiguration(
				12,
				"taper",
				mockConfig,
			);

			expect(config.phaseConflicts.length).toBeGreaterThan(0);
			expect(config.phaseConflicts[0]).toContain("taper");
		});

		it("should provide appropriate volume reduction for build phase", () => {
			const config = deloadScheduling.createDeloadWeekConfiguration(
				6,
				"build",
				mockConfig,
			);

			// Build phase should have less aggressive volume reduction
			expect(config.volumeReduction).toBeGreaterThan(0.1);
			expect(config.volumeReduction).toBeLessThan(0.3);
		});
	});

	describe("modifyWorkoutsForDeload", () => {
		let mockWorkouts: { type: WorkoutType; workout: Workout }[];

		beforeEach(() => {
			mockWorkouts = [
				{
					type: "easy",
					workout: {
						type: "easy",
						duration: 45,
						distance: 8,
						intensity: "zone2",
						description: "Easy run",
						paceGuidance: "Conversational pace",
						recoveryTime: 0,
					},
				},
				{
					type: "long",
					workout: {
						type: "long",
						duration: 90,
						distance: 16,
						intensity: "zone2",
						description: "Long run",
						paceGuidance: "Easy pace",
						recoveryTime: 24,
					},
				},
				{
					type: "quality",
					workout: {
						type: "quality",
						duration: 60,
						distance: 10,
						intensity: "zone4",
						description: "Tempo run",
						paceGuidance: "Comfortably hard",
						recoveryTime: 48,
					},
				},
			];
		});

		it("should reduce volume for all workout types", () => {
			const modifications = deloadScheduling.modifyWorkoutsForDeload(
				mockWorkouts,
				"base",
				0.25,
			);

			expect(modifications).toHaveLength(3);

			// Check that all workouts have reduced distance/duration
			modifications.forEach((mod) => {
				if (mod.originalWorkout.distance) {
					expect(mod.modifiedWorkout.distance).toBeLessThan(
						mod.originalWorkout.distance,
					);
				}
				expect(mod.modifiedWorkout.duration).toBeLessThan(
					mod.originalWorkout.duration,
				);
			});
		});

		it("should apply different reduction rates by workout type", () => {
			const modifications = deloadScheduling.modifyWorkoutsForDeload(
				mockWorkouts,
				"base",
				0.25,
			);

			const easyMod = modifications.find(
				(m) => m.originalWorkout.type === "easy",
			);
			const longMod = modifications.find(
				(m) => m.originalWorkout.type === "long",
			);
			const qualityMod = modifications.find(
				(m) => m.originalWorkout.type === "quality",
			);

			// Quality workouts should have the highest reduction
			expect(qualityMod?.reductionAmount).toBeGreaterThan(
				easyMod?.reductionAmount || 0,
			);
			expect(qualityMod?.reductionAmount).toBeGreaterThan(
				longMod?.reductionAmount || 0,
			);
		});

		it("should sometimes skip quality workouts", () => {
			// Run multiple times to test probabilistic skipping
			let skippedCount = 0;
			const iterations = 20;

			for (let i = 0; i < iterations; i++) {
				const modifications = deloadScheduling.modifyWorkoutsForDeload(
					mockWorkouts,
					"base",
					0.25,
				);

				const qualityMod = modifications.find(
					(m) => m.originalWorkout.type === "quality",
				);
				if (qualityMod?.modificationType === "skip") {
					skippedCount++;
				}
			}

			// Should skip some quality workouts (probabilistic, so not exact)
			expect(skippedCount).toBeGreaterThan(0);
			expect(skippedCount).toBeLessThan(iterations); // But not all
		});

		it("should never skip easy or long runs", () => {
			const modifications = deloadScheduling.modifyWorkoutsForDeload(
				mockWorkouts,
				"base",
				0.25,
			);

			const easyMod = modifications.find(
				(m) => m.originalWorkout.type === "easy",
			);
			const longMod = modifications.find(
				(m) => m.originalWorkout.type === "long",
			);

			expect(easyMod?.modificationType).not.toBe("skip");
			expect(longMod?.modificationType).not.toBe("skip");
		});

		it("should add deload prefix to workout descriptions", () => {
			const modifications = deloadScheduling.modifyWorkoutsForDeload(
				mockWorkouts,
				"base",
				0.25,
			);

			modifications.forEach((mod) => {
				if (mod.modificationType !== "skip") {
					expect(mod.modifiedWorkout.description).toContain("DELOAD:");
				}
			});
		});
	});

	describe("checkPhaseConflict", () => {
		it("should detect high-severity conflict in peak phase", () => {
			// Mock periodization data
			const mockPeriodization = {
				totalWeeks: 12,
				raceDistance: "Half Marathon" as const,
				phases: [
					{
						phase: "base" as const,
						startWeek: 1,
						endWeek: 4,
						durationWeeks: 4,
						percentage: 33,
						focus: "Base building",
						characteristics: [],
						workoutEmphasis: [],
					},
					{
						phase: "build" as const,
						startWeek: 5,
						endWeek: 8,
						durationWeeks: 4,
						percentage: 33,
						focus: "Build phase",
						characteristics: [],
						workoutEmphasis: [],
					},
					{
						phase: "peak" as const,
						startWeek: 9,
						endWeek: 11,
						durationWeeks: 3,
						percentage: 25,
						focus: "Peak phase",
						characteristics: [],
						workoutEmphasis: [],
					},
					{
						phase: "taper" as const,
						startWeek: 12,
						endWeek: 12,
						durationWeeks: 1,
						percentage: 8,
						focus: "Taper",
						characteristics: [],
						workoutEmphasis: [],
					},
				],
				phaseTransitions: [],
			};

			const conflict = deloadScheduling.checkPhaseConflict(
				10, // Week in peak phase
				"peak",
				mockPeriodization,
			);

			expect(conflict).not.toBeNull();
			expect(conflict?.severity).toBe("high");
			expect(conflict?.conflictType).toBe("peak_preparation");
		});

		it("should detect medium-severity conflict in critical build weeks", () => {
			const mockPeriodization = {
				totalWeeks: 12,
				raceDistance: "Half Marathon" as const,
				phases: [
					{
						phase: "build" as const,
						startWeek: 5,
						endWeek: 8,
						durationWeeks: 4,
						percentage: 33,
						focus: "Build phase",
						characteristics: [],
						workoutEmphasis: [],
					},
				],
				phaseTransitions: [],
			};

			const conflict = deloadScheduling.checkPhaseConflict(
				5, // First week of build phase (critical)
				"build",
				mockPeriodization,
			);

			expect(conflict).not.toBeNull();
			expect(conflict?.severity).toBe("medium");
			expect(conflict?.conflictType).toBe("critical_build");
		});

		it("should return null for non-conflicting weeks", () => {
			const mockPeriodization = {
				totalWeeks: 12,
				raceDistance: "Half Marathon" as const,
				phases: [
					{
						phase: "base" as const,
						startWeek: 1,
						endWeek: 4,
						durationWeeks: 4,
						percentage: 33,
						focus: "Base building",
						characteristics: [],
						workoutEmphasis: [],
					},
				],
				phaseTransitions: [],
			};

			const conflict = deloadScheduling.checkPhaseConflict(
				3, // Non-critical week in base phase
				"base",
				mockPeriodization,
			);

			expect(conflict).toBeNull();
		});
	});

	describe("applyDeloadToWeeklyPlan", () => {
		let mockWeeklyPlan: WeeklyPlan;
		let mockDeloadConfig: ReturnType<
			typeof deloadScheduling.createDeloadWeekConfiguration
		>;

		beforeEach(() => {
			mockWeeklyPlan = {
				weekNumber: 4,
				phase: "base",
				isDeloadWeek: false,
				days: [],
				weeklyVolume: 30, // miles
				weeklyVolumeKm: 48, // kilometers
				weeklyDuration: 300, // minutes
				workoutCount: 4,
				qualityWorkoutCount: 1,
			};

			mockDeloadConfig = {
				weekNumber: 4,
				isDeloadWeek: true,
				volumeReduction: 0.25,
				workoutModifications: [],
				phaseConflicts: [],
				schedulingNotes: ["Base phase deload for recovery"],
			};
		});

		it("should reduce weekly volume and duration", () => {
			const modifiedPlan = deloadScheduling.applyDeloadToWeeklyPlan(
				mockWeeklyPlan,
				mockDeloadConfig,
			);

			expect(modifiedPlan.weeklyVolume).toBe(23); // 30 * 0.75 = 22.5, rounded to 23
			expect(modifiedPlan.weeklyVolumeKm).toBe(36); // 48 * 0.75 = 36
			expect(modifiedPlan.weeklyDuration).toBeLessThan(
				mockWeeklyPlan.weeklyDuration,
			);
		});

		it("should mark week as deload week", () => {
			const modifiedPlan = deloadScheduling.applyDeloadToWeeklyPlan(
				mockWeeklyPlan,
				mockDeloadConfig,
			);

			expect(modifiedPlan.isDeloadWeek).toBe(true);
			expect(modifiedPlan.weeklyFocus).toContain("Deload Week");
		});

		it("should include deload notes", () => {
			const modifiedPlan = deloadScheduling.applyDeloadToWeeklyPlan(
				mockWeeklyPlan,
				mockDeloadConfig,
			);

			expect(modifiedPlan.notes).toContain("25%"); // Volume reduction percentage
			expect(modifiedPlan.notes).toContain("recovery");
		});
	});

	describe("getDeloadRecommendations", () => {
		it("should recommend 3-week frequency for marathon", () => {
			const config = { ...mockConfig, raceDistance: "Marathon" as const };
			const recommendations = deloadScheduling.getDeloadRecommendations(config);

			expect(recommendations.optimalFrequency).toBe(3);
		});

		it("should recommend 4-week frequency for shorter races", () => {
			const config = { ...mockConfig, raceDistance: "5K" as const };
			const recommendations = deloadScheduling.getDeloadRecommendations(config);

			expect(recommendations.optimalFrequency).toBe(4);
		});

		it("should calculate expected deload weeks correctly", () => {
			const recommendations =
				deloadScheduling.getDeloadRecommendations(mockConfig);

			expect(recommendations.expectedDeloadWeeks).toEqual([4, 8, 12]);
		});

		it("should provide phase considerations", () => {
			const recommendations =
				deloadScheduling.getDeloadRecommendations(mockConfig);

			expect(recommendations.phaseConsiderations).toHaveLength(4);
			expect(
				recommendations.phaseConsiderations.some((c) =>
					c.includes("Base phase"),
				),
			).toBe(true);
			expect(
				recommendations.phaseConsiderations.some((c) =>
					c.includes("Peak phase"),
				),
			).toBe(true);
		});

		it("should provide volume reduction guidance", () => {
			const recommendations =
				deloadScheduling.getDeloadRecommendations(mockConfig);

			expect(recommendations.volumeReductionGuidance).toContain("20-30%");
			expect(recommendations.volumeReductionGuidance).toContain("volume");
		});
	});

	describe("validateDeloadScheduling", () => {
		it("should warn about low deload frequency", () => {
			const deloadWeeks = [
				{
					weekNumber: 8,
					isDeloadWeek: true,
					volumeReduction: 0.25,
					workoutModifications: [],
					phaseConflicts: [],
					schedulingNotes: [],
				},
			];

			const validation = deloadScheduling.validateDeloadScheduling(
				deloadWeeks,
				[],
				{ ...mockConfig, programLength: 16 }, // Long program with few deloads
			);

			expect(
				validation.warnings.some((w) => w.includes("Low deload frequency")),
			).toBe(true);
		});

		it("should warn about high deload frequency", () => {
			const deloadWeeks = Array.from({ length: 4 }, (_, i) => ({
				weekNumber: (i + 1) * 3,
				isDeloadWeek: true,
				volumeReduction: 0.25,
				workoutModifications: [],
				phaseConflicts: [],
				schedulingNotes: [],
			}));

			const validation = deloadScheduling.validateDeloadScheduling(
				deloadWeeks,
				[],
				{ ...mockConfig, programLength: 8 }, // Short program with many deloads
			);

			expect(
				validation.warnings.some((w) => w.includes("High deload frequency")),
			).toBe(true);
		});

		it("should warn about consecutive deload weeks", () => {
			const deloadWeeks = [
				{
					weekNumber: 4,
					isDeloadWeek: true,
					volumeReduction: 0.25,
					workoutModifications: [],
					phaseConflicts: [],
					schedulingNotes: [],
				},
				{
					weekNumber: 5, // Consecutive week
					isDeloadWeek: true,
					volumeReduction: 0.25,
					workoutModifications: [],
					phaseConflicts: [],
					schedulingNotes: [],
				},
			];

			const validation = deloadScheduling.validateDeloadScheduling(
				deloadWeeks,
				[],
				mockConfig,
			);

			expect(
				validation.warnings.some((w) => w.includes("Consecutive deload weeks")),
			).toBe(true);
		});

		it("should provide race-specific recommendations", () => {
			const validation = deloadScheduling.validateDeloadScheduling([], [], {
				...mockConfig,
				raceDistance: "Marathon",
				deloadFrequency: 4,
			});

			expect(
				validation.recommendations.some((r) =>
					r.includes("3-week deload frequency"),
				),
			).toBe(true);
		});
	});
});
