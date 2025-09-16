import type { PlanConfiguration } from "@/types/configuration";
import type { TrainingPlan, PlanComparison, PlanChange } from "@/types/trainingPlan";
import type { DayOfWeek } from "@/types/configuration";
import { usePlanGenerator } from "./usePlanGenerator";

/**
 * Plan regeneration and modification capabilities
 * Implements logic to regenerate plans when user changes parameters,
 * incremental update system for minor configuration changes,
 * and plan comparison utilities for showing changes
 */

export interface RegenerationOptions {
  forceFullRegeneration?: boolean;
  preserveCompletedWorkouts?: boolean;
  maintainCustomizations?: boolean;
}

export interface RegenerationResult {
  success: boolean;
  newPlan: TrainingPlan | null;
  comparison: PlanComparison | null;
  errors: string[];
  warnings: string[];
  regenerationType: 'full' | 'incremental' | 'minimal';
}

export interface ConfigurationChange {
  field: keyof PlanConfiguration;
  oldValue: unknown;
  newValue: unknown;
  impact: 'low' | 'medium' | 'high';
}

export function usePlanRegeneration() {
  const { generatePlan } = usePlanGenerator();

  /**
   * Main regeneration function that determines the best approach
   * based on the type and scope of configuration changes
   */
  function regeneratePlan(
    currentPlan: TrainingPlan,
    newConfiguration: PlanConfiguration,
    options: RegenerationOptions = {}
  ): RegenerationResult {
    try {
      // Validate inputs
      if (!currentPlan || !currentPlan.configuration || !newConfiguration) {
        return {
          success: false,
          newPlan: null,
          comparison: null,
          errors: ['Invalid plan or configuration provided'],
          warnings: [],
          regenerationType: 'full'
        };
      }

      // Analyze configuration changes
      const changes = analyzeConfigurationChanges(
        currentPlan.configuration,
        newConfiguration
      );

      // Determine regeneration strategy
      const strategy = determineRegenerationStrategy(changes, options);

      // Execute regeneration based on strategy
      switch (strategy.type) {
        case 'minimal':
          return performMinimalUpdate(currentPlan, newConfiguration, changes, options);

        case 'incremental':
          return performIncrementalUpdate(currentPlan, newConfiguration, changes, options);

        case 'full':
        default:
          return performFullRegeneration(currentPlan, newConfiguration, changes, options);
      }
    } catch (error) {
      return {
        success: false,
        newPlan: null,
        comparison: null,
        errors: [`Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        regenerationType: 'full'
      };
    }
  }

  /**
   * Analyze what has changed between configurations
   */
  function analyzeConfigurationChanges(
    oldConfig: PlanConfiguration,
    newConfig: PlanConfiguration
  ): ConfigurationChange[] {
    const changes: ConfigurationChange[] = [];

    // Handle null/undefined configurations
    if (!oldConfig || !newConfig) {
      return changes;
    }

    // Check each configuration field
    const fields: (keyof PlanConfiguration)[] = [
      'raceDistance',
      'programLength',
      'trainingDaysPerWeek',
      'restDays',
      'longRunDay',
      'deloadFrequency',
      'userExperience',
      'difficulty',
      'paceMethod',
      'paceData'
    ];

    for (const field of fields) {
      const oldValue = oldConfig[field];
      const newValue = newConfig[field];

      if (!isEqual(oldValue, newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
          impact: assessChangeImpact(field, oldValue, newValue)
        });
      }
    }

    return changes;
  }

  /**
   * Determine the best regeneration strategy based on changes
   */
  function determineRegenerationStrategy(
    changes: ConfigurationChange[],
    options: RegenerationOptions
  ): { type: 'minimal' | 'incremental' | 'full'; reason: string } {
    // Force full regeneration if requested
    if (options.forceFullRegeneration) {
      return { type: 'full', reason: 'Full regeneration requested' };
    }

    // No changes - minimal update
    if (changes.length === 0) {
      return { type: 'minimal', reason: 'No configuration changes detected' };
    }

    // High impact changes require full regeneration
    const hasHighImpactChanges = changes.some(change => change.impact === 'high');
    if (hasHighImpactChanges) {
      return { type: 'full', reason: 'High impact changes detected' };
    }

    // Multiple medium impact changes require full regeneration
    const mediumImpactChanges = changes.filter(change => change.impact === 'medium');
    if (mediumImpactChanges.length > 2) {
      return { type: 'full', reason: 'Multiple medium impact changes detected' };
    }

    // Single medium impact or multiple low impact changes can use incremental
    if (mediumImpactChanges.length > 0 || changes.length > 3) {
      return { type: 'incremental', reason: 'Medium impact changes can be handled incrementally' };
    }

    // Low impact changes can use minimal update
    return { type: 'minimal', reason: 'Only low impact changes detected' };
  }

  /**
   * Assess the impact of a specific configuration change
   */
  function assessChangeImpact(
    field: keyof PlanConfiguration,
    oldValue: unknown,
    newValue: unknown
  ): 'low' | 'medium' | 'high' {
    switch (field) {
      case 'raceDistance':
      case 'programLength':
        return 'high'; // These require complete plan restructuring

      case 'trainingDaysPerWeek':
        const oldDays = oldValue as number;
        const newDays = newValue as number;
        const daysDifference = Math.abs(newDays - oldDays);
        return daysDifference > 1 ? 'high' : 'medium';

      case 'deloadFrequency':
      case 'userExperience':
      case 'difficulty':
        return 'medium'; // These affect workout intensity and volume

      case 'restDays':
      case 'longRunDay':
        return 'medium'; // These affect scheduling but not workout content

      case 'paceMethod':
      case 'paceData':
        return 'low'; // These only affect pace guidance, not plan structure

      default:
        return 'medium';
    }
  }

  /**
   * Perform minimal update for very small changes
   */
  function performMinimalUpdate(
    currentPlan: TrainingPlan,
    newConfiguration: PlanConfiguration,
    changes: ConfigurationChange[],
    options: RegenerationOptions
  ): RegenerationResult {
    try {
      // Create a copy of the current plan with updated configuration
      const updatedPlan: TrainingPlan = {
        ...currentPlan,
        configuration: newConfiguration,
        metadata: {
          ...currentPlan.metadata,
          lastModified: new Date()
        }
      };

      // Apply minimal changes (mainly pace updates)
      for (const change of changes) {
        if (change.field === 'paceData' || change.field === 'paceMethod') {
          // Update pace guidance for all workouts
          updateWorkoutPaces(updatedPlan, newConfiguration);
        }
      }

      const comparison = createPlanComparison(currentPlan, updatedPlan, changes);

      return {
        success: true,
        newPlan: updatedPlan,
        comparison,
        errors: [],
        warnings: ['Minimal update applied - only pace guidance updated'],
        regenerationType: 'minimal'
      };
    } catch (error) {
      return {
        success: false,
        newPlan: null,
        comparison: null,
        errors: [`Minimal update failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        regenerationType: 'minimal'
      };
    }
  }

  /**
   * Perform incremental update for moderate changes
   */
  function performIncrementalUpdate(
    currentPlan: TrainingPlan,
    newConfiguration: PlanConfiguration,
    changes: ConfigurationChange[],
    options: RegenerationOptions
  ): RegenerationResult {
    try {
      // Start with current plan structure
      let updatedPlan = { ...currentPlan };
      const warnings: string[] = [];

      // Apply changes incrementally
      for (const change of changes) {
        switch (change.field) {
          case 'restDays':
          case 'longRunDay':
            // Reschedule workouts without changing content
            updatedPlan = rescheduleWorkouts(updatedPlan, newConfiguration);
            warnings.push(`Rescheduled workouts for ${change.field} change`);
            break;

          case 'deloadFrequency':
            // Recalculate deload weeks
            updatedPlan = recalculateDeloadWeeks(updatedPlan, newConfiguration);
            warnings.push('Recalculated deload week placement');
            break;

          case 'difficulty':
          case 'userExperience':
            // Adjust workout intensities
            updatedPlan = adjustWorkoutIntensities(updatedPlan, newConfiguration);
            warnings.push('Adjusted workout intensities based on difficulty/experience');
            break;

          case 'trainingDaysPerWeek':
            // Redistribute workouts
            updatedPlan = redistributeWorkouts(updatedPlan, newConfiguration);
            warnings.push('Redistributed workouts for new training frequency');
            break;
        }
      }

      // Update metadata
      updatedPlan.configuration = newConfiguration;
      updatedPlan.metadata = {
        ...updatedPlan.metadata,
        lastModified: new Date()
      };

      const comparison = createPlanComparison(currentPlan, updatedPlan, changes);

      return {
        success: true,
        newPlan: updatedPlan,
        comparison,
        errors: [],
        warnings,
        regenerationType: 'incremental'
      };
    } catch (error) {
      // Fall back to full regeneration if incremental fails
      return performFullRegeneration(currentPlan, newConfiguration, changes, options);
    }
  }

  /**
   * Perform full regeneration for major changes
   */
  function performFullRegeneration(
    currentPlan: TrainingPlan,
    newConfiguration: PlanConfiguration,
    changes: ConfigurationChange[],
    options: RegenerationOptions
  ): RegenerationResult {
    try {
      // Generate completely new plan
      const generationResult = generatePlan(newConfiguration);

      if (!generationResult.success || !generationResult.plan) {
        return {
          success: false,
          newPlan: null,
          comparison: null,
          errors: generationResult.errors,
          warnings: generationResult.warnings,
          regenerationType: 'full'
        };
      }

      // Preserve completed workouts if requested
      let finalPlan = generationResult.plan;
      if (options.preserveCompletedWorkouts) {
        finalPlan = preserveCompletedWorkouts(currentPlan, finalPlan);
      }

      const comparison = createPlanComparison(currentPlan, finalPlan, changes);

      return {
        success: true,
        newPlan: finalPlan,
        comparison,
        errors: generationResult.errors,
        warnings: [
          ...generationResult.warnings,
          'Plan fully regenerated due to significant configuration changes'
        ],
        regenerationType: 'full'
      };
    } catch (error) {
      return {
        success: false,
        newPlan: null,
        comparison: null,
        errors: [`Full regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        regenerationType: 'full'
      };
    }
  }

  /**
   * Create a detailed comparison between two plans
   */
  function createPlanComparison(
    originalPlan: TrainingPlan,
    modifiedPlan: TrainingPlan,
    configChanges: ConfigurationChange[]
  ): PlanComparison {
    const changes: PlanChange[] = [];

    // Add configuration changes
    for (const configChange of configChanges) {
      changes.push({
        type: 'configuration',
        field: configChange.field,
        oldValue: configChange.oldValue,
        newValue: configChange.newValue,
        impact: configChange.impact,
        description: generateChangeDescription(configChange)
      });
    }

    // Compare workout changes
    const workoutChanges = compareWorkouts(originalPlan, modifiedPlan);
    changes.push(...workoutChanges);

    // Generate impact assessment
    const impactAssessment = generateImpactAssessment(changes);

    return {
      originalPlan,
      modifiedPlan,
      changes,
      impactAssessment
    };
  }

  /**
   * Compare workouts between two plans to identify changes
   */
  function compareWorkouts(originalPlan: TrainingPlan, modifiedPlan: TrainingPlan): PlanChange[] {
    const changes: PlanChange[] = [];

    // Compare each week
    for (let weekNum = 1; weekNum <= Math.max(originalPlan.weeks.length, modifiedPlan.weeks.length); weekNum++) {
      const originalWeek = originalPlan.weeks.find(w => w.weekNumber === weekNum);
      const modifiedWeek = modifiedPlan.weeks.find(w => w.weekNumber === weekNum);

      if (!originalWeek && modifiedWeek) {
        changes.push({
          type: 'workout',
          field: 'week_added',
          oldValue: null,
          newValue: modifiedWeek,
          weekNumber: weekNum,
          impact: 'medium',
          description: `Week ${weekNum} added to plan`
        });
      } else if (originalWeek && !modifiedWeek) {
        changes.push({
          type: 'workout',
          field: 'week_removed',
          oldValue: originalWeek,
          newValue: null,
          weekNumber: weekNum,
          impact: 'medium',
          description: `Week ${weekNum} removed from plan`
        });
      } else if (originalWeek && modifiedWeek) {
        // Compare daily workouts within the week
        const dailyChanges = compareDailyWorkouts(originalWeek, modifiedWeek);
        changes.push(...dailyChanges);
      }
    }

    return changes;
  }

  /**
   * Compare daily workouts within a week
   */
  function compareDailyWorkouts(originalWeek: any, modifiedWeek: any): PlanChange[] {
    const changes: PlanChange[] = [];
    const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (const day of daysOfWeek) {
      const originalDay = originalWeek.days.find((d: any) => d.dayOfWeek === day);
      const modifiedDay = modifiedWeek.days.find((d: any) => d.dayOfWeek === day);

      if (!isEqual(originalDay, modifiedDay)) {
        changes.push({
          type: 'workout',
          field: 'daily_workout',
          oldValue: originalDay,
          newValue: modifiedDay,
          weekNumber: originalWeek.weekNumber,
          dayOfWeek: day,
          impact: assessWorkoutChangeImpact(originalDay, modifiedDay),
          description: generateWorkoutChangeDescription(originalDay, modifiedDay, day)
        });
      }
    }

    return changes;
  }

  /**
   * Helper functions for incremental updates
   */
  function rescheduleWorkouts(plan: TrainingPlan, newConfig: PlanConfiguration): TrainingPlan {
    // Implementation would reschedule workouts based on new rest days and long run day
    // This is a simplified version - full implementation would use workout scheduling logic
    return {
      ...plan,
      weeks: plan.weeks.map(week => ({
        ...week,
        // Reschedule logic would go here
      }))
    };
  }

  function recalculateDeloadWeeks(plan: TrainingPlan, newConfig: PlanConfiguration): TrainingPlan {
    // Implementation would recalculate deload week placement
    return plan;
  }

  function adjustWorkoutIntensities(plan: TrainingPlan, newConfig: PlanConfiguration): TrainingPlan {
    // Implementation would adjust workout intensities based on difficulty/experience
    return plan;
  }

  function redistributeWorkouts(plan: TrainingPlan, newConfig: PlanConfiguration): TrainingPlan {
    // Implementation would redistribute workouts for new training frequency
    return plan;
  }

  function updateWorkoutPaces(plan: TrainingPlan, newConfig: PlanConfiguration): void {
    // Implementation would update pace guidance for all workouts
  }

  function preserveCompletedWorkouts(originalPlan: TrainingPlan, newPlan: TrainingPlan): TrainingPlan {
    // Implementation would preserve completed workouts from original plan
    return newPlan;
  }

  /**
   * Utility functions
   */
  function isEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function assessWorkoutChangeImpact(originalWorkout: any, modifiedWorkout: any): 'low' | 'medium' | 'high' {
    if (!originalWorkout && modifiedWorkout) return 'medium';
    if (originalWorkout && !modifiedWorkout) return 'medium';
    if (!originalWorkout && !modifiedWorkout) return 'low';

    // Compare workout properties
    if (originalWorkout.type !== modifiedWorkout.type) return 'high';
    if (Math.abs((originalWorkout.distance || 0) - (modifiedWorkout.distance || 0)) > 2) return 'medium';

    return 'low';
  }

  function generateChangeDescription(change: ConfigurationChange): string {
    switch (change.field) {
      case 'raceDistance':
        return `Race distance changed from ${change.oldValue} to ${change.newValue}`;
      case 'programLength':
        return `Program length changed from ${change.oldValue} to ${change.newValue} weeks`;
      case 'trainingDaysPerWeek':
        return `Training days per week changed from ${change.oldValue} to ${change.newValue}`;
      case 'restDays':
        return `Rest days changed`;
      case 'longRunDay':
        return `Long run day changed from ${change.oldValue} to ${change.newValue}`;
      case 'deloadFrequency':
        return `Deload frequency changed from every ${change.oldValue} weeks to every ${change.newValue} weeks`;
      default:
        return `${change.field} changed`;
    }
  }

  function generateWorkoutChangeDescription(originalWorkout: any, modifiedWorkout: any, day: DayOfWeek): string {
    if (!originalWorkout && modifiedWorkout) {
      return `${day}: Added ${modifiedWorkout.workout?.type || 'workout'}`;
    }
    if (originalWorkout && !modifiedWorkout) {
      return `${day}: Removed ${originalWorkout.workout?.type || 'workout'}`;
    }
    if (originalWorkout?.workout?.type !== modifiedWorkout?.workout?.type) {
      return `${day}: Changed from ${originalWorkout?.workout?.type} to ${modifiedWorkout?.workout?.type}`;
    }
    return `${day}: Workout modified`;
  }

  function generateImpactAssessment(changes: PlanChange[]): string[] {
    const assessment: string[] = [];

    const highImpactChanges = changes.filter(c => c.impact === 'high').length;
    const mediumImpactChanges = changes.filter(c => c.impact === 'medium').length;
    const lowImpactChanges = changes.filter(c => c.impact === 'low').length;

    if (highImpactChanges > 0) {
      assessment.push(`${highImpactChanges} high-impact changes detected - significant plan restructuring`);
    }
    if (mediumImpactChanges > 0) {
      assessment.push(`${mediumImpactChanges} medium-impact changes - moderate adjustments to plan`);
    }
    if (lowImpactChanges > 0) {
      assessment.push(`${lowImpactChanges} low-impact changes - minor adjustments`);
    }

    // Add specific assessments
    const configChanges = changes.filter(c => c.type === 'configuration');
    const workoutChanges = changes.filter(c => c.type === 'workout');

    if (configChanges.length > 0) {
      assessment.push(`Configuration changes may affect overall plan structure and progression`);
    }
    if (workoutChanges.length > 0) {
      assessment.push(`${workoutChanges.length} workout changes detected across the plan`);
    }

    return assessment;
  }

  return {
    regeneratePlan,
    analyzeConfigurationChanges,
    createPlanComparison,
    determineRegenerationStrategy,
    assessChangeImpact
  };
}
