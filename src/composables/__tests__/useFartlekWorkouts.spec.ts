import { describe, it, expect } from "vitest";
import {
	EXTENDED_WORKOUT_TYPES,
	EXTENDED_WORKOUT_TEMPLATES,
	getExtendedWorkoutDefinition,
	getExtendedWorkoutTemplate,
	getQualityWorkoutTypes,
} from "@/constants/workoutTypes";
import { useWorkoutScheduling } from "../useWorkoutScheduling";

describe("Fartlek Workout Implementation", () => {
	describe("Fartlek Workout Type Definition", () => {
		it("should have fartlek defined in extended workout types", () => {
			expect(EXTENDED_WORKOUT_TYPES.fartlek).toBeDefined();
		});

		it("should have correct fartlek workout properties", () => {
			const fartlek = EXTENDED_WORKOUT_TYPES.fartlek;

			expect(fartlek.type).toBe("fartlek");
			expect(fartlek.name).toBe("Fartlek Training");
			expect(fartlek.description).toContain("Unstructured speed play");
			expect(fartlek.intensity).toBe("zone3");
			expect(fartlek.purpose).toContain("Speed development");
			expect(fartlek.category).toBe("quality");
			expect(fartlek.recoveryHours).toBe(36);
		});

		it("should have fartlek icon and color defined", () => {
			const fartlek = EXTENDED_WORKOUT_TYPES.fartlek;

			expect(fartlek.icon).toBe("🎯");
			expect(fartlek.color).toBe("#06b6d4");
		});
	});

	describe("Fartlek Workout Template", () => {
		it("should have fartlek template defined", () => {
			expect(EXTENDED_WORKOUT_TEMPLATES.fartlek).toBeDefined();
		});

		it("should have appropriate duration and distance ranges", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			expect(template.durationRange.min).toBe(25);
			expect(template.durationRange.max).toBe(75);
			expect(template.distanceRange.min).toBe(5);
			expect(template.distanceRange.max).toBe(12);
		});

		it("should have comprehensive instructions and benefits", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			expect(template.instructions).toContain("Vary your pace");
			expect(template.instructions).toContain("based on feel");

			expect(template.benefits).toContain(
				"Develops speed and lactate tolerance",
			);
			expect(template.benefits).toContain("Improves mental adaptability");
			expect(template.benefits).toContain("Enhances pace judgment");
			expect(template.benefits).toContain("Builds anaerobic capacity");
			expect(template.benefits).toContain("Adds variety and fun to training");
		});

		it("should have workout structure and examples", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			expect(template.structure).toContain("Warm-up + Fartlek segment");
			expect(template.examples).toBeDefined();
			expect(template.examples?.length).toBeGreaterThan(0);

			// Check for variety in examples
			const examples = template.examples!;
			expect(examples.some((ex) => ex.includes("landmark"))).toBe(true);
			expect(examples.some((ex) => ex.includes("min"))).toBe(true);
		});
	});

	describe("Helper Functions", () => {
		it("should return fartlek definition via helper function", () => {
			const definition = getExtendedWorkoutDefinition("fartlek");

			expect(definition.type).toBe("fartlek");
			expect(definition.name).toBe("Fartlek Training");
		});

		it("should return fartlek template via helper function", () => {
			const template = getExtendedWorkoutTemplate("fartlek");

			expect(template.type).toBe("fartlek");
			expect(template.name).toBe("Fartlek Training");
		});

		it("should include fartlek in quality workout types", () => {
			const qualityTypes = getQualityWorkoutTypes();

			expect(qualityTypes).toContain("fartlek");
			expect(qualityTypes).toContain("tempo");
			expect(qualityTypes).toContain("intervals");
			expect(qualityTypes).toContain("hills");
		});
	});

	describe("Fartlek in Workout Scheduling", () => {
		const {
			getQualityWorkoutRotation,
			QUALITY_WORKOUT_CYCLE,
			getQualityWorkoutSchedule,
		} = useWorkoutScheduling();

		it("should include fartlek in quality workout rotation cycle", () => {
			expect(QUALITY_WORKOUT_CYCLE).toContain("fartlek");
			expect(QUALITY_WORKOUT_CYCLE).toEqual([
				"tempo",
				"threshold",
				"intervals",
				"hills",
				"fartlek",
			]);
		});

		it("should schedule fartlek workouts in rotation", () => {
			const week5 = getQualityWorkoutRotation(5);

			expect(week5.qualityType).toBe("fartlek");
			expect(week5.description).toContain("Fartlek Training");
			expect(week5.nextRotation).toBe("tempo");
		});

		it("should cycle through all workout types including fartlek", () => {
			const schedule = getQualityWorkoutSchedule(1, 10);

			const workoutTypes = schedule.map((week) => week.qualityType);

			expect(workoutTypes).toContain("tempo");
			expect(workoutTypes).toContain("threshold");
			expect(workoutTypes).toContain("intervals");
			expect(workoutTypes).toContain("hills");
			expect(workoutTypes).toContain("fartlek");

			// Check that fartlek appears in correct position (week 5, 10, etc.)
			expect(workoutTypes[4]).toBe("fartlek"); // Week 5
			expect(workoutTypes[9]).toBe("fartlek"); // Week 10
		});
	});

	describe("Fartlek Phase-Specific Adaptations", () => {
		const { getQualityWorkoutRotation } = useWorkoutScheduling();

		it("should provide phase-specific fartlek descriptions", () => {
			// This tests the phase-specific description logic
			const fartlekWeek = getQualityWorkoutRotation(5);

			expect(fartlekWeek.description).toContain("Fartlek Training");
			expect(fartlekWeek.description).toContain("Speed development");
		});
	});

	describe("Fartlek Workout Characteristics", () => {
		it("should have appropriate recovery time compared to other quality workouts", () => {
			const fartlek = EXTENDED_WORKOUT_TYPES.fartlek;
			const tempo = EXTENDED_WORKOUT_TYPES.tempo;
			const intervals = EXTENDED_WORKOUT_TYPES.intervals;
			const hills = EXTENDED_WORKOUT_TYPES.hills;

			// Fartlek should have moderate recovery (36h vs 48h for intervals/hills)
			expect(fartlek.recoveryHours).toBe(36);
			expect(fartlek.recoveryHours).toBeLessThan(intervals.recoveryHours);
			expect(fartlek.recoveryHours).toBeLessThan(hills.recoveryHours);
			expect(fartlek.recoveryHours).toBeGreaterThanOrEqual(
				tempo.recoveryHours - 12,
			); // Allow some flexibility
		});

		it("should have zone3 intensity (moderate-hard)", () => {
			const fartlek = EXTENDED_WORKOUT_TYPES.fartlek;

			expect(fartlek.intensity).toBe("zone3");
			// Zone3 is appropriate for fartlek as it allows for varied pace play
		});

		it("should be categorized as quality workout", () => {
			const fartlek = EXTENDED_WORKOUT_TYPES.fartlek;

			expect(fartlek.category).toBe("quality");
		});
	});

	describe("Fartlek Training Benefits", () => {
		it("should emphasize mental and tactical benefits", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			const benefitsText = template.benefits.join(" ").toLowerCase();

			expect(benefitsText).toContain("mental");
			expect(benefitsText).toContain("adaptability");
			expect(benefitsText).toContain("pace judgment");
			expect(benefitsText).toContain("variety");
			expect(benefitsText).toContain("fun");
		});

		it("should provide physiological benefits", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			const benefitsText = template.benefits.join(" ").toLowerCase();

			expect(benefitsText).toContain("speed");
			expect(benefitsText).toContain("lactate");
			expect(benefitsText).toContain("anaerobic");
		});
	});

	describe("Fartlek Workout Examples", () => {
		it("should provide varied fartlek workout examples", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;
			const examples = template.examples!;

			// Should have time-based example
			expect(examples.some((ex) => ex.includes("min"))).toBe(true);

			// Should have distance-based example
			expect(examples.some((ex) => ex.includes("km"))).toBe(true);

			// Should have landmark-based example
			expect(
				examples.some((ex) => ex.includes("landmark") || ex.includes("tree")),
			).toBe(true);

			// Should mention surges/pickups
			expect(
				examples.some((ex) => ex.includes("surge") || ex.includes("pickup")),
			).toBe(true);
		});

		it("should include structured workout format", () => {
			const template = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			expect(template.structure).toContain("Warm-up");
			expect(template.structure).toContain("Fartlek segment");
			expect(template.structure).toContain("Cool-down");
		});
	});
});
