import { describe, it, expect } from "vitest";
import { usePhasePeriodization } from "../usePhasePeriodization";
import { useWorkoutDistribution } from "../useWorkoutDistribution";
import { useProgressionRules } from "../useProgressionRules";
import type { PlanConfiguration } from "@/types/configuration";

describe("Phase Periodization Integration", () => {
	const { calculatePhasePeriodization, getPhaseForWeek } =
		usePhasePeriodization();
	const {
		createWeeklyDistribution,
		adjustDistributionForPhase,
		getPhaseWorkoutRecommendations,
	} = useWorkoutDistribution();
	const { calculateWeeklyVolumes } = useProgressionRules();

	const mockConfig: PlanConfiguration = {
		raceDistance: "Half Marathon",
		programLength: 12,
		trainingDaysPerWeek: 5,
		restDays: ["Monday", "Thursday"],
		longRunDay: "Sunday",
		deloadFrequency: 4,
		userExperience: "intermediate",
		difficulty: "moderate",
		paceMethod: "recentRace",
		paceData: {
			method: "recentRace",
			inputData: { distance: "10K", time: 2400 }, // 40 minutes
			calculatedPaces: {
				recovery: { minPace: 360, maxPace: 390, targetPace: 375 },
				easy: { minPace: 330, maxPace: 360, targetPace: 345 },
				marathon: { minPace: 300, maxPace: 315, targetPace: 307 },
				threshold: { minPace: 285, maxPace: 300, targetPace: 292 },
				interval: { minPace: 270, maxPace: 285, targetPace: 277 },
				repetition: { minPace: 255, maxPace: 270, targetPace: 262 },
			},
		},
	};

	describe("Full Training Plan Integration", () => {
		it("should create a complete periodized training plan", () => {
			// Calculate phase periodization
			const periodization = calculatePhasePeriodization(
				mockConfig.programLength,
				mockConfig.raceDistance,
			);

			// Calculate weekly volumes
			const weeklyVolumes = calculateWeeklyVolumes({
				raceDistance: mockConfig.raceDistance,
				programLength: mockConfig.programLength,
				trainingDaysPerWeek: mockConfig.trainingDaysPerWeek,
				deloadFrequency: mockConfig.deloadFrequency,
				userExperience: mockConfig.userExperience,
			});

			// Create weekly distributions for each week
			const weeklyPlans = [];

			for (let week = 1; week <= mockConfig.programLength; week++) {
				const phase = getPhaseForWeek(week, periodization);
				const weeklyVolume = weeklyVolumes.find((v) => v.weekNumber === week);

				expect(weeklyVolume).toBeDefined();
				expect(phase).toMatch(/^(base|build|peak|taper)$/);

				// Create base distribution
				const baseDistribution = createWeeklyDistribution(
					mockConfig,
					weeklyVolume?.adjustedVolume,
					phase,
				);

				// Adjust for phase characteristics
				const phaseAdjustedDistribution = adjustDistributionForPhase(
					baseDistribution,
					phase,
				);

				weeklyPlans.push({
					week,
					phase,
					volume: weeklyVolume?.adjustedVolume,
					distribution: phaseAdjustedDistribution,
				});
			}

			expect(weeklyPlans).toHaveLength(mockConfig.programLength);

			// Verify phase progression
			const phases = weeklyPlans.map((p) => p.phase);
			expect(phases[0]).toBe("base"); // First week should be base
			expect(phases[phases.length - 1]).toBe("taper"); // Last week should be taper

			// Verify each week has proper workout distribution
			weeklyPlans.forEach((weekPlan) => {
				expect(weekPlan.distribution.totalWorkouts).toBe(
					mockConfig.trainingDaysPerWeek,
				);
				expect(weekPlan.distribution.workoutCounts.rest).toBe(
					mockConfig.restDays.length,
				);
				expect(weekPlan.distribution.workoutCounts.long).toBe(1); // Should have one long run
			});
		});

		it("should show different workout characteristics across phases", () => {
			calculatePhasePeriodization(16, "Marathon");

			// Get recommendations for each phase
			const baseRecommendations = getPhaseWorkoutRecommendations("base");
			const buildRecommendations = getPhaseWorkoutRecommendations("build");
			const peakRecommendations = getPhaseWorkoutRecommendations("peak");
			const taperRecommendations = getPhaseWorkoutRecommendations("taper");

			// Base phase should emphasize volume and aerobic development
			expect(baseRecommendations.volumeGuidance).toContain("high volume");
			expect(baseRecommendations.intensityGuidance).toContain("low intensity");
			expect(baseRecommendations.emphasis).toContain(
				"Aerobic enzyme development",
			);

			// Build phase should emphasize intensity
			expect(buildRecommendations.intensityGuidance).toContain(
				"high intensity",
			);
			expect(buildRecommendations.emphasis).toContain(
				"Lactate threshold improvement",
			);

			// Peak phase should focus on race specificity
			expect(peakRecommendations.emphasis).toContain("Race-specific fitness");

			// Taper phase should emphasize recovery
			expect(taperRecommendations.volumeGuidance).toContain("low volume");
			expect(taperRecommendations.emphasis).toContain("Fatigue dissipation");
		});

		it("should properly distribute phases across different program lengths", () => {
			const programLengths = [8, 12, 16, 20];

			programLengths.forEach((weeks) => {
				const periodization = calculatePhasePeriodization(
					weeks,
					"Half Marathon",
				);

				// Should always have all 4 phases
				expect(periodization.phases).toHaveLength(4);

				// Base phase should be substantial for longer programs
				const basePhase = periodization.phases.find((p) => p.phase === "base")!;
				if (weeks >= 12) {
					expect(basePhase.durationWeeks).toBeGreaterThanOrEqual(3);
				}

				// Taper should be present but not too long
				const taperPhase = periodization.phases.find(
					(p) => p.phase === "taper",
				)!;
				expect(taperPhase.durationWeeks).toBeGreaterThanOrEqual(1);
				expect(taperPhase.durationWeeks).toBeLessThanOrEqual(
					Math.max(3, Math.floor(weeks * 0.2)),
				);
			});
		});

		it("should adapt phase characteristics for different race distances", () => {
			const raceDistances = ["5K", "10K", "Half Marathon", "Marathon"] as const;

			raceDistances.forEach((distance) => {
				const periodization = calculatePhasePeriodization(12, distance);

				const basePhase = periodization.phases.find((p) => p.phase === "base")!;
				const buildPhase = periodization.phases.find(
					(p) => p.phase === "build",
				)!;

				if (distance === "Marathon") {
					// Marathon should have longer base phase
					expect(basePhase.percentage).toBeGreaterThan(40);
				} else if (distance === "5K") {
					// 5K should have more build phase for speed development
					expect(buildPhase.percentage).toBeGreaterThan(35);
				}
			});
		});
	});

	describe("Phase Transition Integration", () => {
		it("should provide smooth transitions between phases", () => {
			const periodization = calculatePhasePeriodization(12, "10K");

			// Check each transition
			periodization.phaseTransitions.forEach((transition) => {
				expect(transition.adjustments).toBeInstanceOf(Array);
				expect(transition.adjustments.length).toBeGreaterThan(0);
				expect(transition.warnings).toBeInstanceOf(Array);

				// Transition week should be the start of the next phase
				const nextPhase = periodization.phases.find(
					(p) => p.phase === transition.toPhase,
				)!;
				expect(transition.transitionWeek).toBe(nextPhase.startWeek);
			});
		});

		it("should provide appropriate guidance for each transition", () => {
			const periodization = calculatePhasePeriodization(16, "Marathon");

			const baseToBuild = periodization.phaseTransitions.find(
				(t) => t.fromPhase === "base" && t.toPhase === "build",
			)!;

			expect(
				baseToBuild.adjustments.some(
					(adj) => adj.includes("tempo") || adj.includes("intervals"),
				),
			).toBe(true);

			const peakToTaper = periodization.phaseTransitions.find(
				(t) => t.fromPhase === "peak" && t.toPhase === "taper",
			)!;

			expect(
				peakToTaper.adjustments.some((adj) =>
					adj.includes("Reduce training volume"),
				),
			).toBe(true);
		});
	});

	describe("Workout Distribution Phase Integration", () => {
		it("should adjust workout descriptions based on phase", () => {
			const baseDistribution = createWeeklyDistribution(mockConfig, 40, "base");
			const buildDistribution = createWeeklyDistribution(
				mockConfig,
				45,
				"build",
			);

			const baseAdjusted = adjustDistributionForPhase(baseDistribution, "base");
			const buildAdjusted = adjustDistributionForPhase(
				buildDistribution,
				"build",
			);

			// Find quality workouts in each phase
			const baseQualityWorkout = baseAdjusted.dailyWorkouts.find(
				(day) => !day.isRestDay && day.workout?.type === "quality",
			);
			const buildQualityWorkout = buildAdjusted.dailyWorkouts.find(
				(day) => !day.isRestDay && day.workout?.type === "quality",
			);

			if (baseQualityWorkout?.workout && buildQualityWorkout?.workout) {
				// Base phase quality should mention tempo/aerobic development
				expect(baseQualityWorkout.workout.description).toContain("Tempo");
				expect(baseQualityWorkout.workout.description).toContain("Aerobic");

				// Build phase quality should mention intervals/lactate threshold
				expect(buildQualityWorkout.workout.description).toContain("Interval");
				expect(buildQualityWorkout.workout.description).toContain("Lactate");
			}
		});

		it("should include phase information in workout notes", () => {
			const distribution = createWeeklyDistribution(mockConfig, 40, "peak");
			const adjusted = adjustDistributionForPhase(distribution, "peak");

			// Should have phase-specific notes
			const workoutDays = adjusted.dailyWorkouts.filter(
				(day) => !day.isRestDay,
			);
			workoutDays.forEach((day) => {
				expect(day.notes).toContain("Peak phase");
				expect(day.notes).toContain("Race-specific");
			});
		});
	});

	describe("Volume and Phase Coordination", () => {
		it("should coordinate volume progression with phase characteristics", () => {
			const periodization = calculatePhasePeriodization(16, "Marathon");
			const volumes = calculateWeeklyVolumes({
				raceDistance: "Marathon",
				programLength: 16,
				trainingDaysPerWeek: 5,
				deloadFrequency: 4,
				userExperience: "intermediate",
			});

			// Check that taper phase has reduced volume
			const taperPhase = periodization.phases.find((p) => p.phase === "taper")!;
			const taperWeeks = volumes.filter(
				(v) =>
					v.weekNumber >= taperPhase.startWeek &&
					v.weekNumber <= taperPhase.endWeek,
			);

			// Taper weeks should generally have lower volume than peak weeks
			const peakPhase = periodization.phases.find((p) => p.phase === "peak")!;
			const peakWeeks = volumes.filter(
				(v) =>
					v.weekNumber >= peakPhase.startWeek &&
					v.weekNumber <= peakPhase.endWeek,
			);

			if (taperWeeks.length > 0 && peakWeeks.length > 0) {
				const avgTaperVolume =
					taperWeeks.reduce((sum, w) => sum + w.adjustedVolume, 0) /
					taperWeeks.length;
				const avgPeakVolume =
					peakWeeks.reduce((sum, w) => sum + w.adjustedVolume, 0) /
					peakWeeks.length;

				expect(avgTaperVolume).toBeLessThan(avgPeakVolume);
			}
		});
	});
});
