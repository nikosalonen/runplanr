// MVP workout types - focusing on core types for initial implementation
export type WorkoutType = "easy" | "long" | "quality" | "rest";

// Extended workout types for future phases
export type ExtendedWorkoutType =
	| "easy"
	| "long"
	| "tempo"
	| "threshold"
	| "intervals"
	| "hills"
	| "fartlek"
	| "marathon"
	| "recovery"
	| "rest";

export type IntensityZone = "zone1" | "zone2" | "zone3" | "zone4" | "zone5";

export type TrainingPhase = "base" | "build" | "peak" | "taper";

export interface Workout {
	type: WorkoutType;
	duration: number; // minutes
	distance?: number; // miles or km
	intensity: IntensityZone;
	description: string;
	paceGuidance: string;
	recoveryTime: number; // hours before next hard workout
	targetPace?: number;
	paceRange?: {
		min: number;
		max: number;
	};
	paceInstruction?: string;
	displayPace?: string;
}

export interface DailyWorkout {
	dayOfWeek: string;
	workout?: Workout;
	isRestDay: boolean;
	notes?: string;
}
