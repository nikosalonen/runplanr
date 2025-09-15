export interface PlanConfiguration {
  raceDistance: '5K' | '10K' | 'Half Marathon' | 'Marathon';
  programLength: number; // weeks
  trainingDaysPerWeek: number; // 3-7
  restDays: string[]; // ['Monday', 'Wednesday']
  longRunDay: string; // 'Saturday'
  deloadFrequency: 3 | 4; // weeks between deload
  userExperience: 'beginner' | 'intermediate' | 'advanced';
  difficulty: 'veryEasy' | 'easy' | 'moderate' | 'hard' | 'veryHard';
  paceMethod: 'recentRace' | 'timeTrial' | 'currentPace' | 'goal' | 'fitnessLevel';
  paceData: PaceData;
}

export interface PaceData {
  method: string;
  inputData: any; // Race time, current pace, etc.
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
