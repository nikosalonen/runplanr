import { describe, it, expect } from 'vitest';
import { useProgressionRules } from '../useProgressionRules';
import type { ProgressionConfig } from '../useProgressionRules';

describe('useProgressionRules', () => {
  const progressionRules = useProgressionRules();

  describe('calculateStartingDistance', () => {
    it('should return correct starting distance for different race distances and experience levels (in km)', () => {
      // 5K distances
      expect(progressionRules.calculateStartingDistance('5K', 'beginner')).toBe(24);
      expect(progressionRules.calculateStartingDistance('5K', 'intermediate')).toBe(32);
      expect(progressionRules.calculateStartingDistance('5K', 'advanced')).toBe(40);

      // Marathon distances
      expect(progressionRules.calculateStartingDistance('Marathon', 'beginner')).toBe(48);
      expect(progressionRules.calculateStartingDistance('Marathon', 'intermediate')).toBe(64);
      expect(progressionRules.calculateStartingDistance('Marathon', 'advanced')).toBe(80);
    });

    it('should default to intermediate level when experience not specified', () => {
      expect(progressionRules.calculateStartingDistance('Half Marathon')).toBe(48);
    });
  });

  describe('getMaxWeeklyDistance', () => {
    it('should return appropriate maximum distance caps (in km)', () => {
      // 5K caps
      expect(progressionRules.getMaxWeeklyDistance('5K', 'beginner')).toBe(56);
      expect(progressionRules.getMaxWeeklyDistance('5K', 'advanced')).toBe(88);

      // Marathon caps
      expect(progressionRules.getMaxWeeklyDistance('Marathon', 'beginner')).toBe(104);
      expect(progressionRules.getMaxWeeklyDistance('Marathon', 'advanced')).toBe(160);
    });
  });

  describe('isDeloadWeekNumber', () => {
    it('should correctly identify deload weeks with 4-week frequency', () => {
      expect(progressionRules.isDeloadWeekNumber(1, 4)).toBe(false); // Week 1 never deload
      expect(progressionRules.isDeloadWeekNumber(4, 4)).toBe(true);
      expect(progressionRules.isDeloadWeekNumber(8, 4)).toBe(true);
      expect(progressionRules.isDeloadWeekNumber(12, 4)).toBe(true);
      expect(progressionRules.isDeloadWeekNumber(5, 4)).toBe(false);
    });

    it('should correctly identify deload weeks with 3-week frequency', () => {
      expect(progressionRules.isDeloadWeekNumber(1, 3)).toBe(false); // Week 1 never deload
      expect(progressionRules.isDeloadWeekNumber(3, 3)).toBe(true);
      expect(progressionRules.isDeloadWeekNumber(6, 3)).toBe(true);
      expect(progressionRules.isDeloadWeekNumber(9, 3)).toBe(true);
      expect(progressionRules.isDeloadWeekNumber(4, 3)).toBe(false);
    });
  });

  describe('calculateDeloadVolume', () => {
    it('should reduce volume by 20-30% range', () => {
      const baseVolume = 40;
      const deloadVolume = progressionRules.calculateDeloadVolume(baseVolume);

      // Should be between 28-32 km (30% to 20% reduction)
      expect(deloadVolume).toBeGreaterThanOrEqual(28);
      expect(deloadVolume).toBeLessThanOrEqual(32);
    });

    it('should use custom reduction percentage when provided', () => {
      const baseVolume = 40;
      const customReduction = 0.25; // 25% reduction
      const deloadVolume = progressionRules.calculateDeloadVolume(baseVolume, customReduction);

      expect(deloadVolume).toBe(30); // 40 * 0.75 = 30
    });
  });

  describe('calculateWeeklyVolumes', () => {
    const baseConfig: ProgressionConfig = {
      raceDistance: 'Half Marathon',
      programLength: 12,
      trainingDaysPerWeek: 4,
      deloadFrequency: 4,
      userExperience: 'intermediate'
    };

    it('should generate correct number of weeks', () => {
      const volumes = progressionRules.calculateWeeklyVolumes(baseConfig);
      expect(volumes).toHaveLength(12);
    });

    it('should start with appropriate base distance', () => {
      const volumes = progressionRules.calculateWeeklyVolumes(baseConfig);
      expect(volumes[0].adjustedVolume).toBe(48); // Half Marathon intermediate starting distance in km
    });

    it('should identify deload weeks correctly', () => {
      const volumes = progressionRules.calculateWeeklyVolumes(baseConfig);

      // Week 4, 8, 12 should be deload weeks with 4-week frequency
      expect(volumes[3].isDeloadWeek).toBe(true); // Week 4
      expect(volumes[7].isDeloadWeek).toBe(true); // Week 8
      expect(volumes[11].isDeloadWeek).toBe(true); // Week 12

      // Other weeks should not be deload
      expect(volumes[0].isDeloadWeek).toBe(false); // Week 1
      expect(volumes[4].isDeloadWeek).toBe(false); // Week 5
    });

    it('should reduce volume during deload weeks', () => {
      const volumes = progressionRules.calculateWeeklyVolumes(baseConfig);

      // Find first deload week (week 4)
      const deloadWeek = volumes.find(v => v.isDeloadWeek);
      expect(deloadWeek).toBeDefined();

      if (deloadWeek) {
        // Deload volume should be 20-30% less than base volume (with some tolerance for rounding)
        const reductionRatio = (deloadWeek.baseVolume - deloadWeek.adjustedVolume) / deloadWeek.baseVolume;
        expect(reductionRatio).toBeGreaterThanOrEqual(0.19); // Allow slight tolerance for rounding
        expect(reductionRatio).toBeLessThanOrEqual(0.31); // Allow slight tolerance for rounding
      }
    });

    it('should not exceed maximum weekly increase of 10%', () => {
      const volumes = progressionRules.calculateWeeklyVolumes(baseConfig);

      for (let i = 1; i < volumes.length; i++) {
        const current = volumes[i];
        const previous = volumes[i - 1];

        // Skip deload weeks for progression check
        if (!current.isDeloadWeek && !previous.isDeloadWeek) {
          const increase = (current.adjustedVolume - previous.adjustedVolume) / previous.adjustedVolume;
          expect(increase).toBeLessThanOrEqual(0.10); // 10% max increase
        }
      }
    });

    it('should not exceed maximum distance caps', () => {
      const longConfig: ProgressionConfig = {
        ...baseConfig,
        programLength: 20, // Longer program to test caps
        userExperience: 'intermediate'
      };

      const volumes = progressionRules.calculateWeeklyVolumes(longConfig);
      const maxDistance = progressionRules.getMaxWeeklyDistance('Half Marathon', 'intermediate');

      volumes.forEach(volume => {
        expect(volume.adjustedVolume).toBeLessThanOrEqual(maxDistance);
      });
    });

    it('should handle different experience levels appropriately', () => {
      const beginnerConfig: ProgressionConfig = {
        ...baseConfig,
        userExperience: 'beginner'
      };

      const advancedConfig: ProgressionConfig = {
        ...baseConfig,
        userExperience: 'advanced'
      };

      const beginnerVolumes = progressionRules.calculateWeeklyVolumes(beginnerConfig);
      const advancedVolumes = progressionRules.calculateWeeklyVolumes(advancedConfig);

      // Advanced should start higher and reach higher peaks
      expect(advancedVolumes[0].adjustedVolume).toBeGreaterThan(beginnerVolumes[0].adjustedVolume);
    });
  });

  describe('validateProgression', () => {
    it('should validate safe progression plans', () => {
      const config: ProgressionConfig = {
        raceDistance: '10K',
        programLength: 10,
        trainingDaysPerWeek: 4,
        deloadFrequency: 4,
        userExperience: 'intermediate'
      };

      const volumes = progressionRules.calculateWeeklyVolumes(config);
      const validation = progressionRules.validateProgression(volumes);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should warn about aggressive progression', () => {
      // Create a mock progression with excessive increases
      const aggressiveVolumes = [
        { weekNumber: 1, baseVolume: 20, adjustedVolume: 20, isDeloadWeek: false, progressionRate: 0, notes: [] },
        { weekNumber: 2, baseVolume: 20, adjustedVolume: 25, isDeloadWeek: false, progressionRate: 0.25, notes: [] }, // 25% increase
      ];

      const validation = progressionRules.validateProgression(aggressiveVolumes);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('exceeds 10% safety limit');
    });

    it('should suggest more deload weeks when frequency is too low', () => {
      // Create a mock progression with no deload weeks
      const noDeloadVolumes = Array.from({ length: 12 }, (_, i) => ({
        weekNumber: i + 1,
        baseVolume: 20 + i,
        adjustedVolume: 20 + i,
        isDeloadWeek: false,
        progressionRate: 0.05,
        notes: []
      }));

      const validation = progressionRules.validateProgression(noDeloadVolumes);

      expect(validation.warnings.some(w => w.includes('deload weeks'))).toBe(true);
    });
  });

  describe('adjustAggressiveProgression', () => {
    it('should cap excessive weekly increases', () => {
      const previousVolume = 30;
      const aggressiveTarget = 40; // 33% increase
      const maxSafe = 50;

      const result = progressionRules.adjustAggressiveProgression(
        aggressiveTarget,
        previousVolume,
        maxSafe
      );

      // Should be capped at 10% increase: 30 * 1.1 = 33
      expect(result.adjustedVolume).toBe(33);
      expect(result.notes.length).toBeGreaterThan(0);
      expect(result.notes[0]).toContain('capped at 10%');
    });

    it('should cap at maximum safe volume', () => {
      const previousVolume = 30;
      const targetVolume = 35; // 16.7% increase but within 10% cap
      const maxSafe = 32; // Lower than target

      const result = progressionRules.adjustAggressiveProgression(
        targetVolume,
        previousVolume,
        maxSafe
      );

      expect(result.adjustedVolume).toBe(32);
      expect(result.notes.some(n => n.includes('maximum for experience level'))).toBe(true);
    });
  });

  describe('getProgressionRecommendations', () => {
    it('should return appropriate recommendations for each race distance', () => {
      const marathonRecs = progressionRules.getProgressionRecommendations('Marathon');

      expect(marathonRecs.minWeeks).toBe(12);
      expect(marathonRecs.recommendedWeeks).toBe(16);
      expect(marathonRecs.maxWeeks).toBe(24);
      expect(marathonRecs.recommendedDeloadFrequency).toBe(3); // More frequent for marathon
      expect(marathonRecs.startingDistance.beginner).toBe(48);
      expect(marathonRecs.maxDistance.advanced).toBe(160);
    });

    it('should recommend different deload frequencies based on race distance', () => {
      const marathonRecs = progressionRules.getProgressionRecommendations('Marathon');
      const fiveKRecs = progressionRules.getProgressionRecommendations('5K');

      expect(marathonRecs.recommendedDeloadFrequency).toBe(3); // More frequent for marathon
      expect(fiveKRecs.recommendedDeloadFrequency).toBe(4); // Less frequent for shorter races
    });
  });

  describe('integration tests', () => {
    it('should create a complete progression plan that follows all rules', () => {
      const config: ProgressionConfig = {
        raceDistance: 'Marathon',
        programLength: 16,
        trainingDaysPerWeek: 5,
        deloadFrequency: 4,
        userExperience: 'intermediate'
      };

      const volumes = progressionRules.calculateWeeklyVolumes(config);
      const validation = progressionRules.validateProgression(volumes);

      // Should be valid
      expect(validation.isValid).toBe(true);

      // Should have correct number of weeks
      expect(volumes).toHaveLength(16);

      // Should have deload weeks
      const deloadWeeks = volumes.filter(v => v.isDeloadWeek);
      expect(deloadWeeks.length).toBeGreaterThan(0);

      // Should start with appropriate distance
      expect(volumes[0].adjustedVolume).toBe(64); // Marathon intermediate in km

      // Should not exceed maximum distance
      const maxDistance = progressionRules.getMaxWeeklyDistance('Marathon', 'intermediate');
      volumes.forEach(volume => {
        expect(volume.adjustedVolume).toBeLessThanOrEqual(maxDistance);
      });

      // Should show progressive increase (excluding deload weeks)
      const nonDeloadWeeks = volumes.filter(v => !v.isDeloadWeek);
      for (let i = 1; i < nonDeloadWeeks.length; i++) {
        expect(nonDeloadWeeks[i].adjustedVolume).toBeGreaterThanOrEqual(nonDeloadWeeks[i - 1].adjustedVolume);
      }
    });
  });
});
