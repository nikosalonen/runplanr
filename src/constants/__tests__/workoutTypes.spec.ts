import { describe, expect, it } from "vitest";
import {
	createWorkoutFromTemplate,
	EXTENDED_WORKOUT_TEMPLATES,
	EXTENDED_WORKOUT_TYPES,
	getExtendedWorkoutDefinition,
	getExtendedWorkoutTemplate,
	getQualityWorkoutTypes,
	MVP_WORKOUT_TYPES,
} from "../workoutTypes";

describe("Workout Types", () => {
	describe("MVP Workout Types", () => {
		it("should have all basic workout types defined", () => {
			expect(MVP_WORKOUT_TYPES.easy).toBeDefined();
			expect(MVP_WORKOUT_TYPES.long).toBeDefined();
			expect(MVP_WORKOUT_TYPES.quality).toBeDefined();
			expect(MVP_WORKOUT_TYPES.rest).toBeDefined();
		});
	});

	describe("Extended Workout Types", () => {
		it("should have all extended workout types including threshold and fartlek", () => {
			expect(EXTENDED_WORKOUT_TYPES.easy).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.long).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.tempo).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.threshold).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.intervals).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.hills).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.fartlek).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.marathon).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.recovery).toBeDefined();
			expect(EXTENDED_WORKOUT_TYPES.rest).toBeDefined();
		});

		it("should have fartlek with correct properties", () => {
			const fartlek = EXTENDED_WORKOUT_TYPES.fartlek;

			expect(fartlek.type).toBe("fartlek");
			expect(fartlek.name).toBe("Fartlek Training");
			expect(fartlek.category).toBe("quality");
			expect(fartlek.intensity).toBe("zone3");
			expect(fartlek.recoveryHours).toBe(36);
		});
	});

	describe("Extended Workout Templates", () => {
		it("should have templates for all extended workout types", () => {
			const extendedTypes = Object.keys(EXTENDED_WORKOUT_TYPES);
			const templateTypes = Object.keys(EXTENDED_WORKOUT_TEMPLATES);

			expect(templateTypes).toEqual(extendedTypes);
		});

		it("should have fartlek template with examples", () => {
			const fartlekTemplate = EXTENDED_WORKOUT_TEMPLATES.fartlek;

			expect(fartlekTemplate.type).toBe("fartlek");
			expect(fartlekTemplate.examples).toBeDefined();
			expect(fartlekTemplate.examples?.length).toBeGreaterThan(0);
			expect(fartlekTemplate.structure).toContain("Fartlek segment");
		});
	});

	describe("Helper Functions", () => {
		it("should return correct extended workout definition", () => {
			const fartlek = getExtendedWorkoutDefinition("fartlek");

			expect(fartlek.type).toBe("fartlek");
			expect(fartlek.name).toBe("Fartlek Training");
		});

		it("should return correct extended workout template", () => {
			const fartlek = getExtendedWorkoutTemplate("fartlek");

			expect(fartlek.type).toBe("fartlek");
			expect(fartlek.name).toBe("Fartlek Training");
		});

		it("should return quality workout types including threshold and fartlek", () => {
			const qualityTypes = getQualityWorkoutTypes();

			expect(qualityTypes).toContain("tempo");
			expect(qualityTypes).toContain("threshold");
			expect(qualityTypes).toContain("intervals");
			expect(qualityTypes).toContain("hills");
			expect(qualityTypes).toContain("fartlek");
			expect(qualityTypes).not.toContain("easy");
			expect(qualityTypes).not.toContain("rest");
		});

		it("should create workout from template", () => {
			const workout = createWorkoutFromTemplate("easy", 45, 6);

			expect(workout.type).toBe("easy");
			expect(workout.duration).toBe(45);
			expect(workout.distance).toBe(6);
			expect(workout.intensity).toBe("zone2");
		});
	});
});
