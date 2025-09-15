import type { IntensityZone } from '@/types';

export interface TrainingZone {
  zone: IntensityZone;
  name: string;
  description: string;
  heartRatePercent: {
    min: number;
    max: number;
  };
  effortLevel: string;
  purpose: string;
  color: string;
}

export const TRAINING_ZONES: Record<IntensityZone, TrainingZone> = {
  zone1: {
    zone: 'zone1',
    name: 'Recovery',
    description: 'Very easy, conversational pace',
    heartRatePercent: { min: 50, max: 60 },
    effortLevel: 'Very Easy',
    purpose: 'Active recovery, injury prevention',
    color: '#10b981'
  },
  zone2: {
    zone: 'zone2',
    name: 'Aerobic Base',
    description: 'Easy, comfortable pace',
    heartRatePercent: { min: 60, max: 70 },
    effortLevel: 'Easy',
    purpose: 'Aerobic development, fat burning',
    color: '#22c55e'
  },
  zone3: {
    zone: 'zone3',
    name: 'Aerobic Threshold',
    description: 'Moderate effort, slightly uncomfortable',
    heartRatePercent: { min: 70, max: 80 },
    effortLevel: 'Moderate',
    purpose: 'Aerobic capacity improvement',
    color: '#3b82f6'
  },
  zone4: {
    zone: 'zone4',
    name: 'Lactate Threshold',
    description: 'Hard but sustainable effort',
    heartRatePercent: { min: 80, max: 90 },
    effortLevel: 'Hard',
    purpose: 'Lactate threshold improvement',
    color: '#f59e0b'
  },
  zone5: {
    zone: 'zone5',
    name: 'VO2 Max',
    description: 'Very hard, unsustainable effort',
    heartRatePercent: { min: 90, max: 100 },
    effortLevel: 'Very Hard',
    purpose: 'VO2 max development, speed',
    color: '#ef4444'
  }
};
