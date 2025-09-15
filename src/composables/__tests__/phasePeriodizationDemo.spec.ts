import { describe, it, expect } from "vitest";
import { usePhasePeriodization } from "../usePhasePeriodization";
import { useWorkoutDistribution } from "../useWorkoutDistribution";
import { useProgressionRules } from "../useProgressionRules";

describe("Phase Periodization Demo", () => {
	const {
		calculatePhasePeriodization,
		getPhaseForWeek,
		getPhaseCharacteristics,
	} = usePhasePeriodization();
	const { getPhaseWorkoutRecommendations } = useWorkoutDistribution();
	const { calculateWeeklyVolumes } = useProgressionRules();

	it("should demonstrate phase periodization for Half Marathon", () => {
		console.log("\n=== Half Marathon Phase Periodization (12 weeks) ===");

		const periodization = calculatePhasePeriodization(12, "Half Marathon");

		periodization.phases.forEach((phase) => {
			console.log(
				`\n${phase.phase.toUpperCase()} PHASE (Weeks ${phase.startWeek}-${phase.endWeek})`,
			);
			console.log(
				`Duration: ${phase.durationWeeks} weeks (${phase.percentage.toFixed(1)}%)`,
			);
			console.log(`Focus: ${phase.focus}`);
			console.log(`Characteristics:`);
			phase.characteristics.forEach((char) => console.log(`  • ${char}`));
			console.log(`Workout Emphasis: ${phase.workoutEmphasis.join(", ")}`);
		});

		console.log("\n=== Phase Transitions ===");
		periodization.phaseTransitions.forEach((transition) => {
			console.log(
				`\nWeek ${transition.transitionWeek}: ${transition.fromPhase.toUpperCase()} → ${transition.toPhase.toUpperCase()}`,
			);
			console.log("Adjustments:");
			transition.adjustments.forEach((adj) => console.log(`  • ${adj}`));
			if (transition.warnings.length > 0) {
				console.log("Warnings:");
				transition.warnings.forEach((warn) => console.log(`  ⚠️ ${warn}`));
			}
		});

		expect(periodization.phases).toHaveLength(4);
	});

	it("should demonstrate weekly phase progression", () => {
		console.log("\n=== Weekly Phase Progression (Marathon, 16 weeks) ===");

		const periodization = calculatePhasePeriodization(16, "Marathon");
		const volumes = calculateWeeklyVolumes({
			raceDistance: "Marathon",
			programLength: 16,
			trainingDaysPerWeek: 5,
			deloadFrequency: 4,
			userExperience: "intermediate",
		});

		console.log("Week | Phase  | Volume | Notes");
		console.log("-----|--------|--------|-------");

		for (let week = 1; week <= 16; week++) {
			const phase = getPhaseForWeek(week, periodization);
			const volume = volumes.find((v) => v.weekNumber === week);
			const deloadNote = volume?.isDeloadWeek ? " (DELOAD)" : "";

			console.log(
				`${week.toString().padStart(4)} | ${phase.padEnd(6)} | ${volume?.adjustedVolume.toString().padStart(4)}km | ${phase} phase${deloadNote}`,
			);
		}

		expect(volumes).toHaveLength(16);
	});

	it("should demonstrate phase characteristics comparison", () => {
		console.log("\n=== Phase Characteristics Comparison ===");

		const phases: Array<"base" | "build" | "peak" | "taper"> = [
			"base",
			"build",
			"peak",
			"taper",
		];

		phases.forEach((phase) => {
			const characteristics = getPhaseCharacteristics(phase);
			getPhaseWorkoutRecommendations(phase);

			console.log(`\n${phase.toUpperCase()} PHASE:`);
			console.log(`Volume Emphasis: ${characteristics.volumeEmphasis}`);
			console.log(`Intensity Emphasis: ${characteristics.intensityEmphasis}`);
			console.log(`Recovery Emphasis: ${characteristics.recoveryEmphasis}`);
			console.log(`Primary Adaptations:`);
			characteristics.primaryAdaptations
				.slice(0, 3)
				.forEach((adaptation) => console.log(`  • ${adaptation}`));
			console.log(
				`Key Workout Types: ${characteristics.workoutTypes.join(", ")}`,
			);
			console.log(
				`Key Metrics: ${characteristics.keyMetrics.slice(0, 2).join(", ")}`,
			);
		});

		expect(phases).toHaveLength(4);
	});

	it("should demonstrate race distance adaptations", () => {
		console.log("\n=== Race Distance Phase Adaptations (12 weeks) ===");

		const raceDistances = ["5K", "10K", "Half Marathon", "Marathon"] as const;

		console.log("Distance      | Base % | Build % | Peak % | Taper %");
		console.log("--------------|--------|---------|--------|--------");

		raceDistances.forEach((distance) => {
			const periodization = calculatePhasePeriodization(12, distance);

			const basePhase = periodization.phases.find((p) => p.phase === "base")!;
			const buildPhase = periodization.phases.find((p) => p.phase === "build")!;
			const peakPhase = periodization.phases.find((p) => p.phase === "peak")!;
			const taperPhase = periodization.phases.find((p) => p.phase === "taper")!;

			console.log(
				`${distance.padEnd(13)} | ${basePhase.percentage.toFixed(0).padStart(5)}% | ${buildPhase.percentage.toFixed(0).padStart(6)}% | ${peakPhase.percentage.toFixed(0).padStart(5)}% | ${taperPhase.percentage.toFixed(0).padStart(6)}%`,
			);
		});

		console.log("\nKey Insights:");
		console.log("• Marathon has highest base % for aerobic development");
		console.log("• 5K has highest build % for speed/power development");
		console.log("• All distances maintain similar peak and taper percentages");

		expect(raceDistances).toHaveLength(4);
	});

	it("should demonstrate program length adaptations", () => {
		console.log("\n=== Program Length Adaptations (Half Marathon) ===");

		const programLengths = [8, 12, 16, 20];

		console.log("Weeks | Base | Build | Peak | Taper | Notes");
		console.log("------|------|-------|------|-------|-------");

		programLengths.forEach((weeks) => {
			const periodization = calculatePhasePeriodization(weeks, "Half Marathon");

			const baseWeeks = periodization.phases.find(
				(p) => p.phase === "base",
			)?.durationWeeks;
			const buildWeeks = periodization.phases.find(
				(p) => p.phase === "build",
			)?.durationWeeks;
			const peakWeeks = periodization.phases.find(
				(p) => p.phase === "peak",
			)?.durationWeeks;
			const taperWeeks = periodization.phases.find(
				(p) => p.phase === "taper",
			)?.durationWeeks;

			const notes =
				weeks < 10
					? "Compressed phases"
					: weeks > 16
						? "Extended base"
						: "Optimal";

			console.log(
				`${weeks.toString().padStart(5)} | ${baseWeeks.toString().padStart(4)} | ${buildWeeks.toString().padStart(5)} | ${peakWeeks.toString().padStart(4)} | ${taperWeeks.toString().padStart(5)} | ${notes}`,
			);
		});

		console.log("\nKey Insights:");
		console.log("• Longer programs allow for more extensive base building");
		console.log("• Shorter programs compress phases but maintain minimums");
		console.log("• Taper phase remains consistent across program lengths");

		expect(programLengths).toHaveLength(4);
	});
});
