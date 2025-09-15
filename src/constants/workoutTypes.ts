import type { WorkoutType, IntensityZone, ExtendedWorkoutType } from "@/types";

export interface WorkoutTypeDefinition {
	type: WorkoutType;
	name: string;
	description: string;
	intensity: IntensityZone;
	purpose: string;
	icon: string;
	color: string;
	recoveryHours: number;
}

export interface ExtendedWorkoutTypeDefinition {
	type: ExtendedWorkoutType;
	name: string;
	description: string;
	intensity: IntensityZone;
	purpose: string;
	icon: string;
	color: string;
	recoveryHours: number;
	category: "easy" | "quality" | "long" | "rest";
}

// MVP workout type definitions - core types for initial implementation
export const MVP_WORKOUT_TYPES: Record<WorkoutType, WorkoutTypeDefinition> = {
	easy: {
		type: "easy",
		name: "Easy Run",
		description:
			"Comfortable, conversational pace. You should be able to hold a conversation while running.",
		intensity: "zone2",
		purpose: "Aerobic base building, recovery, and adaptation",
		icon: "🚶‍♂️",
		color: "#22c55e",
		recoveryHours: 0,
	},
	long: {
		type: "long",
		name: "Long Run",
		description:
			"Extended distance at easy to moderate pace. Builds endurance and mental toughness.",
		intensity: "zone2",
		purpose: "Endurance building, mental toughness, and aerobic capacity",
		icon: "🏃‍♂️",
		color: "#3b82f6",
		recoveryHours: 24,
	},
	quality: {
		type: "quality",
		name: "Quality Workout",
		description:
			"Higher intensity workout including tempo runs, intervals, or hill repeats.",
		intensity: "zone4",
		purpose: "Speed, lactate threshold, and VO2 max development",
		icon: "⚡",
		color: "#f59e0b",
		recoveryHours: 48,
	},
	rest: {
		type: "rest",
		name: "Rest Day",
		description:
			"Complete rest or light cross-training. Essential for recovery and adaptation.",
		intensity: "zone1",
		purpose: "Recovery, adaptation, and injury prevention",
		icon: "😴",
		color: "#6b7280",
		recoveryHours: 0,
	},
};

// Workout template library for MVP
export interface WorkoutTemplate {
	type: WorkoutType;
	name: string;
	description: string;
	durationRange: {
		min: number; // minutes
		max: number; // minutes
	};
	distanceRange: {
		min: number; // miles
		max: number; // miles
	};
	instructions: string;
	benefits: string[];
}

export const MVP_WORKOUT_TEMPLATES: Record<WorkoutType, WorkoutTemplate> = {
	easy: {
		type: "easy",
		name: "Easy Run",
		description: "Comfortable aerobic run at conversational pace",
		durationRange: { min: 20, max: 60 },
		distanceRange: { min: 2, max: 8 },
		instructions:
			"Run at a comfortable pace where you can easily hold a conversation. If you're breathing hard, slow down.",
		benefits: [
			"Builds aerobic base",
			"Promotes recovery",
			"Improves running economy",
			"Develops fat-burning capacity",
		],
	},
	long: {
		type: "long",
		name: "Long Run",
		description: "Extended distance run for endurance building",
		durationRange: { min: 60, max: 180 },
		distanceRange: { min: 6, max: 22 },
		instructions:
			"Start at easy pace and maintain steady effort. Focus on time on feet rather than speed. Walk breaks are acceptable for beginners.",
		benefits: [
			"Builds endurance",
			"Improves mental toughness",
			"Enhances fat utilization",
			"Strengthens muscles and joints",
			"Prepares body for race distance",
		],
	},
	quality: {
		type: "quality",
		name: "Quality Workout",
		description: "Higher intensity training session",
		durationRange: { min: 30, max: 90 },
		distanceRange: { min: 3, max: 10 },
		instructions:
			"Warm up thoroughly, then complete the prescribed workout at the target intensity. Cool down with easy running.",
		benefits: [
			"Improves lactate threshold",
			"Increases VO2 max",
			"Develops speed and power",
			"Enhances running economy",
			"Builds race-specific fitness",
		],
	},
	rest: {
		type: "rest",
		name: "Rest Day",
		description: "Complete rest or light cross-training",
		durationRange: { min: 0, max: 60 },
		distanceRange: { min: 0, max: 0 },
		instructions:
			"Take complete rest or engage in light cross-training activities like walking, swimming, or yoga.",
		benefits: [
			"Allows muscle recovery",
			"Prevents overtraining",
			"Reduces injury risk",
			"Promotes adaptation",
			"Maintains motivation",
		],
	},
};

// Helper function to create workout instances from templates
export function createWorkoutFromTemplate(
	workoutType: WorkoutType,
	duration: number,
	distance?: number,
): {
	type: WorkoutType;
	duration: number;
	distance?: number;
	intensity: IntensityZone;
	description: string;
	paceGuidance: string;
	recoveryTime: number;
} {
	const template = MVP_WORKOUT_TEMPLATES[workoutType];
	const definition = MVP_WORKOUT_TYPES[workoutType];

	return {
		type: workoutType,
		duration,
		distance,
		intensity: definition.intensity,
		description: template.description,
		paceGuidance: template.instructions,
		recoveryTime: definition.recoveryHours,
	};
}

// Helper function to get workout benefits
export function getWorkoutBenefits(workoutType: WorkoutType): string[] {
	return MVP_WORKOUT_TEMPLATES[workoutType].benefits;
}

// Helper function to validate workout duration against template ranges
export function isValidWorkoutDuration(
	workoutType: WorkoutType,
	duration: number,
): boolean {
	const template = MVP_WORKOUT_TEMPLATES[workoutType];
	return (
		duration >= template.durationRange.min &&
		duration <= template.durationRange.max
	);
}

// Helper function to validate workout distance against template ranges
export function isValidWorkoutDistance(
	workoutType: WorkoutType,
	distance: number,
): boolean {
	const template = MVP_WORKOUT_TEMPLATES[workoutType];
	return (
		distance >= template.distanceRange.min &&
		distance <= template.distanceRange.max
	);
}

// Extended workout type definitions including specific quality workout types
export const EXTENDED_WORKOUT_TYPES: Record<
	ExtendedWorkoutType,
	ExtendedWorkoutTypeDefinition
> = {
	easy: {
		type: "easy",
		name: "Easy Run",
		description: "Comfortable, conversational pace for aerobic base building",
		intensity: "zone2",
		purpose: "Aerobic base building, recovery, and adaptation",
		icon: "🚶‍♂️",
		color: "#22c55e",
		recoveryHours: 0,
		category: "easy",
	},
	long: {
		type: "long",
		name: "Long Run",
		description: "Extended distance run for endurance development",
		intensity: "zone2",
		purpose: "Endurance building, mental toughness, and aerobic capacity",
		icon: "🏃‍♂️",
		color: "#3b82f6",
		recoveryHours: 24,
		category: "long",
	},
	tempo: {
		type: "tempo",
		name: "Tempo Run",
		description: "Sustained effort at lactate threshold pace",
		intensity: "zone3",
		purpose: "Lactate threshold development and metabolic efficiency",
		icon: "🔥",
		color: "#f59e0b",
		recoveryHours: 48,
		category: "quality",
	},
	threshold: {
		type: "threshold",
		name: "Threshold Intervals",
		description: "Broken lactate threshold efforts with short recoveries",
		intensity: "zone3",
		purpose: "Lactate threshold development through interval format",
		icon: "🎯",
		color: "#f97316",
		recoveryHours: 42,
		category: "quality",
	},
	intervals: {
		type: "intervals",
		name: "Interval Training",
		description: "High-intensity intervals with recovery periods",
		intensity: "zone4",
		purpose: "VO2 max development and speed enhancement",
		icon: "⚡",
		color: "#ef4444",
		recoveryHours: 48,
		category: "quality",
	},
	hills: {
		type: "hills",
		name: "Hill Repeats",
		description: "Uphill intervals for strength and power development",
		intensity: "zone4",
		purpose: "Strength, power, and running economy improvement",
		icon: "⛰️",
		color: "#8b5cf6",
		recoveryHours: 48,
		category: "quality",
	},
	fartlek: {
		type: "fartlek",
		name: "Fartlek Training",
		description: "Unstructured speed play with varied pace changes",
		intensity: "zone3",
		purpose: "Speed development, lactate buffering, and mental adaptability",
		icon: "🎯",
		color: "#06b6d4",
		recoveryHours: 36,
		category: "quality",
	},
	marathon: {
		type: "marathon",
		name: "Marathon Pace",
		description: "Sustained effort at goal marathon pace",
		intensity: "zone2",
		purpose: "Race-specific pace practice and metabolic adaptation",
		icon: "🏁",
		color: "#10b981",
		recoveryHours: 24,
		category: "quality",
	},
	recovery: {
		type: "recovery",
		name: "Recovery Run",
		description: "Very easy pace for active recovery",
		intensity: "zone1",
		purpose: "Active recovery and blood flow enhancement",
		icon: "🌱",
		color: "#84cc16",
		recoveryHours: 0,
		category: "easy",
	},
	rest: {
		type: "rest",
		name: "Rest Day",
		description: "Complete rest or light cross-training",
		intensity: "zone1",
		purpose: "Recovery, adaptation, and injury prevention",
		icon: "😴",
		color: "#6b7280",
		recoveryHours: 0,
		category: "rest",
	},
};

// Extended workout templates including fartlek
export interface ExtendedWorkoutTemplate {
	type: ExtendedWorkoutType;
	name: string;
	description: string;
	durationRange: {
		min: number; // minutes
		max: number; // minutes
	};
	distanceRange: {
		min: number; // kilometers
		max: number; // kilometers
	};
	instructions: string;
	benefits: string[];
	structure?: string; // Specific workout structure
	examples?: string[]; // Example workouts
}

export const EXTENDED_WORKOUT_TEMPLATES: Record<
	ExtendedWorkoutType,
	ExtendedWorkoutTemplate
> = {
	easy: {
		type: "easy",
		name: "Easy Run",
		description: "Comfortable aerobic run at conversational pace",
		durationRange: { min: 20, max: 60 },
		distanceRange: { min: 3, max: 12 },
		instructions:
			"Run at a comfortable pace where you can easily hold a conversation. If you're breathing hard, slow down.",
		benefits: [
			"Builds aerobic base",
			"Promotes recovery",
			"Improves running economy",
			"Develops fat-burning capacity",
		],
	},
	long: {
		type: "long",
		name: "Long Run",
		description: "Extended distance run for endurance building",
		durationRange: { min: 60, max: 180 },
		distanceRange: { min: 10, max: 35 },
		instructions:
			"Start at easy pace and maintain steady effort. Focus on time on feet rather than speed. Walk breaks are acceptable for beginners.",
		benefits: [
			"Builds endurance",
			"Improves mental toughness",
			"Enhances fat utilization",
			"Strengthens muscles and joints",
			"Prepares body for race distance",
		],
	},
	tempo: {
		type: "tempo",
		name: "Tempo Run",
		description: "Sustained effort at lactate threshold pace",
		durationRange: { min: 20, max: 60 },
		distanceRange: { min: 4, max: 12 },
		instructions:
			"Run at comfortably hard pace - you should be able to speak only a few words at a time. Maintain steady effort throughout.",
		benefits: [
			"Improves lactate threshold",
			"Enhances metabolic efficiency",
			"Builds mental toughness",
			"Develops race pace confidence",
		],
		structure: "Warm-up + Tempo segment + Cool-down",
		examples: [
			"2km warm-up + 5km tempo + 1km cool-down",
			"15min warm-up + 20min tempo + 10min cool-down",
		],
	},
	threshold: {
		type: "threshold",
		name: "Threshold Intervals",
		description: "Broken lactate threshold efforts with short recoveries",
		durationRange: { min: 30, max: 75 },
		distanceRange: { min: 5, max: 14 },
		instructions:
			"Run intervals at lactate threshold pace with short recovery periods. Focus on maintaining consistent effort across all intervals.",
		benefits: [
			"Improves lactate threshold power",
			"Enhances lactate buffering capacity",
			"Develops threshold pace familiarity",
			"Builds mental resilience at threshold effort",
			"Allows higher volume at threshold pace",
		],
		structure: "Warm-up + Threshold intervals (work/recovery) + Cool-down",
		examples: [
			"2km warm-up + 4 x 8min threshold (2min recovery) + 1km cool-down",
			"15min warm-up + 5 x 5min threshold (90sec recovery) + 10min cool-down",
			"2km warm-up + 3 x 2km threshold (400m recovery) + 1km cool-down",
		],
	},
	intervals: {
		type: "intervals",
		name: "Interval Training",
		description: "High-intensity intervals with recovery periods",
		durationRange: { min: 30, max: 90 },
		distanceRange: { min: 5, max: 12 },
		instructions:
			"Alternate between high-intensity efforts and recovery periods. Maintain target pace during work intervals.",
		benefits: [
			"Increases VO2 max",
			"Improves speed and power",
			"Enhances lactate buffering",
			"Develops neuromuscular coordination",
		],
		structure: "Warm-up + Intervals (work/recovery) + Cool-down",
		examples: [
			"2km warm-up + 6 x 800m (400m recovery) + 1km cool-down",
			"15min warm-up + 5 x 3min (90sec recovery) + 10min cool-down",
		],
	},
	hills: {
		type: "hills",
		name: "Hill Repeats",
		description: "Uphill intervals for strength and power development",
		durationRange: { min: 30, max: 75 },
		distanceRange: { min: 5, max: 10 },
		instructions:
			"Run uphill at hard effort with focus on form. Recover on downhill or flat sections between repeats.",
		benefits: [
			"Builds leg strength and power",
			"Improves running economy",
			"Enhances neuromuscular coordination",
			"Develops mental toughness",
		],
		structure:
			"Warm-up + Hill repeats (uphill effort/downhill recovery) + Cool-down",
		examples: [
			"2km warm-up + 8 x 90sec uphill + 1km cool-down",
			"15min warm-up + 6 x 2min hill + 10min cool-down",
		],
	},
	fartlek: {
		type: "fartlek",
		name: "Fartlek Training",
		description: "Unstructured speed play with varied pace changes",
		durationRange: { min: 25, max: 75 },
		distanceRange: { min: 5, max: 12 },
		instructions:
			"Vary your pace throughout the run based on feel, terrain, or landmarks. Mix fast surges with recovery periods naturally.",
		benefits: [
			"Develops speed and lactate tolerance",
			"Improves mental adaptability",
			"Enhances pace judgment",
			"Builds anaerobic capacity",
			"Adds variety and fun to training",
		],
		structure: "Warm-up + Fartlek segment (varied pace) + Cool-down",
		examples: [
			"10min easy + 20min fartlek (1-3min surges) + 5min easy",
			"2km easy + 6km fartlek (30sec-2min pickups) + 1km easy",
			"Landmark fartlek: surge to next tree/corner, recover to next landmark",
		],
	},
	marathon: {
		type: "marathon",
		name: "Marathon Pace",
		description: "Sustained effort at goal marathon pace",
		durationRange: { min: 30, max: 120 },
		distanceRange: { min: 6, max: 25 },
		instructions:
			"Run at your goal marathon pace. Focus on rhythm and efficiency rather than effort.",
		benefits: [
			"Develops race-specific fitness",
			"Improves pacing skills",
			"Builds confidence at goal pace",
			"Enhances metabolic efficiency",
		],
		structure: "Warm-up + Marathon pace segment + Cool-down",
		examples: [
			"2km easy + 10km at marathon pace + 1km easy",
			"15min easy + 45min at marathon pace + 10min easy",
		],
	},
	recovery: {
		type: "recovery",
		name: "Recovery Run",
		description: "Very easy pace for active recovery",
		durationRange: { min: 15, max: 45 },
		distanceRange: { min: 2, max: 8 },
		instructions:
			"Run very slowly - slower than easy pace. Focus on gentle movement and blood flow.",
		benefits: [
			"Promotes active recovery",
			"Enhances blood flow",
			"Maintains running rhythm",
			"Aids in waste product removal",
		],
	},
	rest: {
		type: "rest",
		name: "Rest Day",
		description: "Complete rest or light cross-training",
		durationRange: { min: 0, max: 60 },
		distanceRange: { min: 0, max: 0 },
		instructions:
			"Take complete rest or engage in light cross-training activities like walking, swimming, or yoga.",
		benefits: [
			"Allows muscle recovery",
			"Prevents overtraining",
			"Reduces injury risk",
			"Promotes adaptation",
			"Maintains motivation",
		],
	},
};

// Helper function to get extended workout definition
export function getExtendedWorkoutDefinition(
	workoutType: ExtendedWorkoutType,
): ExtendedWorkoutTypeDefinition {
	return EXTENDED_WORKOUT_TYPES[workoutType];
}

// Helper function to get extended workout template
export function getExtendedWorkoutTemplate(
	workoutType: ExtendedWorkoutType,
): ExtendedWorkoutTemplate {
	return EXTENDED_WORKOUT_TEMPLATES[workoutType];
}

// Helper function to get quality workout types
export function getQualityWorkoutTypes(): ExtendedWorkoutType[] {
	return Object.keys(EXTENDED_WORKOUT_TYPES).filter(
		(type) =>
			EXTENDED_WORKOUT_TYPES[type as ExtendedWorkoutType].category ===
			"quality",
	) as ExtendedWorkoutType[];
}
