import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { PlanConfiguration } from "@/types/configuration";
import type { TrainingPlan, PlanComparison } from "@/types/trainingPlan";
import { usePlanGenerator } from "@/composables/usePlanGenerator";
import { usePlanRegeneration, type RegenerationOptions, type RegenerationResult } from "@/composables/usePlanRegeneration";

/**
 * Plan store for managing training plan state and regeneration
 * Implements reactive state management with automatic regeneration
 * when configuration changes
 */

export interface PlanState {
  currentPlan: TrainingPlan | null;
  currentConfiguration: PlanConfiguration | null;
  planHistory: TrainingPlan[];
  lastComparison: PlanComparison | null;
  isGenerating: boolean;
  lastGenerationResult: RegenerationResult | null;
  autoRegenerate: boolean;
}

export const usePlanStore = defineStore("plan", () => {
  // State
  const currentPlan = ref<TrainingPlan | null>(null);
  const currentConfiguration = ref<PlanConfiguration | null>(null);
  const planHistory = ref<TrainingPlan[]>([]);
  const lastComparison = ref<PlanComparison | null>(null);
  const isGenerating = ref(false);
  const lastGenerationResult = ref<RegenerationResult | null>(null);
  const autoRegenerate = ref(true);
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);

  // Composables
  const { generatePlan } = usePlanGenerator();
  const { regeneratePlan, analyzeConfigurationChanges } = usePlanRegeneration();

  // Computed properties
  const hasCurrentPlan = computed(() => currentPlan.value !== null);
  const canRegenerate = computed(() =>
    currentConfiguration.value !== null && !isGenerating.value
  );
  const hasChanges = computed(() => {
    if (!currentPlan.value || !currentConfiguration.value) return false;
    const changes = analyzeConfigurationChanges(
      currentPlan.value.configuration,
      currentConfiguration.value
    );
    return changes.length > 0;
  });

  const planStatistics = computed(() => {
    if (!currentPlan.value) return null;

    return {
      totalWeeks: currentPlan.value.weeks.length,
      totalWorkouts: currentPlan.value.metadata.totalWorkouts,
      totalKilometers: currentPlan.value.metadata.totalKilometers,
      averageWeeklyKm: currentPlan.value.metadata.totalKilometers / currentPlan.value.weeks.length,
      deloadWeeks: currentPlan.value.weeks.filter(w => w.isDeloadWeek).length,
      qualityWorkouts: currentPlan.value.metadata.workoutTypeDistribution.quality,
      easyWorkouts: currentPlan.value.metadata.workoutTypeDistribution.easy,
      longRuns: currentPlan.value.metadata.workoutTypeDistribution.long
    };
  });

  // Watch for configuration changes and auto-regenerate if enabled
  watch(
    () => currentConfiguration.value,
    async (newConfig, oldConfig) => {
      if (autoRegenerate.value && newConfig && oldConfig && currentPlan.value) {
        await regenerateCurrentPlan();
      }
    },
    { deep: true }
  );

  // Actions
  async function generateNewPlan(configuration: PlanConfiguration): Promise<boolean> {
    if (isGenerating.value) return false;

    isGenerating.value = true;
    errors.value = [];
    warnings.value = [];

    try {
      const result = generatePlan(configuration);

      if (result.success && result.plan) {
        // Save current plan to history before replacing
        if (currentPlan.value) {
          addToHistory(currentPlan.value);
        }

        currentPlan.value = result.plan;
        currentConfiguration.value = configuration;
        errors.value = result.errors;
        warnings.value = result.warnings;

        return true;
      } else {
        errors.value = result.errors;
        warnings.value = result.warnings;
        return false;
      }
    } catch (error) {
      errors.value = [`Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
      return false;
    } finally {
      isGenerating.value = false;
    }
  }

  async function regenerateCurrentPlan(options: RegenerationOptions = {}): Promise<boolean> {
    if (!currentPlan.value || !currentConfiguration.value || isGenerating.value) {
      return false;
    }

    isGenerating.value = true;
    errors.value = [];
    warnings.value = [];

    try {
      const result = regeneratePlan(
        currentPlan.value,
        currentConfiguration.value,
        options
      );

      lastGenerationResult.value = result;

      if (result.success && result.newPlan) {
        // Save current plan to history before replacing
        addToHistory(currentPlan.value);

        currentPlan.value = result.newPlan;
        lastComparison.value = result.comparison;
        errors.value = result.errors;
        warnings.value = result.warnings;

        return true;
      } else {
        errors.value = result.errors;
        warnings.value = result.warnings;
        return false;
      }
    } catch (error) {
      errors.value = [`Plan regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
      return false;
    } finally {
      isGenerating.value = false;
    }
  }

  function updateConfiguration(newConfiguration: PlanConfiguration): void {
    currentConfiguration.value = { ...newConfiguration };
  }

  function updateConfigurationField<K extends keyof PlanConfiguration>(
    field: K,
    value: PlanConfiguration[K]
  ): void {
    if (currentConfiguration.value) {
      currentConfiguration.value = {
        ...currentConfiguration.value,
        [field]: value
      };
    }
  }

  async function applyConfigurationChanges(
    changes: Partial<PlanConfiguration>,
    options: RegenerationOptions = {}
  ): Promise<boolean> {
    if (!currentConfiguration.value) return false;

    const newConfiguration = {
      ...currentConfiguration.value,
      ...changes
    };

    currentConfiguration.value = newConfiguration;

    if (autoRegenerate.value && currentPlan.value) {
      return await regenerateCurrentPlan(options);
    }

    return true;
  }

  function addToHistory(plan: TrainingPlan): void {
    // Keep only the last 10 plans in history
    const maxHistorySize = 10;
    planHistory.value.unshift({ ...plan });

    if (planHistory.value.length > maxHistorySize) {
      planHistory.value = planHistory.value.slice(0, maxHistorySize);
    }
  }

  function restoreFromHistory(planId: string): boolean {
    const historicalPlan = planHistory.value.find(p => p.id === planId);

    if (historicalPlan) {
      // Save current plan to history before restoring
      if (currentPlan.value) {
        addToHistory(currentPlan.value);
      }

      currentPlan.value = { ...historicalPlan };
      currentConfiguration.value = { ...historicalPlan.configuration };
      return true;
    }

    return false;
  }

  function clearHistory(): void {
    planHistory.value = [];
  }

  function clearCurrentPlan(): void {
    if (currentPlan.value) {
      addToHistory(currentPlan.value);
    }

    currentPlan.value = null;
    currentConfiguration.value = null;
    lastComparison.value = null;
    lastGenerationResult.value = null;
    errors.value = [];
    warnings.value = [];
  }

  function getConfigurationChanges(): ReturnType<typeof analyzeConfigurationChanges> {
    if (!currentPlan.value || !currentConfiguration.value) return [];

    return analyzeConfigurationChanges(
      currentPlan.value.configuration,
      currentConfiguration.value
    );
  }

  function toggleAutoRegenerate(): void {
    autoRegenerate.value = !autoRegenerate.value;
  }

  function setAutoRegenerate(enabled: boolean): void {
    autoRegenerate.value = enabled;
  }

  // Plan comparison utilities
  function comparePlans(planA: TrainingPlan, planB: TrainingPlan): PlanComparison | null {
    try {
      const changes = analyzeConfigurationChanges(planA.configuration, planB.configuration);

      return {
        originalPlan: planA,
        modifiedPlan: planB,
        changes: changes.map(change => ({
          type: 'configuration' as const,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          impact: change.impact,
          description: `${change.field} changed from ${change.oldValue} to ${change.newValue}`
        })),
        impactAssessment: [`${changes.length} configuration changes detected`]
      };
    } catch (error) {
      console.error('Failed to compare plans:', error);
      return null;
    }
  }

  function getLastRegenerationType(): string | null {
    return lastGenerationResult.value?.regenerationType || null;
  }

  // Persistence helpers (for localStorage integration)
  function exportPlanState(): PlanState {
    return {
      currentPlan: currentPlan.value,
      currentConfiguration: currentConfiguration.value,
      planHistory: planHistory.value,
      lastComparison: lastComparison.value,
      isGenerating: false, // Don't persist generating state
      lastGenerationResult: lastGenerationResult.value,
      autoRegenerate: autoRegenerate.value
    };
  }

  function importPlanState(state: Partial<PlanState>): void {
    if (state.currentPlan) currentPlan.value = state.currentPlan;
    if (state.currentConfiguration) currentConfiguration.value = state.currentConfiguration;
    if (state.planHistory) planHistory.value = state.planHistory;
    if (state.lastComparison) lastComparison.value = state.lastComparison;
    if (state.lastGenerationResult) lastGenerationResult.value = state.lastGenerationResult;
    if (typeof state.autoRegenerate === 'boolean') autoRegenerate.value = state.autoRegenerate;
  }

  return {
    // State
    currentPlan,
    currentConfiguration,
    planHistory,
    lastComparison,
    isGenerating,
    lastGenerationResult,
    autoRegenerate,
    errors,
    warnings,

    // Computed
    hasCurrentPlan,
    canRegenerate,
    hasChanges,
    planStatistics,

    // Actions
    generateNewPlan,
    regenerateCurrentPlan,
    updateConfiguration,
    updateConfigurationField,
    applyConfigurationChanges,
    addToHistory,
    restoreFromHistory,
    clearHistory,
    clearCurrentPlan,
    getConfigurationChanges,
    toggleAutoRegenerate,
    setAutoRegenerate,
    comparePlans,
    getLastRegenerationType,
    exportPlanState,
    importPlanState
  };
});
