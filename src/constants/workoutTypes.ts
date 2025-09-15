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

// MVP workout type definitions - core types for initial implementation
export const MVP_WORKOUT_TYPES: Record<WorkoutType, WorkoutTypeDefinition> = {
  easy: {
    type: 'easy',
    name: 'Easy Run',
    description: 'Comfortable, conversational pace. You should be able to hold a conversation while running.',
    intensity: 'zone2',
    purpose: 'Aerobic base building, recovery, and adaptation',
    icon: '🚶‍♂️',
    color: '#22c55e',
    recoveryHours: 0
  },
  long: {
    type: 'long',
    name: 'Long Run',
    description: 'Extended distance at easy to moderate pace. Builds endurance and mental toughness.',
    intensity: 'zone2',
    purpose: 'Endurance building, mental toughness, and aerobic capacity',
    icon: '🏃‍♂️',
    color: '#3b82f6',
    recoveryHours: 24
  },
  quality: {
    type: 'quality',
    name: 'Quality Workout',
    description: 'Higher intensity workout including tempo runs, intervals, or hill repeats.',
    intensity: 'zone4',
    purpose: 'Speed, lactate threshold, and VO2 max development',
    icon: '⚡',
    color: '#f59e0b',
    recoveryHours: 48
  },
  rest: {
    type: 'rest',
    name: 'Rest Day',
    description: 'Complete rest or light cross-training. Essential for recovery and adaptation.',
    intensity: 'zone1',
    purpose: 'Recovery, adaptation, and injury prevention',
    icon: '😴',
    color: '#6b7280',
    recoveryHours: 0
  }
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
    type: 'easy',
    name: 'Easy Run',
    description: 'Comfortable aerobic run at conversational pace',
    durationRange: { min: 20, max: 60 },
    distanceRange: { min: 2, max: 8 },
    instructions: 'Run at a comfortable pace where you can easily hold a conversation. If you\'re breathing hard, slow down.',
    benefits: [
      'Builds aerobic base',
      'Promotes recovery',
      'Improves running economy',
      'Develops fat-burning capacity'
    ]
  },
  long: {
    type: 'long',
    name: 'Long Run',
    description: 'Extended distance run for endurance building',
    durationRange: { min: 60, max: 180 },
    distanceRange: { min: 6, max: 22 },
    instructions: 'Start at easy pace and maintain steady effort. Focus on time on feet rather than speed. Walk breaks are acceptable for beginners.',
    benefits: [
      'Builds endurance',
      'Improves mental toughness',
      'Enhances fat utilization',
      'Strengthens muscles and joints',
      'Prepares body for race distance'
    ]
  },
  quality: {
    type: 'quality',
    name: 'Quality Workout',
    description: 'Higher intensity training session',
    durationRange: { min: 30, max: 90 },
    distanceRange: { min: 3, max: 10 },
    instructions: 'Warm up thoroughly, then complete the prescribed workout at the target intensity. Cool down with easy running.',
    benefits: [
      'Improves lactate threshold',
      'Increases VO2 max',
      'Develops speed and power',
      'Enhances running economy',
      'Builds race-specific fitness'
    ]
  },
  rest: {
    type: 'rest',
    name: 'Rest Day',
    description: 'Complete rest or light cross-training',
    durationRange: { min: 0, max: 60 },
    distanceRange: { min: 0, max: 0 },
    instructions: 'Take complete rest or engage in light cross-training activities like walking, swimming, or yoga.',
    benefits: [
      'Allows muscle recovery',
      'Prevents overtraining',
      'Reduces injury risk',
      'Promotes adaptation',
      'Maintains motivation'
    ]
  }
};

// Helper function to create workout instances from templates
export function createWorkoutFromTemplate(
  workoutType: WorkoutType,
  duration: number,
  distance?: number
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
    recoveryTime: definition.recoveryHours
  };
}

// Helper function to get workout benefits
export function getWorkoutBenefits(workoutType: WorkoutType): string[] {
  return MVP_WORKOUT_TEMPLATES[workoutType].benefits;
}

// Helper function to validate workout duration against template ranges
export function isValidWorkoutDuration(workoutType: WorkoutType, duration: number): boolean {
  const template = MVP_WORKOUT_TEMPLATES[workoutType];
  return duration >= template.durationRange.min && duration <= template.durationRange.max;
}

// Helper function to validate workout distance against template ranges
export function isValidWorkoutDistance(workoutType: WorkoutType, distance: number): boolean {
  const template = MVP_WORKOUT_TEMPLATES[workoutType];
  return distance >= template.distanceRange.min && distance <= template.distanceRange.max;
}
