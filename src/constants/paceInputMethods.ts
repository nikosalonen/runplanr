export interface PaceInputMethod {
	method: string;
	priority: number;
	accuracy: string;
	description: string;
	icon: string;
	label: string;
}

export const PACE_INPUT_METHODS: Record<string, PaceInputMethod> = {
	recentRace: {
		method: "recentRace",
		priority: 1,
		accuracy: "highest",
		description: "Most accurate - based on actual performance",
		icon: "📊",
		label: "Recent Race Time",
	},
	timeTrial: {
		method: "timeTrial",
		priority: 2,
		accuracy: "high",
		description: "5K or 3K time trial for current fitness",
		icon: "⏱️",
		label: "Time Trial",
	},
	currentPace: {
		method: "currentPace",
		priority: 3,
		accuracy: "moderate",
		description: "Average easy run pace from recent training",
		icon: "🏃",
		label: "Current Training Pace",
	},
	goal: {
		method: "goal",
		priority: 4,
		accuracy: "low",
		description: "Least accurate - aspirational",
		icon: "🎯",
		label: "Goal Race Time",
	},
	fitnessLevel: {
		method: "fitnessLevel",
		priority: 5,
		accuracy: "estimate",
		description: "Rough estimate based on experience level",
		icon: "📝",
		label: "Fitness Level Assessment",
	},
};

export const PACE_INPUT_OPTIONS = Object.keys(PACE_INPUT_METHODS) as Array<
	keyof typeof PACE_INPUT_METHODS
>;
