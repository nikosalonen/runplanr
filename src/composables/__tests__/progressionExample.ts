/**
 * Example usage of the useProgressionRules composable
 * This demonstrates how the base building logic works in practice
 */

import type { ProgressionConfig } from "../useProgressionRules";
import { useProgressionRules } from "../useProgressionRules";

// Example: Half Marathon training plan for intermediate runner
const exampleConfig: ProgressionConfig = {
	raceDistance: "Half Marathon",
	programLength: 12,
	trainingDaysPerWeek: 4,
	deloadFrequency: 4,
	userExperience: "intermediate",
};

const progressionRules = useProgressionRules();

console.log("=== Half Marathon Training Plan Example ===\n");

// Get recommendations for this race distance
const recommendations =
	progressionRules.getProgressionRecommendations("Half Marathon");
console.log("Recommendations for Half Marathon:");
console.log(`- Minimum weeks: ${recommendations.minWeeks}`);
console.log(`- Recommended weeks: ${recommendations.recommendedWeeks}`);
console.log(
	`- Starting distance (intermediate): ${recommendations.startingDistance.intermediate} km`,
);
console.log(
	`- Maximum distance (intermediate): ${recommendations.maxDistance.intermediate} km`,
);
console.log(
	`- Recommended deload frequency: every ${recommendations.recommendedDeloadFrequency} weeks\n`,
);

// Calculate weekly volumes
const weeklyVolumes = progressionRules.calculateWeeklyVolumes(exampleConfig);

console.log("Weekly Volume Progression:");
console.log("Week | Volume | Deload | Rate | Notes");
console.log("-----|--------|--------|------|------");

weeklyVolumes.forEach((week) => {
	const deloadIndicator = week.isDeloadWeek ? "  ✓   " : "      ";
	const rate =
		week.progressionRate > 0
			? `+${Math.round(week.progressionRate * 100)}%`
			: week.progressionRate < 0
				? `${Math.round(week.progressionRate * 100)}%`
				: "  0%";
	const notes =
		week.notes.length > 0 ? `${week.notes[0].substring(0, 30)}...` : "";

	console.log(
		`${week.weekNumber.toString().padStart(4)} | ${week.adjustedVolume.toString().padStart(6)} |${deloadIndicator}| ${rate.padStart(4)} | ${notes}`,
	);
});

// Validate the progression
const validation = progressionRules.validateProgression(weeklyVolumes);
console.log("\nProgression Validation:");
console.log(`Valid: ${validation.isValid}`);
if (validation.warnings.length > 0) {
	console.log("Warnings:");
	validation.warnings.forEach((warning) => console.log(`- ${warning}`));
}
if (validation.adjustments.length > 0) {
	console.log("Suggested Adjustments:");
	validation.adjustments.forEach((adjustment) =>
		console.log(`- ${adjustment}`),
	);
}

// Example of aggressive progression adjustment
console.log("\n=== Aggressive Progression Example ===");
const aggressiveResult = progressionRules.adjustAggressiveProgression(
	45,
	30,
	65,
);
console.log(`Attempted: 30 → 45 km (50% increase)`);
console.log(`Adjusted: 30 → ${aggressiveResult.adjustedVolume} km`);
console.log("Safety notes:");
aggressiveResult.notes.forEach((note) => console.log(`- ${note}`));

export { exampleConfig, weeklyVolumes, validation };
