import { describe, expect, it } from "vitest";
import type { RaceDistance } from "@/types/configuration";
import { usePhasePeriodization } from "../usePhasePeriodization";

describe("usePhasePeriodization", () => {
	const {
		calculatePhasePeriodization,
		getPhaseForWeek,
		getPhaseConfiguration,
		getPhaseCharacteristics,
		validatePhasePeriodization,
		getPhaseRecommendations,
		PHASE_DISTRIBUTION_BY_RACE,
		MINIMUM_PHASE_DURATIONS,
	} = usePhasePeriodization();

	describe("calculatePhasePeriodization", () => {
		it("should create proper phase distribution for 5K race", () => {
			const periodization = calculatePhasePeriodization(8, "5K");

			expect(periodization.totalWeeks).toBe(8);
			expect(periodization.raceDistance).toBe("5K");
			expect(periodization.phases).toHaveLength(4);

			// Check phase order
			expect(periodization.phases[0].phase).toBe("base");
			expect(periodization.phases[1].phase).toBe("build");
			expect(periodization.phases[2].phase).toBe("peak");
			expect(periodization.phases[3].phase).toBe("taper");

			// Check week continuity
			expect(periodization.phases[0].startWeek).toBe(1);
			expect(periodization.phases[3].endWeek).toBe(8);
		});

		it("should create proper phase distribution for Marathon", () => {
			const periodization = calculatePhasePeriodization(16, "Marathon");

			expect(periodization.totalWeeks).toBe(16);
			expect(periodization.raceDistance).toBe("Marathon");

			// Marathon should have longer base phase
			const basePhase = periodization.phases.find((p) => p.phase === "base");
			const buildPhase = periodization.phases.find((p) => p.phase === "build");

			expect(basePhase?.durationWeeks).toBeGreaterThan(
				buildPhase?.durationWeeks || 0,
			);
			expect(basePhase?.percentage).toBeGreaterThan(40); // Should be around 45%
		});

		it("should respect minimum phase durations when possible", () => {
			const periodization = calculatePhasePeriodization(12, "5K"); // Adequate length program

			for (const phase of periodization.phases) {
				const minDuration = MINIMUM_PHASE_DURATIONS[phase.phase];
				expect(phase.durationWeeks).toBeGreaterThanOrEqual(minDuration);
			}
		});

		it("should handle very short programs gracefully", () => {
			const periodization = calculatePhasePeriodization(4, "5K"); // Very short program

			// Should still have all 4 phases
			expect(periodization.phases).toHaveLength(4);

			// Each phase should have at least 1 week
			for (const phase of periodization.phases) {
				expect(phase.durationWeeks).toBeGreaterThanOrEqual(1);
			}

			// Total should still match
			const totalPhaseWeeks = periodization.phases.reduce(
				(sum, phase) => sum + phase.durationWeeks,
				0,
			);
			expect(totalPhaseWeeks).toBe(4);
		});

		it("should ensure all weeks are accounted for", () => {
			const totalWeeks = 12;
			const periodization = calculatePhasePeriodization(
				totalWeeks,
				"Half Marathon",
			);

			const totalPhaseWeeks = periodization.phases.reduce(
				(sum, phase) => sum + phase.durationWeeks,
				0,
			);

			expect(totalPhaseWeeks).toBe(totalWeeks);

			// Check continuity
			for (let i = 0; i < periodization.phases.length - 1; i++) {
				const currentPhase = periodization.phases[i];
				const nextPhase = periodization.phases[i + 1];
				expect(nextPhase.startWeek).toBe(currentPhase.endWeek + 1);
			}
		});

		it("should create phase transitions", () => {
			const periodization = calculatePhasePeriodization(12, "10K");

			expect(periodization.phaseTransitions).toHaveLength(3);

			// Check transition sequence
			expect(periodization.phaseTransitions[0].fromPhase).toBe("base");
			expect(periodization.phaseTransitions[0].toPhase).toBe("build");
			expect(periodization.phaseTransitions[1].fromPhase).toBe("build");
			expect(periodization.phaseTransitions[1].toPhase).toBe("peak");
			expect(periodization.phaseTransitions[2].fromPhase).toBe("peak");
			expect(periodization.phaseTransitions[2].toPhase).toBe("taper");
		});
	});

	describe("getPhaseForWeek", () => {
		it("should correctly identify phase for each week", () => {
			const periodization = calculatePhasePeriodization(12, "Half Marathon");

			// Test first week (should be base)
			expect(getPhaseForWeek(1, periodization)).toBe("base");

			// Test last week (should be taper)
			expect(getPhaseForWeek(12, periodization)).toBe("taper");

			// Test all weeks are assigned to a phase
			for (let week = 1; week <= 12; week++) {
				const phase = getPhaseForWeek(week, periodization);
				expect(["base", "build", "peak", "taper"]).toContain(phase);
			}
		});

		it("should handle edge cases", () => {
			const periodization = calculatePhasePeriodization(8, "5K");

			// Test boundary weeks
			const basePhase = periodization.phases.find((p) => p.phase === "base")!;
			const buildPhase = periodization.phases.find((p) => p.phase === "build")!;

			expect(getPhaseForWeek(basePhase.endWeek, periodization)).toBe("base");
			expect(getPhaseForWeek(buildPhase.startWeek, periodization)).toBe(
				"build",
			);
		});
	});

	describe("getPhaseConfiguration", () => {
		it("should return correct phase configuration", () => {
			const periodization = calculatePhasePeriodization(12, "10K");

			const baseConfig = getPhaseConfiguration("base", periodization);
			expect(baseConfig).toBeDefined();
			expect(baseConfig?.phase).toBe("base");
			expect(baseConfig?.focus).toContain("Aerobic");

			const taperConfig = getPhaseConfiguration("taper", periodization);
			expect(taperConfig).toBeDefined();
			expect(taperConfig?.phase).toBe("taper");
			expect(taperConfig?.focus).toContain("Recovery");
		});

		it("should return undefined for non-existent phase", () => {
			const periodization = calculatePhasePeriodization(12, "10K");

			// This shouldn't happen in practice, but test the edge case
			const config = getPhaseConfiguration("base", {
				...periodization,
				phases: periodization.phases.filter((p) => p.phase !== "base"),
			});

			expect(config).toBeUndefined();
		});
	});

	describe("getPhaseCharacteristics", () => {
		it("should return characteristics for all phases", () => {
			const phases: Array<"base" | "build" | "peak" | "taper"> = [
				"base",
				"build",
				"peak",
				"taper",
			];

			phases.forEach((phase) => {
				const characteristics = getPhaseCharacteristics(phase);

				expect(characteristics).toBeDefined();
				expect(characteristics.volumeEmphasis).toMatch(/^(low|moderate|high)$/);
				expect(characteristics.intensityEmphasis).toMatch(
					/^(low|moderate|high)$/,
				);
				expect(characteristics.recoveryEmphasis).toMatch(
					/^(low|moderate|high)$/,
				);
				expect(characteristics.workoutTypes).toBeInstanceOf(Array);
				expect(characteristics.primaryAdaptations).toBeInstanceOf(Array);
				expect(characteristics.keyMetrics).toBeInstanceOf(Array);
			});
		});

		it("should have appropriate characteristics for each phase", () => {
			// Base phase should emphasize volume and recovery
			const baseChar = getPhaseCharacteristics("base");
			expect(baseChar.volumeEmphasis).toBe("high");
			expect(baseChar.intensityEmphasis).toBe("low");
			expect(baseChar.recoveryEmphasis).toBe("high");

			// Build phase should emphasize intensity
			const buildChar = getPhaseCharacteristics("build");
			expect(buildChar.intensityEmphasis).toBe("high");

			// Taper phase should emphasize recovery
			const taperChar = getPhaseCharacteristics("taper");
			expect(taperChar.volumeEmphasis).toBe("low");
			expect(taperChar.recoveryEmphasis).toBe("high");
		});
	});

	describe("validatePhasePeriodization", () => {
		it("should validate proper periodization", () => {
			const periodization = calculatePhasePeriodization(12, "Half Marathon");
			const validation = validatePhasePeriodization(periodization);

			expect(validation.isValid).toBe(true);
			expect(validation.warnings).toHaveLength(0);
		});

		it("should detect short phases", () => {
			const periodization = calculatePhasePeriodization(6, "Marathon"); // Very short for marathon
			const validation = validatePhasePeriodization(periodization);

			// Should have warnings about short phases
			expect(validation.warnings.length).toBeGreaterThan(0);
			expect(
				validation.warnings.some((w) => w.includes("shorter than recommended")),
			).toBe(true);
		});

		it("should detect very short programs", () => {
			const periodization = calculatePhasePeriodization(4, "5K");
			const validation = validatePhasePeriodization(periodization);

			expect(validation.warnings.some((w) => w.includes("too short"))).toBe(
				true,
			);
			expect(validation.recommendations.length).toBeGreaterThan(0);
		});

		it("should detect inadequate base phase", () => {
			// Create a periodization with artificially short base phase
			const periodization = calculatePhasePeriodization(12, "Marathon");

			// Artificially modify base phase to be very short
			const basePhase = periodization.phases.find((p) => p.phase === "base")!;
			basePhase.percentage = 20; // Less than 25%

			const validation = validatePhasePeriodization(periodization);

			expect(
				validation.warnings.some((w) =>
					w.includes("Base phase may be too short"),
				),
			).toBe(true);
		});
	});

	describe("getPhaseRecommendations", () => {
		it("should provide recommendations for each race distance", () => {
			const raceDistances: RaceDistance[] = [
				"5K",
				"10K",
				"Half Marathon",
				"Marathon",
			];

			raceDistances.forEach((distance) => {
				const recommendations = getPhaseRecommendations(distance, 12);

				expect(recommendations.recommendations).toBeInstanceOf(Array);
				expect(recommendations.optimalWeeks).toBeGreaterThan(0);
				expect(recommendations.phaseAdjustments).toBeInstanceOf(Array);
			});
		});

		it("should recommend longer programs for longer races", () => {
			const fiveKRec = getPhaseRecommendations("5K", 12);
			const marathonRec = getPhaseRecommendations("Marathon", 12);

			expect(marathonRec.optimalWeeks).toBeGreaterThan(fiveKRec.optimalWeeks);
		});

		it("should provide adjustments for short programs", () => {
			const shortMarathon = getPhaseRecommendations("Marathon", 8); // Short for marathon

			expect(shortMarathon.phaseAdjustments.length).toBeGreaterThan(0);
			expect(
				shortMarathon.phaseAdjustments.some(
					(adj) => adj.includes("base") || adj.includes("Extend"),
				),
			).toBe(true);
		});
	});

	describe("phase distribution constants", () => {
		it("should have valid phase distributions", () => {
			Object.entries(PHASE_DISTRIBUTION_BY_RACE).forEach(([, distribution]) => {
				const total =
					distribution.base +
					distribution.build +
					distribution.peak +
					distribution.taper;
				expect(total).toBeCloseTo(1.0, 2); // Should sum to 1.0 (100%)

				// All percentages should be positive
				expect(distribution.base).toBeGreaterThan(0);
				expect(distribution.build).toBeGreaterThan(0);
				expect(distribution.peak).toBeGreaterThan(0);
				expect(distribution.taper).toBeGreaterThan(0);
			});
		});

		it("should have appropriate distributions for race distances", () => {
			// Marathon should have highest base percentage
			expect(PHASE_DISTRIBUTION_BY_RACE.Marathon.base).toBeGreaterThan(
				PHASE_DISTRIBUTION_BY_RACE["5K"].base,
			);

			// 5K should have higher build percentage than Marathon
			expect(PHASE_DISTRIBUTION_BY_RACE["5K"].build).toBeGreaterThan(
				PHASE_DISTRIBUTION_BY_RACE.Marathon.build,
			);
		});
	});

	describe("minimum phase durations", () => {
		it("should have reasonable minimum durations", () => {
			expect(MINIMUM_PHASE_DURATIONS.base).toBeGreaterThanOrEqual(2);
			expect(MINIMUM_PHASE_DURATIONS.build).toBeGreaterThanOrEqual(2);
			expect(MINIMUM_PHASE_DURATIONS.peak).toBeGreaterThanOrEqual(1);
			expect(MINIMUM_PHASE_DURATIONS.taper).toBeGreaterThanOrEqual(1);
		});
	});

	describe("integration with different program lengths", () => {
		it("should handle various program lengths correctly", () => {
			const programLengths = [6, 8, 10, 12, 16, 20, 24];

			programLengths.forEach((weeks) => {
				const periodization = calculatePhasePeriodization(
					weeks,
					"Half Marathon",
				);

				// Should always have 4 phases
				expect(periodization.phases).toHaveLength(4);

				// Total weeks should match
				const totalPhaseWeeks = periodization.phases.reduce(
					(sum, phase) => sum + phase.durationWeeks,
					0,
				);
				expect(totalPhaseWeeks).toBe(weeks);

				// Should have at least 1 week per phase for very short programs
				// or respect minimum durations for adequate length programs
				const totalMinWeeks = Object.values(MINIMUM_PHASE_DURATIONS).reduce(
					(sum, w) => sum + w,
					0,
				);

				periodization.phases.forEach((phase) => {
					if (weeks >= totalMinWeeks) {
						const minDuration = MINIMUM_PHASE_DURATIONS[phase.phase];
						expect(phase.durationWeeks).toBeGreaterThanOrEqual(minDuration);
					} else {
						// For very short programs, just ensure at least 1 week
						expect(phase.durationWeeks).toBeGreaterThanOrEqual(1);
					}
				});
			});
		});
	});
});
