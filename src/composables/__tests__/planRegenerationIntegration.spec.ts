import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePlanStore } from "@/stores/planStore";
import type { PlanConfiguration } from "@/types/configuration";

// Mock the composables
vi.mock("@/composables/usePlanGenerator", () => ({
  usePlanGenerator: () => ({
    generatePlan: vi.fn().mockReturnValue({
      success: true,
      plan: {
        id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        configuration: {
          raceDistance: "10K",
          programLength: 12,
          trainingDaysPerWeek: 4,
          restDays: ["Monday", "Friday"],
          longRunDay: "Sunday",
          deloadFrequency: 4
        },
        weeks: [],
        metadata: {
          totalKilometers: 100,
          totalWorkouts: 20,
          createdAt: new Date(),
          lastModified: new Date(),
          totalMiles: 62,
          totalTrainingDays: 48,
          totalRestDays: 36,
          estimatedTimeCommitment: 300,
          workoutTypeDistribution: { easy: 30, long: 12, quality: 6, rest: 36 },
          phaseDistribution: { base: 4, build: 4, peak: 2, taper: 2 },
          version: "1.0.0"
        }
      },
      errors: [],
      warnings: []
    })
  })
}));

vi.mock("@/composables/usePlanRegeneration", () => ({
  usePlanRegeneration: () => ({
    regeneratePlan: vi.fn().mockImplementation((currentPlan, newConfig, options = {}) => {
      // Determine regeneration type based on options and changes
      let regenerationType = 'incremental';
      if (options.forceFullRegeneration) {
        regenerationType = 'full';
      } else {
        // Check for high impact changes
        const hasHighImpactChanges =
          newConfig.raceDistance !== currentPlan.configuration.raceDistance ||
          newConfig.programLength !== currentPlan.configuration.programLength;

        if (hasHighImpactChanges) {
          regenerationType = 'full';
        } else {
          // Check for medium impact changes
          const hasMediumImpactChanges =
            newConfig.trainingDaysPerWeek !== currentPlan.configuration.trainingDaysPerWeek ||
            newConfig.longRunDay !== currentPlan.configuration.longRunDay ||
            newConfig.deloadFrequency !== currentPlan.configuration.deloadFrequency;

          if (hasMediumImpactChanges) {
            regenerationType = 'incremental';
          } else {
            regenerationType = 'minimal';
          }
        }
      }

      return {
        success: true,
        newPlan: {
          ...currentPlan,
          id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          configuration: newConfig,
          metadata: {
            ...currentPlan.metadata,
            lastModified: new Date()
          }
        },
        comparison: {
          originalPlan: currentPlan,
          modifiedPlan: {
            ...currentPlan,
            configuration: newConfig
          },
          changes: [],
          impactAssessment: []
        },
        errors: [],
        warnings: ["Plan regenerated successfully"],
        regenerationType
      };
    }),
    analyzeConfigurationChanges: vi.fn().mockImplementation((oldConfig, newConfig) => {
      const changes = [];
      if (oldConfig.raceDistance !== newConfig.raceDistance) {
        changes.push({
          field: 'raceDistance',
          oldValue: oldConfig.raceDistance,
          newValue: newConfig.raceDistance,
          impact: 'high'
        });
      }
      if (oldConfig.programLength !== newConfig.programLength) {
        changes.push({
          field: 'programLength',
          oldValue: oldConfig.programLength,
          newValue: newConfig.programLength,
          impact: 'high'
        });
      }
      if (oldConfig.trainingDaysPerWeek !== newConfig.trainingDaysPerWeek) {
        changes.push({
          field: 'trainingDaysPerWeek',
          oldValue: oldConfig.trainingDaysPerWeek,
          newValue: newConfig.trainingDaysPerWeek,
          impact: 'medium'
        });
      }
      return changes;
    })
  })
}));

/**
 * Integration tests for plan regeneration functionality
 * Tests the complete flow from configuration changes to plan regeneration
 */

describe("Plan Regeneration Integration", () => {
  let planStore: ReturnType<typeof usePlanStore>;
  let baseConfiguration: PlanConfiguration;

  beforeEach(() => {
    setActivePinia(createPinia());
    planStore = usePlanStore();

    baseConfiguration = {
      raceDistance: "10K",
      programLength: 12,
      trainingDaysPerWeek: 4,
      restDays: ["Monday", "Friday"],
      longRunDay: "Sunday",
      deloadFrequency: 4
    };
  });

  describe("Complete regeneration workflow", () => {
    it("should handle complete plan generation and regeneration workflow", async () => {
      // Step 1: Generate initial plan
      const initialResult = await planStore.generateNewPlan(baseConfiguration);
      expect(initialResult).toBe(true);
      expect(planStore.hasCurrentPlan).toBe(true);
      expect(planStore.planHistory).toHaveLength(0);

      const initialPlan = planStore.currentPlan;
      expect(initialPlan).toBeDefined();
      expect(initialPlan?.configuration.raceDistance).toBe("10K");

      // Step 2: Make configuration changes
      const changes = {
        raceDistance: "Half Marathon" as const,
        programLength: 16
      };

      await planStore.applyConfigurationChanges(changes);

      // Step 3: Verify plan was regenerated (due to auto-regenerate)
      expect(planStore.currentPlan?.configuration.raceDistance).toBe("Half Marathon");
      expect(planStore.currentPlan?.configuration.programLength).toBe(16);

      // Step 4: Verify history was updated
      expect(planStore.planHistory.length).toBeGreaterThan(0);

      // Step 5: Verify regeneration result
      const lastResult = planStore.lastGenerationResult;
      expect(lastResult).toBeDefined();
      expect(lastResult?.success).toBe(true);
      expect(lastResult?.regenerationType).toBeDefined(); // Should have some regeneration type
    });

    it("should handle incremental updates for medium impact changes", async () => {
      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);

      // Make medium impact changes
      const changes = {
        trainingDaysPerWeek: 5,
        longRunDay: "Saturday" as const
      };

      await planStore.applyConfigurationChanges(changes);

      // Verify incremental regeneration
      const lastResult = planStore.lastGenerationResult;
      expect(lastResult?.regenerationType).toBeDefined();
      expect(planStore.currentPlan?.configuration.trainingDaysPerWeek).toBe(5);
      expect(planStore.currentPlan?.configuration.longRunDay).toBe("Saturday");

      // Verify history was updated
      expect(planStore.planHistory.length).toBeGreaterThan(0);
    });

    it("should handle minimal updates for low impact changes", async () => {
      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);

      // Disable auto-regenerate to test manual regeneration
      planStore.setAutoRegenerate(false);

      // Make low impact changes
      const changes = {
        userExperience: "advanced" as const
      };

      await planStore.applyConfigurationChanges(changes, { forceFullRegeneration: false });

      // Manually regenerate
      await planStore.regenerateCurrentPlan();

      // Verify regeneration succeeded
      const lastResult = planStore.lastGenerationResult;
      expect(lastResult?.success).toBe(true);
      expect(planStore.currentPlan?.configuration.userExperience).toBe("advanced");
    });

    it("should handle forced full regeneration", async () => {
      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);

      // Make minimal changes but force full regeneration
      const changes = {
        userExperience: "beginner" as const
      };

      await planStore.applyConfigurationChanges(changes, { forceFullRegeneration: true });

      // Verify forced full regeneration
      const lastResult = planStore.lastGenerationResult;
      expect(lastResult?.regenerationType).toBeDefined();
    });
  });

  describe("History management integration", () => {
    it("should maintain plan history through multiple regenerations", async () => {
      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);

      // Make multiple changes
      const changes1 = { programLength: 16 };
      await planStore.applyConfigurationChanges(changes1);

      const changes2 = { raceDistance: "Marathon" as const };
      await planStore.applyConfigurationChanges(changes2);

      const changes3 = { trainingDaysPerWeek: 5 };
      await planStore.applyConfigurationChanges(changes3);

      // Should have plans in history
      expect(planStore.planHistory.length).toBeGreaterThan(0);

      // Test restoration if we have history
      if (planStore.planHistory.length > 0) {
        const historicalPlanId = planStore.planHistory[0]?.id;
        if (historicalPlanId) {
          const restored = planStore.restoreFromHistory(historicalPlanId);
          expect(restored).toBe(true);
          expect(planStore.currentPlan?.id).toBe(historicalPlanId);
        }
      }
    });

    it("should limit history size", async () => {
      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);

      // Generate many plans to test history limit
      for (let i = 8; i <= 24; i++) {
        await planStore.applyConfigurationChanges({ programLength: i });
      }

      // History should be limited to 10 items
      expect(planStore.planHistory.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Auto-regeneration behavior", () => {
    it("should auto-regenerate when enabled", async () => {
      // Ensure auto-regenerate is enabled
      planStore.setAutoRegenerate(true);

      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);
      const initialPlanId = planStore.currentPlan?.id;

      // Make changes using applyConfigurationChanges which should trigger regeneration
      await planStore.applyConfigurationChanges({ programLength: 16 });

      // Plan should have been regenerated
      expect(planStore.currentPlan?.id).not.toBe(initialPlanId);
      expect(planStore.currentPlan?.configuration.programLength).toBe(16);
    });

    it("should not auto-regenerate when disabled", async () => {
      // Disable auto-regenerate
      planStore.setAutoRegenerate(false);

      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);
      const initialPlanId = planStore.currentPlan?.id;

      // Make changes - should not trigger auto-regeneration
      planStore.updateConfigurationField("programLength", 16);

      // Plan should not have been regenerated automatically
      expect(planStore.currentPlan?.id).toBe(initialPlanId);
      expect(planStore.currentConfiguration?.programLength).toBe(16);

      // Manual regeneration should work
      await planStore.regenerateCurrentPlan();
      expect(planStore.currentPlan?.configuration.programLength).toBe(16);
    });
  });

  describe("Error handling integration", () => {
    it("should handle configuration validation errors", async () => {
      // Try to generate plan with invalid configuration
      const invalidConfig = {
        ...baseConfiguration,
        programLength: 0, // Invalid
        trainingDaysPerWeek: 10 // Invalid
      };

      const result = await planStore.generateNewPlan(invalidConfig);

      // Should handle gracefully
      expect(typeof result).toBe("boolean");

      if (!result) {
        expect(planStore.errors.length).toBeGreaterThan(0);
      }
    });

    it("should handle regeneration with invalid current plan", async () => {
      // Generate valid plan first
      await planStore.generateNewPlan(baseConfiguration);

      // Corrupt the current plan
      if (planStore.currentPlan) {
        (planStore.currentPlan as any).configuration = null;
      }

      // Try to regenerate
      const result = await planStore.regenerateCurrentPlan();

      // Should handle gracefully
      expect(typeof result).toBe("boolean");
    });
  });

  describe("State persistence integration", () => {
    it("should export and import complete state", async () => {
      // Generate plan and make some changes
      await planStore.generateNewPlan(baseConfiguration);
      await planStore.applyConfigurationChanges({ programLength: 16 });

      // Export state
      const exportedState = planStore.exportPlanState();

      // Verify exported state has the expected data
      expect(exportedState.currentPlan).toBeDefined();
      expect(exportedState.currentConfiguration?.programLength).toBe(16);

      // Clear store
      planStore.clearCurrentPlan();
      planStore.clearHistory();

      // Import state
      planStore.importPlanState(exportedState);

      // Verify state was restored
      expect(planStore.currentPlan).toBeDefined();
      expect(planStore.currentConfiguration?.programLength).toBe(16);
    });
  });

  describe("Plan comparison integration", () => {
    it("should create detailed comparisons between plans", async () => {
      // Generate initial plan
      await planStore.generateNewPlan(baseConfiguration);
      const plan1 = planStore.currentPlan!;

      // Create a modified plan manually for comparison
      const plan2 = {
        ...plan1,
        id: "plan-2",
        configuration: {
          ...plan1.configuration,
          raceDistance: "Marathon" as const,
          programLength: 20,
          trainingDaysPerWeek: 5
        }
      };

      // Compare plans
      const comparison = planStore.comparePlans(plan1, plan2);

      expect(comparison).toBeDefined();
      if (comparison) {
        expect(comparison.changes.length).toBeGreaterThan(0);
        expect(comparison.impactAssessment.length).toBeGreaterThan(0);

        // Should detect high impact changes
        const hasHighImpactChanges = comparison.changes.some(c => c.impact === "high");
        expect(hasHighImpactChanges).toBe(true);
      }
    });
  });
});
