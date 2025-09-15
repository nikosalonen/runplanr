export interface RaceDistance {
	name: string;
	distance: number; // in meters
	minWeeks: number;
	recommendedWeeks: number;
	maxWeeks: number;
	description: string;
	icon: string;
}

export const RACE_DISTANCES: Record<string, RaceDistance> = {
	"5K": {
		name: "5K",
		distance: 5000,
		minWeeks: 6,
		recommendedWeeks: 8,
		maxWeeks: 12,
		description: "Fast-paced race focusing on speed and VO2 max",
		icon: "🏃‍♂️",
	},
	"10K": {
		name: "10K",
		distance: 10000,
		minWeeks: 8,
		recommendedWeeks: 10,
		maxWeeks: 16,
		description: "Balance of speed and endurance",
		icon: "🏃‍♀️",
	},
	"Half Marathon": {
		name: "Half Marathon",
		distance: 21097,
		minWeeks: 10,
		recommendedWeeks: 12,
		maxWeeks: 20,
		description: "Endurance race with lactate threshold focus",
		icon: "🏃",
	},
	Marathon: {
		name: "Marathon",
		distance: 42195,
		minWeeks: 12,
		recommendedWeeks: 16,
		maxWeeks: 24,
		description: "Ultimate endurance challenge",
		icon: "🏃‍♂️",
	},
};

export const RACE_DISTANCE_OPTIONS = Object.keys(RACE_DISTANCES) as Array<
	keyof typeof RACE_DISTANCES
>;
