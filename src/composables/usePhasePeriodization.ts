import type { RaceDistance } from "@/types/configuration";
import type { TrainingPhase } from "@/types/workout";

/**
 * Phase periodization system for training plans
 * Implements scientifically-backed training phases:
 * - Base Phase: Aerobic development and injury prevention
 * - Build Phase: Lactate threshold and VO2 max development
 * - Peak Phase: Race-specific fitness and sharpening
 * - Taper Phase: Recovery while maintaining fitness
 */

export interface PhaseConfiguration {
	phase: TrainingPhase;
	startWeek: number;
	endWeek: number;
	durationWeeks: number;
	percentage: number; // percentage of total program
	focus: string;
	characteristics: string[];
	workoutEmphasis: string[];
}

export interface PhasePeriodization {
	totalWeeks: number;
	raceDistance: RaceDistance;
	phases: PhaseConfiguration[];
	phaseTransitions: PhaseTransition[];
}

export interface PhaseTransition {
	fromPhase: TrainingPhase;
	toPhase: TrainingPhase;
	transitionWeek: number;
	adjustments: string[];
	warnings: string[];
}

export interface PhaseCharacteristics {
	volumeEmphasis: "low" | "moderate" | "high";
	intensityEmphasis: "low" | "moderate" | "high";
	recoveryEmphasis: "low" | "moderate" | "high";
	workoutTypes: string[];
	primaryAdaptations: string[];
	keyMetrics: string[];
}

/**
 * Phase distribution percentages by race distance
 * Shorter races need more speed work, longer races need more base building
 */
const PHASE_DISTRIBUTION_BY_RACE: Record<
	RaceDistance,
	{
		base: number;
		build: number;
		peak: number;
		taper: number;
	}
> = {
	"5K": {
		base: 0.3, // 30% - Less base needed for 5K
		build: 0.4, // 40% - More speed development
		peak: 0.2, // 20% - Race sharpening
		taper: 0.1, // 10% - Short taper
	},
	"10K": {
		base: 0.35, // 35% - Moderate base
		build: 0.35, // 35% - Balanced build
		peak: 0.2, // 20% - Race preparation
		taper: 0.1, // 10% - Standard taper
	},
	"Half Marathon": {
		base: 0.4, // 40% - More aerobic base
		build: 0.3, // 30% - Threshold development
		peak: 0.2, // 20% - Race specificity
		taper: 0.1, // 10% - Recovery taper
	},
	Marathon: {
		base: 0.45, // 45% - Extensive base building
		build: 0.25, // 25% - Moderate build
		peak: 0.2, // 20% - Race preparation
		taper: 0.1, // 10% - Critical taper
	},
};

/**
 * Minimum phase durations to ensure adequate adaptation (in weeks)
 */
const MINIMUM_PHASE_DURATIONS = {
	base: 3, // Minimum 3 weeks for aerobic adaptation
	build: 3, // Minimum 3 weeks for lactate threshold development
	peak: 2, // Minimum 2 weeks for race sharpening
	taper: 1, // Minimum 1 week for recovery
};

/**
 * Phase characteristics and training focus
 */
const PHASE_CHARACTERISTICS: Record<TrainingPhase, PhaseCharacteristics> = {
	base: {
		volumeEmphasis: "high",
		intensityEmphasis: "low",
		recoveryEmphasis: "high",
		workoutTypes: ["easy", "long", "tempo (limited)"],
		primaryAdaptations: [
			"Aerobic enzyme development",
			"Capillary density increase",
			"Mitochondrial adaptation",
			"Injury prevention",
			"Movement efficiency",
		],
		keyMetrics: [
			"Weekly volume progression",
			"Aerobic pace improvement",
			"Injury prevention",
			"Consistency",
		],
	},
	build: {
		volumeEmphasis: "moderate",
		intensityEmphasis: "high",
		recoveryEmphasis: "moderate",
		workoutTypes: ["tempo", "intervals", "hills", "long runs"],
		primaryAdaptations: [
			"Lactate threshold improvement",
			"VO2 max development",
			"Neuromuscular power",
			"Running economy",
			"Metabolic flexibility",
		],
		keyMetrics: [
			"Threshold pace improvement",
			"VO2 max intervals",
			"Hill running strength",
			"Recovery between sessions",
		],
	},
	peak: {
		volumeEmphasis: "moderate",
		intensityEmphasis: "high",
		recoveryEmphasis: "moderate",
		workoutTypes: ["race pace", "tune-up races", "specific intervals"],
		primaryAdaptations: [
			"Race-specific fitness",
			"Neuromuscular sharpening",
			"Pacing practice",
			"Mental preparation",
			"Peak performance",
		],
		keyMetrics: [
			"Race pace sustainability",
			"Tune-up race performance",
			"Confidence building",
			"Technical refinement",
		],
	},
	taper: {
		volumeEmphasis: "low",
		intensityEmphasis: "moderate",
		recoveryEmphasis: "high",
		workoutTypes: ["short intervals", "strides", "easy runs"],
		primaryAdaptations: [
			"Fatigue dissipation",
			"Glycogen supercompensation",
			"Neuromuscular freshness",
			"Mental readiness",
			"Peak race form",
		],
		keyMetrics: [
			"Feeling of freshness",
			"Maintained speed",
			"Reduced fatigue",
			"Race readiness",
		],
	},
};

export function usePhasePeriodization() {
	/**
	 * Calculates phase periodization for a training plan
	 */
	function calculatePhasePeriodization(
		totalWeeks: number,
		raceDistance: RaceDistance,
	): PhasePeriodization {
		// Get phase distribution for race distance
		const distribution = PHASE_DISTRIBUTION_BY_RACE[raceDistance];

		// Check if total weeks is sufficient for minimum phase durations
		const totalMinimumWeeks = Object.values(MINIMUM_PHASE_DURATIONS).reduce(
			(sum, weeks) => sum + weeks,
			0,
		);

		let phaseDurations: Record<TrainingPhase, number>;

		if (totalWeeks < totalMinimumWeeks) {
			// For very short programs, distribute weeks proportionally but ensure at least 1 week per phase
			const baseWeeks = Math.max(1, Math.floor(totalWeeks * distribution.base));
			const buildWeeks = Math.max(
				1,
				Math.floor(totalWeeks * distribution.build),
			);
			const peakWeeks = Math.max(1, Math.floor(totalWeeks * distribution.peak));
			const taperWeeks = Math.max(
				1,
				Math.floor(totalWeeks * distribution.taper),
			);

			// Adjust to fit total weeks
			const calculatedTotal = baseWeeks + buildWeeks + peakWeeks + taperWeeks;

			phaseDurations = {
				base: baseWeeks,
				build: buildWeeks,
				peak: peakWeeks,
				taper: taperWeeks,
			};

			// Distribute remaining weeks or reduce if over
			const difference = totalWeeks - calculatedTotal;
			if (difference !== 0) {
				// Add/subtract from the largest phase first
				const phases = Object.entries(phaseDurations).sort(
					([, a], [, b]) => b - a,
				);
				phaseDurations[phases[0][0] as TrainingPhase] += difference;

				// Ensure no phase goes below 1 week
				if (phaseDurations[phases[0][0] as TrainingPhase] < 1) {
					phaseDurations[phases[0][0] as TrainingPhase] = 1;
					// Redistribute the deficit
					const deficit =
						1 - (phaseDurations[phases[0][0] as TrainingPhase] + difference);
					phaseDurations[phases[1][0] as TrainingPhase] = Math.max(
						1,
						phaseDurations[phases[1][0] as TrainingPhase] - deficit,
					);
				}
			}
		} else {
			// Normal calculation with minimum durations
			phaseDurations = {
				base: Math.max(
					Math.floor(totalWeeks * distribution.base),
					MINIMUM_PHASE_DURATIONS.base,
				),
				build: Math.max(
					Math.floor(totalWeeks * distribution.build),
					MINIMUM_PHASE_DURATIONS.build,
				),
				peak: Math.max(
					Math.floor(totalWeeks * distribution.peak),
					MINIMUM_PHASE_DURATIONS.peak,
				),
				taper: Math.max(
					Math.floor(totalWeeks * distribution.taper),
					MINIMUM_PHASE_DURATIONS.taper,
				),
			};

			// Adjust for total weeks if sum doesn't match
			const totalCalculated = Object.values(phaseDurations).reduce(
				(sum, weeks) => sum + weeks,
				0,
			);
			if (totalCalculated !== totalWeeks) {
				// Adjust the largest phase (usually base or build)
				const adjustment = totalWeeks - totalCalculated;
				if (phaseDurations.base >= phaseDurations.build) {
					phaseDurations.base = Math.max(
						MINIMUM_PHASE_DURATIONS.base,
						phaseDurations.base + adjustment,
					);
				} else {
					phaseDurations.build = Math.max(
						MINIMUM_PHASE_DURATIONS.build,
						phaseDurations.build + adjustment,
					);
				}
			}
		}

		// Create phase configurations
		const phases: PhaseConfiguration[] = [];
		let currentWeek = 1;

		// Base Phase
		phases.push({
			phase: "base",
			startWeek: currentWeek,
			endWeek: currentWeek + phaseDurations.base - 1,
			durationWeeks: phaseDurations.base,
			percentage: (phaseDurations.base / totalWeeks) * 100,
			focus: "Aerobic Development & Base Building",
			characteristics: [
				"High volume, low intensity training",
				"Focus on aerobic enzyme development",
				"Injury prevention and movement efficiency",
				"Gradual volume progression",
				"Limited quality work (tempo runs)",
			],
			workoutEmphasis: ["easy runs", "long runs", "occasional tempo"],
		});
		currentWeek += phaseDurations.base;

		// Build Phase
		phases.push({
			phase: "build",
			startWeek: currentWeek,
			endWeek: currentWeek + phaseDurations.build - 1,
			durationWeeks: phaseDurations.build,
			percentage: (phaseDurations.build / totalWeeks) * 100,
			focus: "Lactate Threshold & VO2 Max Development",
			characteristics: [
				"Moderate volume with increased intensity",
				"Lactate threshold development",
				"VO2 max improvement through intervals",
				"Hill training for strength and power",
				"Progressive long run development",
			],
			workoutEmphasis: ["tempo runs", "intervals", "hill repeats", "long runs"],
		});
		currentWeek += phaseDurations.build;

		// Peak Phase
		phases.push({
			phase: "peak",
			startWeek: currentWeek,
			endWeek: currentWeek + phaseDurations.peak - 1,
			durationWeeks: phaseDurations.peak,
			percentage: (phaseDurations.peak / totalWeeks) * 100,
			focus: "Race-Specific Fitness & Sharpening",
			characteristics: [
				"Race-specific pace training",
				"Neuromuscular sharpening",
				"Tune-up races and time trials",
				"Mental preparation and confidence building",
				"Peak fitness development",
			],
			workoutEmphasis: [
				"race pace intervals",
				"tune-up races",
				"specific workouts",
			],
		});
		currentWeek += phaseDurations.peak;

		// Taper Phase
		phases.push({
			phase: "taper",
			startWeek: currentWeek,
			endWeek: totalWeeks,
			durationWeeks: phaseDurations.taper,
			percentage: (phaseDurations.taper / totalWeeks) * 100,
			focus: "Recovery & Race Preparation",
			characteristics: [
				"Significant volume reduction (20-30%)",
				"Maintained intensity with reduced duration",
				"Enhanced recovery and freshness",
				"Mental preparation and race strategy",
				"Peak race readiness",
			],
			workoutEmphasis: ["short intervals", "strides", "easy runs", "race prep"],
		});

		// Create phase transitions
		const phaseTransitions = createPhaseTransitions(phases);

		return {
			totalWeeks,
			raceDistance,
			phases,
			phaseTransitions,
		};
	}

	/**
	 * Determines which phase a specific week belongs to
	 */
	function getPhaseForWeek(
		weekNumber: number,
		periodization: PhasePeriodization,
	): TrainingPhase {
		for (const phase of periodization.phases) {
			if (weekNumber >= phase.startWeek && weekNumber <= phase.endWeek) {
				return phase.phase;
			}
		}

		// Fallback - shouldn't happen with proper periodization
		if (weekNumber <= 4) return "base";
		if (weekNumber <= periodization.totalWeeks - 4) return "build";
		if (weekNumber <= periodization.totalWeeks - 2) return "peak";
		return "taper";
	}

	/**
	 * Gets phase configuration for a specific phase
	 */
	function getPhaseConfiguration(
		phase: TrainingPhase,
		periodization: PhasePeriodization,
	): PhaseConfiguration | undefined {
		return periodization.phases.find((p) => p.phase === phase);
	}

	/**
	 * Gets phase characteristics for training guidance
	 */
	function getPhaseCharacteristics(phase: TrainingPhase): PhaseCharacteristics {
		return PHASE_CHARACTERISTICS[phase];
	}

	/**
	 * Creates phase transitions with guidance
	 */
	function createPhaseTransitions(
		phases: PhaseConfiguration[],
	): PhaseTransition[] {
		const transitions: PhaseTransition[] = [];

		for (let i = 0; i < phases.length - 1; i++) {
			const currentPhase = phases[i];
			const nextPhase = phases[i + 1];

			transitions.push({
				fromPhase: currentPhase.phase,
				toPhase: nextPhase.phase,
				transitionWeek: nextPhase.startWeek,
				adjustments: getTransitionAdjustments(
					currentPhase.phase,
					nextPhase.phase,
				),
				warnings: getTransitionWarnings(currentPhase.phase, nextPhase.phase),
			});
		}

		return transitions;
	}

	/**
	 * Gets specific adjustments needed when transitioning between phases
	 */
	function getTransitionAdjustments(
		fromPhase: TrainingPhase,
		toPhase: TrainingPhase,
	): string[] {
		const transitionKey = `${fromPhase}-${toPhase}`;

		const adjustments: Record<string, string[]> = {
			"base-build": [
				"Introduce tempo runs and intervals gradually",
				"Maintain easy run volume while adding quality",
				"Ensure adequate recovery between hard sessions",
				"Monitor for signs of overreaching",
			],
			"build-peak": [
				"Shift focus to race-specific paces",
				"Reduce overall volume slightly",
				"Increase workout specificity",
				"Add tune-up races or time trials",
			],
			"peak-taper": [
				"Reduce training volume by 20-30%",
				"Maintain intensity but reduce duration",
				"Increase recovery emphasis",
				"Focus on race preparation and strategy",
			],
		};

		return adjustments[transitionKey] || [];
	}

	/**
	 * Gets warnings for phase transitions
	 */
	function getTransitionWarnings(
		fromPhase: TrainingPhase,
		toPhase: TrainingPhase,
	): string[] {
		const transitionKey = `${fromPhase}-${toPhase}`;

		const warnings: Record<string, string[]> = {
			"base-build": [
				"Avoid sudden intensity increases",
				"Watch for overuse injuries as intensity increases",
				"Maintain consistency in easy running",
			],
			"build-peak": [
				"Don't sacrifice recovery for extra intensity",
				"Avoid trying new workouts close to race",
				"Monitor fatigue levels carefully",
			],
			"peak-taper": [
				"Resist urge to maintain high volume",
				"Trust the taper process",
				"Avoid new activities or changes",
			],
		};

		return warnings[transitionKey] || [];
	}

	/**
	 * Validates phase periodization for effectiveness
	 */
	function validatePhasePeriodization(periodization: PhasePeriodization): {
		isValid: boolean;
		warnings: string[];
		recommendations: string[];
	} {
		const warnings: string[] = [];
		const recommendations: string[] = [];
		let isValid = true;

		// Check minimum phase durations
		for (const phase of periodization.phases) {
			const minDuration = MINIMUM_PHASE_DURATIONS[phase.phase];
			if (phase.durationWeeks < minDuration) {
				warnings.push(
					`${phase.phase} phase (${phase.durationWeeks} weeks) is shorter than recommended minimum (${minDuration} weeks)`,
				);
				isValid = false;
			}
		}

		// Check base phase adequacy
		const basePhase = periodization.phases.find((p) => p.phase === "base");
		if (basePhase && basePhase.percentage < 25) {
			warnings.push(
				"Base phase may be too short for adequate aerobic development",
			);
			recommendations.push(
				"Consider extending base phase for better injury prevention",
			);
		}

		// Check taper adequacy
		const taperPhase = periodization.phases.find((p) => p.phase === "taper");
		if (taperPhase && taperPhase.durationWeeks < 1) {
			warnings.push("Taper phase may be too short for adequate recovery");
			isValid = false;
		}

		// Check for very short programs
		if (periodization.totalWeeks < 8) {
			warnings.push("Program may be too short for optimal adaptation");
			recommendations.push(
				"Consider extending program length for better results",
			);
		}

		return {
			isValid,
			warnings,
			recommendations,
		};
	}

	/**
	 * Gets recommended phase adjustments for different race distances
	 */
	function getPhaseRecommendations(
		raceDistance: RaceDistance,
		totalWeeks: number,
	): {
		recommendations: string[];
		optimalWeeks: number;
		phaseAdjustments: string[];
	} {
		const recommendations: string[] = [];
		const phaseAdjustments: string[] = [];

		let optimalWeeks = 12; // Default

		switch (raceDistance) {
			case "5K":
				optimalWeeks = 8;
				recommendations.push(
					"5K training benefits from more speed work in build phase",
				);
				if (totalWeeks < 6) {
					phaseAdjustments.push(
						"Consider minimal base phase and focus on speed development",
					);
				}
				break;

			case "10K":
				optimalWeeks = 10;
				recommendations.push(
					"10K requires balanced aerobic and anaerobic development",
				);
				if (totalWeeks < 8) {
					phaseAdjustments.push(
						"Compress base phase but maintain build phase duration",
					);
				}
				break;

			case "Half Marathon":
				optimalWeeks = 12;
				recommendations.push("Half marathon needs substantial aerobic base");
				if (totalWeeks < 10) {
					phaseAdjustments.push("Prioritize base building over peak phase");
				}
				break;

			case "Marathon":
				optimalWeeks = 16;
				recommendations.push("Marathon requires extensive base building phase");
				if (totalWeeks < 12) {
					phaseAdjustments.push("Extend base phase at expense of peak phase");
					recommendations.push(
						"Consider longer program for optimal marathon preparation",
					);
				}
				break;
		}

		return {
			recommendations,
			optimalWeeks,
			phaseAdjustments,
		};
	}

	return {
		calculatePhasePeriodization,
		getPhaseForWeek,
		getPhaseConfiguration,
		getPhaseCharacteristics,
		validatePhasePeriodization,
		getPhaseRecommendations,
		PHASE_DISTRIBUTION_BY_RACE,
		MINIMUM_PHASE_DURATIONS,
		PHASE_CHARACTERISTICS,
	};
}
