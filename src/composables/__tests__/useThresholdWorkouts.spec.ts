import { describe, it, expect } from "vitest";
import {
	EXTENDED_WORKOUT_TYPES,
	EXTENDED_WORKOUT_TEMPLATES,
	getExtendedWorkoutDefinition,
	getExtendedWorkoutTemplate,
	getQualityWorkoutTypes,
} from "@/constants/workoutTypes";
import { useWorkoutScheduling } from "../useWorkoutScheduling";

describe("Threshold Workout Implementation", () => {
	describe("Threshold Workout Type Definition", () => {
		it("should have threshold defined in extended workout types", () => {
			expect(EXTENDED_WORKOUT_TYPES.threshold).toBeDefined();
		});

		it("should have correct threshold workout properties", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;

			expect(threshold.type).toBe("threshold");
			expect(threshold.name).toBe("Threshold Intervals");
			expect(threshold.description).toContain(
				"Broken lactate threshold efforts",
			);
			expect(threshold.intensity).toBe("zone3");
			expect(threshold.purpose).toContain("Lactate threshold development");
			expect(threshold.category).toBe("quality");
			expect(threshold.recoveryHours).toBe(42);
		});

		it("should have threshold icon and color defined", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;

			expect(threshold.icon).toBe("🎯");
			expect(threshold.color).toBe("#f97316");
		});

		it("should have appropriate recovery time between tempo and intervals", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;
			const tempo = EXTENDED_WORKOUT_TYPES.tempo;
			const intervals = EXTENDED_WORKOUT_TYPES.intervals;

			expect(threshold.recoveryHours).toBeLessThan(intervals.recoveryHours);
			expect(threshold.recoveryHours).toBeLessThan(tempo.recoveryHours);
			expect(threshold.recoveryHours).toBe(42); // Between tempo (48h) and fartlek (36h)
		});
	});

	describe("Threshold Workout Template", () => {
		it("should have threshold template defined", () => {
			expect(EXTENDED_WORKOUT_TEMPLATES.threshold).toBeDefined();
		});

		it("should have appropriate duration and distance ranges", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;

			expect(template.durationRange.min).toBe(30);
			expect(template.durationRange.max).toBe(75);
			expect(template.distanceRange.min).toBe(5);
			expect(template.distanceRange.max).toBe(14);
		});

		it("should have comprehensive instructions and benefits", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;

			expect(template.instructions).toContain("lactate threshold pace");
			expect(template.instructions).toContain("short recovery periods");
			expect(template.instructions).toContain("consistent effort");

			expect(template.benefits).toContain("Improves lactate threshold power");
			expect(template.benefits).toContain(
				"Enhances lactate buffering capacity",
			);
			expect(template.benefits).toContain(
				"Develops threshold pace familiarity",
			);
			expect(template.benefits).toContain(
				"Builds mental resilience at threshold effort",
			);
			expect(template.benefits).toContain(
				"Allows higher volume at threshold pace",
			);
		});

		it("should have workout structure and examples", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;

			expect(template.structure).toContain("Warm-up + Threshold intervals");
			expect(template.examples).toBeDefined();
			expect(template.examples?.length).toBeGreaterThan(0);

			// Check for variety in examples
			const examples = template.examples!;
			expect(examples.some((ex) => ex.includes("8min"))).toBe(true);
			expect(examples.some((ex) => ex.includes("5min"))).toBe(true);
			expect(examples.some((ex) => ex.includes("2km"))).toBe(true);
		});
	});

	describe("Threshold vs Tempo Distinction", () => {
		it("should differentiate threshold intervals from tempo runs", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;
			const tempo = EXTENDED_WORKOUT_TYPES.tempo;

			// Both should be zone3 but serve different purposes
			expect(threshold.intensity).toBe("zone3");
			expect(tempo.intensity).toBe("zone3");

			// Threshold should emphasize interval format
			expect(threshold.description).toContain("Broken");
			expect(threshold.description).toContain("efforts");

			// Tempo should emphasize sustained effort
			expect(tempo.description).toContain("Sustained");

			// Different recovery times
			expect(threshold.recoveryHours).toBeLessThan(tempo.recoveryHours);
		});

		it("should have different training benefits", () => {
			const thresholdTemplate = EXTENDED_WORKOUT_TEMPLATES.threshold;
			const tempoTemplate = EXTENDED_WORKOUT_TEMPLATES.tempo;

			const thresholdBenefits = thresholdTemplate.benefits
				.join(" ")
				.toLowerCase();
			const tempoBenefits = tempoTemplate.benefits.join(" ").toLowerCase();

			// Threshold should emphasize buffering and power
			expect(thresholdBenefits).toContain("buffering");
			expect(thresholdBenefits).toContain("power");
			expect(thresholdBenefits).toContain("higher volume");

			// Tempo should emphasize efficiency and confidence
			expect(tempoBenefits).toContain("efficiency");
			expect(tempoBenefits).toContain("confidence");
		});

		it("should have different workout structures", () => {
			const thresholdTemplate = EXTENDED_WORKOUT_TEMPLATES.threshold;
			const tempoTemplate = EXTENDED_WORKOUT_TEMPLATES.tempo;

			expect(thresholdTemplate.structure).toContain("intervals");
			expect(tempoTemplate.structure).toContain("segment");

			// Threshold examples should show interval format
			const thresholdExamples = thresholdTemplate.examples?.join(" ");
			expect(thresholdExamples).toContain("x");
			expect(thresholdExamples).toContain("recovery");

			// Tempo examples should show continuous format
			const tempoExamples = tempoTemplate.examples?.join(" ");
			expect(tempoExamples).toContain("tempo");
			expect(!tempoExamples.includes(" x ")).toBe(true);
		});
	});

	describe("Helper Functions", () => {
		it("should return threshold definition via helper function", () => {
			const definition = getExtendedWorkoutDefinition("threshold");

			expect(definition.type).toBe("threshold");
			expect(definition.name).toBe("Threshold Intervals");
		});

		it("should return threshold template via helper function", () => {
			const template = getExtendedWorkoutTemplate("threshold");

			expect(template.type).toBe("threshold");
			expect(template.name).toBe("Threshold Intervals");
		});

		it("should include threshold in quality workout types", () => {
			const qualityTypes = getQualityWorkoutTypes();

			expect(qualityTypes).toContain("threshold");
			expect(qualityTypes).toContain("tempo");
			expect(qualityTypes).toContain("intervals");
			expect(qualityTypes).toContain("hills");
			expect(qualityTypes).toContain("fartlek");
		});
	});

	describe("Threshold in Workout Scheduling", () => {
		const {
			getQualityWorkoutRotation,
			QUALITY_WORKOUT_CYCLE,
			getQualityWorkoutSchedule,
		} = useWorkoutScheduling();

		it("should include threshold in quality workout rotation cycle", () => {
			expect(QUALITY_WORKOUT_CYCLE).toContain("threshold");
			expect(QUALITY_WORKOUT_CYCLE).toEqual([
				"tempo",
				"threshold",
				"intervals",
				"hills",
				"fartlek",
			]);
		});

		it("should schedule threshold workouts in rotation", () => {
			const week2 = getQualityWorkoutRotation(2);

			expect(week2.qualityType).toBe("threshold");
			expect(week2.description).toContain("Threshold Intervals");
			expect(week2.nextRotation).toBe("intervals");
		});

		it("should cycle through all workout types including threshold", () => {
			const schedule = getQualityWorkoutSchedule(1, 10);

			const workoutTypes = schedule.map((week) => week.qualityType);

			expect(workoutTypes).toContain("tempo");
			expect(workoutTypes).toContain("threshold");
			expect(workoutTypes).toContain("intervals");
			expect(workoutTypes).toContain("hills");
			expect(workoutTypes).toContain("fartlek");

			// Check that threshold appears in correct position (week 2, 7, etc.)
			expect(workoutTypes[1]).toBe("threshold"); // Week 2
			expect(workoutTypes[6]).toBe("threshold"); // Week 7
		});
	});

	describe("Threshold Phase-Specific Adaptations", () => {
		const { getQualityWorkoutRotation } = useWorkoutScheduling();

		it("should provide phase-specific threshold descriptions", () => {
			const thresholdWeek = getQualityWorkoutRotation(2);

			expect(thresholdWeek.description).toContain("Threshold Intervals");
			expect(thresholdWeek.description).toContain("lactate threshold");
		});
	});

	describe("Threshold Workout Characteristics", () => {
		it("should have zone3 intensity (lactate threshold zone)", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;

			expect(threshold.intensity).toBe("zone3");
			// Zone3 is the lactate threshold zone
		});

		it("should be categorized as quality workout", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;

			expect(threshold.category).toBe("quality");
		});

		it("should have moderate recovery time", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;

			expect(threshold.recoveryHours).toBe(42);
			expect(threshold.recoveryHours).toBeGreaterThan(36); // More than fartlek
			expect(threshold.recoveryHours).toBeLessThan(48); // Less than tempo/intervals
		});
	});

	describe("Threshold Training Benefits", () => {
		it("should emphasize lactate threshold specific adaptations", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;

			const benefitsText = template.benefits.join(" ").toLowerCase();

			expect(benefitsText).toContain("lactate threshold");
			expect(benefitsText).toContain("buffering");
			expect(benefitsText).toContain("threshold pace");
			expect(benefitsText).toContain("mental resilience");
		});

		it("should highlight interval format advantages", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;

			const benefitsText = template.benefits.join(" ").toLowerCase();

			expect(benefitsText).toContain("higher volume");
			expect(benefitsText).toContain("threshold pace");
		});
	});

	describe("Threshold Workout Examples", () => {
		it("should provide varied threshold interval examples", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;
			const examples = template.examples!;

			// Should have time-based intervals
			expect(examples.some((ex) => ex.includes("8min"))).toBe(true);
			expect(examples.some((ex) => ex.includes("5min"))).toBe(true);

			// Should have distance-based intervals
			expect(examples.some((ex) => ex.includes("2km"))).toBe(true);

			// Should show recovery periods
			expect(examples.every((ex) => ex.includes("recovery"))).toBe(true);

			// Should show interval format (x notation)
			expect(examples.every((ex) => ex.includes(" x "))).toBe(true);
		});

		it("should include structured workout format", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;

			expect(template.structure).toContain("Warm-up");
			expect(template.structure).toContain("Threshold intervals");
			expect(template.structure).toContain("Cool-down");
			expect(template.structure).toContain("work/recovery");
		});

		it("should show appropriate recovery periods", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.threshold;
			const examples = template.examples!;

			// Recovery should be shorter than work intervals (threshold characteristic)
			examples.forEach((example) => {
				if (example.includes("8min") && example.includes("2min")) {
					// 8min work, 2min recovery - appropriate ratio
					expect(example).toContain("8min threshold (2min recovery)");
				}
				if (example.includes("5min") && example.includes("90sec")) {
					// 5min work, 90sec recovery - appropriate ratio
					expect(example).toContain("5min threshold (90sec recovery)");
				}
			});
		});
	});

	describe("Training Science Integration", () => {
		it("should complement tempo runs in periodization", () => {
			const threshold = EXTENDED_WORKOUT_TYPES.threshold;
			const tempo = EXTENDED_WORKOUT_TYPES.tempo;

			// Both target lactate threshold but different formats
			expect(threshold.purpose).toContain("Lactate threshold");
			expect(tempo.purpose).toContain("Lactate threshold");

			// Threshold allows higher volume at threshold pace
			const thresholdBenefits = EXTENDED_WORKOUT_TEMPLATES.threshold.benefits;
			expect(
				thresholdBenefits.some((benefit) =>
					benefit.toLowerCase().includes("higher volume"),
				),
			).toBe(true);
		});

		it("should provide progression from tempo to threshold", () => {
			const thresholdTemplate = EXTENDED_WORKOUT_TEMPLATES.threshold;
			const tempoTemplate = EXTENDED_WORKOUT_TEMPLATES.tempo;

			// Threshold can handle longer total time at threshold pace
			expect(thresholdTemplate.durationRange.max).toBeGreaterThan(
				tempoTemplate.durationRange.max,
			);

			// But broken into manageable segments
			expect(thresholdTemplate.structure).toContain("intervals");
		});
	});
});
