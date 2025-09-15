import type { WorkoutType, IntensityZone } from '@/types';

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

export const WORKOUT_TYPES: Record<WorkoutType, WorkoutTypeDefinition> = {
  easy: {
    type: 'easy',
    name: 'Easy Run',
    description: 'Comfortable, conversational pace',
    intensity: 'zone2',
    purpose: 'Aerobic base building, recovery',
    icon: '🚶‍♂️',
    color: '#22c55e',
    recoveryHours: 0
  },
  long: {
    type: 'long',
    name: 'Long Run',
    description: 'Extended distance at easy to moderate pace',
    intensity: 'zone2',
    purpose: 'Endurance building, mental toughness',
    icon: '🏃‍♂️',
    color: '#3b82f6',
    recoveryHours: 24
  },
  tempo: {
    type: 'tempo',
    name: 'Tempo Run',
    description: 'Comfortably hard, sustainable effort',
    intensity: 'zone4',
    purpose: 'Lactate threshold improvement',
    icon: '⚡',
    color: '#f59e0b',
    recoveryHours: 48
  },
  intervals: {
    type: 'intervals',
    name: 'Interval Training',
    description: 'Hard efforts with recovery periods',
    intensity: 'zone5',
    purpose: 'VO2 max development, speed',
    icon: '🔥',
    color: '#ef4444',
    recoveryHours: 48
  },
  hills: {
    type: 'hills',
    name: 'Hill Repeats',
    description: 'Uphill efforts for strength and power',
    intensity: 'zone4',
    purpose: 'Strength, power, running economy',
    icon: '⛰️',
    color: '#8b5cf6',
    recoveryHours: 48
  },
  marathon: {
    type: 'marathon',
    name: 'Marathon Pace',
    description: 'Race-specific pace training',
    intensity: 'zone3',
    purpose: 'Race pace familiarity',
    icon: '🎯',
    color: '#06b6d4',
    recoveryHours: 24
  },
  recovery: {
    type: 'recovery',
    name: 'Recovery Run',
    description: 'Very easy, short distance',
    intensity: 'zone1',
    purpose: 'Active recovery, blood flow',
    icon: '🌱',
    color: '#10b981',
    recoveryHours: 0
  },
  rest: {
    type: 'rest',
    name: 'Rest Day',
    description: 'Complete rest or cross-training',
    intensity: 'zone1',
    purpose: 'Recovery, adaptation',
    icon: '😴',
    color: '#6b7280',
    recoveryHours: 0
  }
};
