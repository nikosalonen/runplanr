import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PlanConfiguration } from "@/types/configuration";
import type { TrainingPlan } from "@/types/trainingPlan";
import { usePlanRegeneration } from "../usePlanRegeneration";

// Mock the plan generator
vi.mock("../usePlanGenerator", () => ({
  usePlanGenerator: () => ({
    generatePlan: vi.fn().mockReturnValue({
      success: true,
      plan: {
        id: "new-plan-id",
        configuration: {},
        weeks: [],
        metadata: {
          totalKilometers: 100,
          totalWorkouts: 20,
          createdAt: new Date(),
          lastModified: new Date()
        }
      },
      errors: [],
      warnings: []
    })
  })
}));

describe("usePlanRegeneration", () => {
  let planRegeneration: ReturnType<typeof usePlanRegeneration>;
  let mockCurrentPlan: TrainingPlan;
  let mockConfiguration: PlanConfiguration;

  beforeEach(() => {
    planRegeneration = usePlanRegeneration();

    mockCurrentPlan = {
      id: "test-plan-id",
      configuration: {
        raceDistance: "10K",
        programLength: 12,
        trainingDaysPerWeek: 4,
        restDays: ["Monday", "Friday"],
        longRunDay: "Sunday",
        deloadFrequency: 4
      },
      weeks: [
        {
          weekNumber: 1,
          phase: "base",
          isDeloadWeek: false,
          days: [],
          weeklyVolume: 20,
          weeklyVolumeKm: 32,
          weeklyDuration: 240,
          workoutCount: 4,
          qualityWorkoutCount: 1
        }
      ],
      metadata: {
        totalMiles: 240,
        totalKilometers: 384,
        totalWorkouts: 48,
        totalTrainingDays: 48,
        totalRestDays: 36,
        createdAt: new Date("2024-01-01"),
        lastModified: new Date("2024-01-01"),
        estimatedTimeCommitment: 300,
        workoutTypeDistribution: { easy: 30, long: 12, quality: 6, rest: 36 },
        phaseDistribution: { base: 4, build: 4, peak: 2, taper: 2 },
        version: "1.0.0"
      }
    };

    mockConfiguration = {
      raceDistance: "10K",
      programLength: 12,
      trainingDaysPerWeek: 4,
      restDays: ["Monday", "Friday"],
      longRunDay: "Sunday",
      deloadFrequency: 4
    };
  });

  describe("analyzeConfigurationChanges", () => {
    it("should detect no changes when configurations are identical", () => {
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        mockConfiguration
      );

      expect(changes).toHaveLength(0);
    });

    it("should detect race distance change", () => {
      const newConfig = { ...mockConfiguration, raceDistance: "Half Marathon" as const };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: "raceDistance",
        oldValue: "10K",
        newValue: "Half Marathon",
        impact: "high"
      });
    });

    it("should detect program length change", () => {
      const newConfig = { ...mockConfiguration, programLength: 16 };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: "programLength",
        oldValue: 12,
        newValue: 16,
        impact: "high"
      });
    });

    it("should detect training days change", () => {
      const newConfig = { ...mockConfiguration, trainingDaysPerWeek: 5 };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: "trainingDaysPerWeek",
        oldValue: 4,
        newValue: 5,
        impact: "medium"
      });
    });

    it("should detect multiple changes", () => {
      const newConfig = {
        ...mockConfiguration,
        raceDistance: "Marathon" as const,
        programLength: 20,
        trainingDaysPerWeek: 5
      };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(3);
      expect(changes.map(c => c.field)).toContain("raceDistance");
      expect(changes.map(c => c.field)).toContain("programLength");
      expect(changes.map(c => c.field)).toContain("trainingDaysPerWeek");
    });

    it("should detect rest days change", () => {
      const newConfig = { ...mockConfiguration, restDays: ["Tuesday", "Saturday"] as const };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].field).toBe("restDays");
      expect(changes[0].impact).toBe("medium");
    });

    it("should detect long run day change", () => {
      const newConfig = { ...mockConfiguration, longRunDay: "Saturday" as const };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: "longRunDay",
        oldValue: "Sunday",
        newValue: "Saturday",
        impact: "medium"
      });
    });

    it("should detect deload frequency change", () => {
      const newConfig = { ...mockConfiguration, deloadFrequency: 3 as const };
      const changes = planRegeneration.analyzeConfigurationChanges(
        mockConfiguration,
        newConfig
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: "deloadFrequency",
        oldValue: 4,
        newValue: 3,
        impact: "medium"
      });
    });
  });

  describe("assessChangeImpact", () => {
    it("should assess race distance change as high impact", () => {
      const impact = planRegeneration.assessChangeImpact("raceDistance", "5K", "Marathon");
      expect(impact).toBe("high");
    });

    it("should assess program length change as high impact", () => {
      const impact = planRegeneration.assessChangeImpact("programLength", 12, 20);
      expect(impact).toBe("high");
    });

    it("should assess small training days change as medium impact", () => {
      const impact = planRegeneration.assessChangeImpact("trainingDaysPerWeek", 4, 5);
      expect(impact).toBe("medium");
    });

    it("should assess large training days change as high impact", () => {
      const impact = planRegeneration.assessChangeImpact("trainingDaysPerWeek", 3, 6);
      expect(impact).toBe("high");
    });

    it("should assess rest days change as medium impact", () => {
      const impact = planRegeneration.assessChangeImpact("restDays", ["Monday"], ["Tuesday"]);
      expect(impact).toBe("medium");
    });

    it("should assess pace data change as low impact", () => {
      const impact = planRegeneration.assessChangeImpact("paceData", {}, {});
      expect(impact).toBe("low");
    });
  });

  describe("determineRegenerationStrategy", () => {
    it("should choose minimal strategy for no changes", () => {
      const strategy = planRegeneration.determineRegenerationStrategy([], {});
      expect(strategy.type).toBe("minimal");
      expect(strategy.reason).toBe("No configuration changes detected");
    });

    it("should choose full strategy for high impact changes", () => {
      const changes = [
        {
          field: "raceDistance" as const,
          oldValue: "5K",
          newValue: "Marathon",
          impact: "high" as const
        }
      ];
      const strategy = planRegeneration.determineRegenerationStrategy(changes, {});
      expect(strategy.type).toBe("full");
      expect(strategy.reason).toBe("High impact changes detected");
    });

    it("should choose full strategy when forced", () => {
      const changes = [
        {
          field: "paceData" as const,
          oldValue: {},
          newValue: {},
          impact: "low" as const
        }
      ];
      const strategy = planRegeneration.determineRegenerationStrategy(changes, {
        forceFullRegeneration: true
      });
      expect(strategy.type).toBe("full");
      expect(strategy.reason).toBe("Full regeneration requested");
    });

    it("should choose incremental strategy for medium impact changes", () => {
      const changes = [
        {
          field: "trainingDaysPerWeek" as const,
          oldValue: 4,
          newValue: 5,
          impact: "medium" as const
        }
      ];
      const strategy = planRegeneration.determineRegenerationStrategy(changes, {});
      expect(strategy.type).toBe("incremental");
      expect(strategy.reason).toBe("Medium impact changes can be handled incrementally");
    });

    it("should choose full strategy for multiple medium impact changes", () => {
      const changes = [
        {
          field: "trainingDaysPerWeek" as const,
          oldValue: 4,
          newValue: 5,
          impact: "medium" as const
        },
        {
          field: "deloadFrequency" as const,
          oldValue: 4,
          newValue: 3,
          impact: "medium" as const
        },
        {
          field: "longRunDay" as const,
          oldValue: "Sunday",
          newValue: "Saturday",
          impact: "medium" as const
        }
      ];
      const strategy = planRegeneration.determineRegenerationStrategy(changes, {});
      expect(strategy.type).toBe("full");
      expect(strategy.reason).toBe("Multiple medium impact changes detected");
    });

    it("should choose minimal strategy for low impact changes", () => {
      const changes = [
        {
          field: "paceData" as const,
          oldValue: {},
          newValue: {},
          impact: "low" as const
        }
      ];
      const strategy = planRegeneration.determineRegenerationStrategy(changes, {});
      expect(strategy.type).toBe("minimal");
      expect(strategy.reason).toBe("Only low impact changes detected");
    });
  });

  describe("regeneratePlan", () => {
    it("should successfully regenerate plan with minimal changes", () => {
      const newConfig = { ...mockConfiguration };
      const result = planRegeneration.regeneratePlan(mockCurrentPlan, newConfig);

      expect(result.success).toBe(true);
      expect(result.regenerationType).toBe("minimal");
      expect(result.newPlan).toBeDefined();
      expect(result.comparison).toBeDefined();
    });

    it("should successfully regenerate plan with high impact changes", () => {
      const newConfig = { ...mockConfiguration, raceDistance: "Marathon" as const };
      const result = planRegeneration.regeneratePlan(mockCurrentPlan, newConfig);

      expect(result.success).toBe(true);
      expect(result.regenerationType).toBe("full");
      expect(result.newPlan).toBeDefined();
      expect(result.comparison).toBeDefined();
    });

    it("should handle regeneration errors gracefully", () => {
      // This test verifies error handling in the regeneration logic itself
      // Since we're testing a high-impact change that triggers full regeneration,
      // and our mock returns success, we'll test with an invalid plan structure instead
      const invalidPlan = {
        ...mockCurrentPlan,
        configuration: null as any
      };

      const newConfig = { ...mockConfiguration, raceDistance: "Marathon" as const };
      const result = planRegeneration.regeneratePlan(invalidPlan, newConfig);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should preserve completed workouts when requested", () => {
      const newConfig = { ...mockConfiguration, raceDistance: "Marathon" as const };
      const result = planRegeneration.regeneratePlan(mockCurrentPlan, newConfig, {
        preserveCompletedWorkouts: true
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toContain("Plan fully regenerated due to significant configuration changes");
    });

    it("should force full regeneration when requested", () => {
      const newConfig = { ...mockConfiguration };
      const result = planRegeneration.regeneratePlan(mockCurrentPlan, newConfig, {
        forceFullRegeneration: true
      });

      expect(result.success).toBe(true);
      expect(result.regenerationType).toBe("full");
    });
  });

  describe("createPlanComparison", () => {
    it("should create comparison with configuration changes", () => {
      const newPlan = {
        ...mockCurrentPlan,
        configuration: { ...mockConfiguration, raceDistance: "Marathon" as const }
      };

      const changes = [
        {
          field: "raceDistance" as const,
          oldValue: "10K",
          newValue: "Marathon",
          impact: "high" as const
        }
      ];

      const comparison = planRegeneration.createPlanComparison(
        mockCurrentPlan,
        newPlan,
        changes
      );

      expect(comparison.originalPlan).toBe(mockCurrentPlan);
      expect(comparison.modifiedPlan).toBe(newPlan);
      expect(comparison.changes).toHaveLength(1);
      expect(comparison.changes[0].type).toBe("configuration");
      expect(comparison.changes[0].field).toBe("raceDistance");
      expect(comparison.impactAssessment).toContain("1 high-impact changes detected - significant plan restructuring");
    });

    it("should include impact assessment", () => {
      const changes = [
        {
          field: "raceDistance" as const,
          oldValue: "10K",
          newValue: "Marathon",
          impact: "high" as const
        },
        {
          field: "trainingDaysPerWeek" as const,
          oldValue: 4,
          newValue: 5,
          impact: "medium" as const
        }
      ];

      const comparison = planRegeneration.createPlanComparison(
        mockCurrentPlan,
        mockCurrentPlan,
        changes
      );

      expect(comparison.impactAssessment).toContain("1 high-impact changes detected - significant plan restructuring");
      expect(comparison.impactAssessment).toContain("1 medium-impact changes - moderate adjustments to plan");
      expect(comparison.impactAssessment).toContain("Configuration changes may affect overall plan structure and progression");
    });
  });

  describe("edge cases", () => {
    it("should handle null/undefined configurations", () => {
      expect(() => {
        planRegeneration.analyzeConfigurationChanges(
          mockConfiguration,
          null as any
        );
      }).not.toThrow();
    });

    it("should handle plans with different week counts", () => {
      const shortPlan = {
        ...mockCurrentPlan,
        weeks: mockCurrentPlan.weeks.slice(0, 1)
      };

      const longPlan = {
        ...mockCurrentPlan,
        weeks: [
          ...mockCurrentPlan.weeks,
          {
            weekNumber: 2,
            phase: "base" as const,
            isDeloadWeek: false,
            days: [],
            weeklyVolume: 22,
            weeklyVolumeKm: 35,
            weeklyDuration: 260,
            workoutCount: 4,
            qualityWorkoutCount: 1
          }
        ]
      };

      expect(() => {
        planRegeneration.createPlanComparison(shortPlan, longPlan, []);
      }).not.toThrow();
    });

    it("should handle invalid plan structures gracefully", () => {
      const invalidPlan = {
        ...mockCurrentPlan,
        weeks: null as any
      };

      const result = planRegeneration.regeneratePlan(
        invalidPlan,
        mockConfiguration
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
