export interface DifficultyLevel {
  level: string;
  multiplier: number;
  label: string;
  description: string;
  icon: string;
  color: string;
  volumeAdjustment: number;
  intensityAdjustment: number;
  recoveryMultiplier: number;
  progressionRate: number;
}

export const DIFFICULTY_LEVELS: Record<string, DifficultyLevel> = {
  veryEasy: {
    level: 'veryEasy',
    multiplier: 0.7,
    label: 'Recovery/Base Building',
    description: 'Lower volume, more recovery, gentler progression',
    icon: '🌱',
    color: '#10b981',
    volumeAdjustment: 0.7,
    intensityAdjustment: 0.95,
    recoveryMultiplier: 1.5,
    progressionRate: 0.05
  },
  easy: {
    level: 'easy',
    multiplier: 0.85,
    label: 'Conservative',
    description: 'Safe progression, extra recovery',
    icon: '🏃',
    color: '#22c55e',
    volumeAdjustment: 0.85,
    intensityAdjustment: 0.97,
    recoveryMultiplier: 1.25,
    progressionRate: 0.07
  },
  moderate: {
    level: 'moderate',
    multiplier: 1.0,
    label: 'Standard',
    description: 'Typical training load for target race',
    icon: '⚡',
    color: '#3b82f6',
    volumeAdjustment: 1.0,
    intensityAdjustment: 1.0,
    recoveryMultiplier: 1.0,
    progressionRate: 0.10
  },
  hard: {
    level: 'hard',
    multiplier: 1.15,
    label: 'Aggressive',
    description: 'Higher volume, faster progression',
    icon: '🔥',
    color: '#f59e0b',
    volumeAdjustment: 1.15,
    intensityAdjustment: 1.02,
    recoveryMultiplier: 0.9,
    progressionRate: 0.12
  },
  veryHard: {
    level: 'veryHard',
    multiplier: 1.3,
    label: 'Advanced/Competitive',
    description: 'High volume, demanding workouts',
    icon: '💪',
    color: '#ef4444',
    volumeAdjustment: 1.3,
    intensityAdjustment: 1.03,
    recoveryMultiplier: 0.8,
    progressionRate: 0.15
  }
};

export const DIFFICULTY_OPTIONS = Object.keys(DIFFICULTY_LEVELS) as Array<keyof typeof DIFFICULTY_LEVELS>;
