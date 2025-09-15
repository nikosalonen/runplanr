export type RaceDistance = "5K" | "10K" | "Half Marathon" | "Marathon";
export type DayOfWeek =
	| "Monday"
	| "Tuesday"
	| "Wednesday"
	| "Thursday"
	| "Friday"
	| "Saturday"
	| "Sunday";
export type UserExperience = "beginner" | "intermediate" | "advanced";
export type DifficultyLevel =
	| "veryEasy"
	| "easy"
	| "moderate"
	| "hard"
	| "veryHard";
export type PaceMethod =
	| "recentRace"
	| "timeTrial"
	| "currentPace"
	| "goal"
	| "fitnessLevel";

export interface PlanConfiguration {
	raceDistance: RaceDistance;
	programLength: number; // weeks (8-24)
	trainingDaysPerWeek: number; // 3-7
	restDays: DayOfWeek[]; // ['Monday', 'Wednesday']
	longRunDay: DayOfWeek; // 'Saturday'
	deloadFrequency: 3 | 4; // weeks between deload
	userExperience?: UserExperience; // Optional for MVP
	difficulty?: DifficultyLevel; // Optional for MVP
	paceMethod?: PaceMethod; // Optional for MVP
	paceData?: PaceData; // Optional for MVP
}

export interface PaceData {
	method: string;
	inputData: unknown; // Race time, current pace, etc.
	calculatedPaces: TrainingPaces;
	vdot?: number;
}

export interface TrainingPaces {
	recovery: PaceRange;
	easy: PaceRange;
	marathon: PaceRange;
	threshold: PaceRange;
	interval: PaceRange;
	repetition: PaceRange;
}

export interface PaceRange {
	minPace: number; // seconds per km/mile
	maxPace: number;
	targetPace: number;
}
// Validation result types
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationError {
	field: keyof PlanConfiguration;
	message: string;
	code: string;
}

export interface ValidationWarning {
	field: keyof PlanConfiguration;
	message: string;
	code: string;
	severity: "low" | "medium" | "high";
}

// Configuration constraints
export interface ConfigurationConstraints {
	programLength: {
		min: number;
		max: number;
		recommended: {
			[key in RaceDistance]: {
				min: number;
				optimal: number;
			};
		};
	};
	trainingDays: {
		min: number;
		max: number;
		recommended: number;
	};
	restDays: {
		min: number;
		max: number;
	};
}

// Default configuration constraints
export const CONFIGURATION_CONSTRAINTS: ConfigurationConstraints = {
	programLength: {
		min: 6,
		max: 24,
		recommended: {
			"5K": { min: 6, optimal: 8 },
			"10K": { min: 8, optimal: 10 },
			"Half Marathon": { min: 10, optimal: 12 },
			Marathon: { min: 12, optimal: 16 },
		},
	},
	trainingDays: {
		min: 3,
		max: 7,
		recommended: 5,
	},
	restDays: {
		min: 1,
		max: 4,
	},
};

// Days of the week for validation
export const DAYS_OF_WEEK: DayOfWeek[] = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

// Default configuration values
export const DEFAULT_CONFIGURATION: Partial<PlanConfiguration> = {
	programLength: 12,
	trainingDaysPerWeek: 4,
	restDays: ["Monday", "Friday"],
	longRunDay: "Sunday",
	deloadFrequency: 4,
	userExperience: "intermediate",
	difficulty: "moderate",
};
