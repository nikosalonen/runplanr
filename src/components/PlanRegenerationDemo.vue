<template>
  <div class="plan-regeneration-demo p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">Plan Regeneration Demo</h2>

    <!-- Current Plan Status -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Current Plan Status</h3>
        <div class="stats stats-vertical lg:stats-horizontal">
          <div class="stat">
            <div class="stat-title">Has Plan</div>
            <div class="stat-value text-sm">{{ hasCurrentPlan ? 'Yes' : 'No' }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Can Regenerate</div>
            <div class="stat-value text-sm">{{ canRegenerate ? 'Yes' : 'No' }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Has Changes</div>
            <div class="stat-value text-sm">{{ hasChanges ? 'Yes' : 'No' }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Auto Regenerate</div>
            <div class="stat-value text-sm">{{ autoRegenerate ? 'On' : 'Off' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Plan Configuration -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Plan Configuration</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Race Distance</span>
            </label>
            <select
              v-model="localConfig.raceDistance"
              class="select select-bordered"
              @change="onConfigChange"
            >
              <option value="5K">5K</option>
              <option value="10K">10K</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Marathon">Marathon</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Program Length ({{ localConfig.programLength }} weeks)</span>
            </label>
            <input
              v-model.number="localConfig.programLength"
              type="range"
              min="8"
              max="24"
              class="range range-primary"
              @input="onConfigChange"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Training Days per Week</span>
            </label>
            <select
              v-model.number="localConfig.trainingDaysPerWeek"
              class="select select-bordered"
              @change="onConfigChange"
            >
              <option :value="3">3 days</option>
              <option :value="4">4 days</option>
              <option :value="5">5 days</option>
              <option :value="6">6 days</option>
              <option :value="7">7 days</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Deload Frequency</span>
            </label>
            <select
              v-model.number="localConfig.deloadFrequency"
              class="select select-bordered"
              @change="onConfigChange"
            >
              <option :value="3">Every 3 weeks</option>
              <option :value="4">Every 4 weeks</option>
            </select>
          </div>
        </div>

        <div class="form-control mt-4">
          <label class="cursor-pointer label">
            <span class="label-text">Auto-regenerate on changes</span>
            <input
              v-model="autoRegenerate"
              type="checkbox"
              class="toggle toggle-primary"
              @change="toggleAutoRegenerate"
            />
          </label>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Actions</h3>
        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-primary"
            :disabled="isGenerating"
            @click="generateNewPlan"
          >
            <span v-if="isGenerating" class="loading loading-spinner loading-sm"></span>
            Generate New Plan
          </button>

          <button
            class="btn btn-secondary"
            :disabled="!canRegenerate"
            @click="regeneratePlan"
          >
            <span v-if="isGenerating" class="loading loading-spinner loading-sm"></span>
            Regenerate Plan
          </button>

          <button
            class="btn btn-accent"
            :disabled="!canRegenerate"
            @click="forceFullRegeneration"
          >
            Force Full Regeneration
          </button>

          <button
            class="btn btn-outline"
            :disabled="planHistory.length === 0"
            @click="showHistory = !showHistory"
          >
            History ({{ planHistory.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Configuration Changes -->
    <div v-if="hasChanges" class="card bg-warning text-warning-content shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Pending Changes</h3>
        <div class="space-y-2">
          <div v-for="change in configurationChanges" :key="change.field" class="flex justify-between">
            <span>{{ change.field }}:</span>
            <span>{{ change.oldValue }} → {{ change.newValue }}</span>
            <span class="badge" :class="{
              'badge-error': change.impact === 'high',
              'badge-warning': change.impact === 'medium',
              'badge-info': change.impact === 'low'
            }">{{ change.impact }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Regeneration Result -->
    <div v-if="lastGenerationResult" class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Last Regeneration Result</h3>
        <div class="stats stats-vertical lg:stats-horizontal">
          <div class="stat">
            <div class="stat-title">Type</div>
            <div class="stat-value text-sm">{{ lastGenerationResult.regenerationType }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Success</div>
            <div class="stat-value text-sm">{{ lastGenerationResult.success ? 'Yes' : 'No' }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Errors</div>
            <div class="stat-value text-sm">{{ lastGenerationResult.errors.length }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Warnings</div>
            <div class="stat-value text-sm">{{ lastGenerationResult.warnings.length }}</div>
          </div>
        </div>

        <div v-if="lastGenerationResult.errors.length > 0" class="alert alert-error mt-4">
          <ul>
            <li v-for="error in lastGenerationResult.errors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <div v-if="lastGenerationResult.warnings.length > 0" class="alert alert-warning mt-4">
          <ul>
            <li v-for="warning in lastGenerationResult.warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Plan Statistics -->
    <div v-if="planStatistics" class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Plan Statistics</h3>
        <div class="stats stats-vertical lg:stats-horizontal">
          <div class="stat">
            <div class="stat-title">Total Weeks</div>
            <div class="stat-value text-sm">{{ planStatistics.totalWeeks }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Workouts</div>
            <div class="stat-value text-sm">{{ planStatistics.totalWorkouts }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Kilometers</div>
            <div class="stat-value text-sm">{{ planStatistics.totalKilometers.toFixed(1) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Avg Weekly Km</div>
            <div class="stat-value text-sm">{{ planStatistics.averageWeeklyKm.toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Plan History -->
    <div v-if="showHistory && planHistory.length > 0" class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h3 class="card-title">Plan History</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Plan ID</th>
                <th>Race Distance</th>
                <th>Program Length</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in planHistory" :key="plan.id">
                <td>{{ plan.id.substring(0, 8) }}...</td>
                <td>{{ plan.configuration.raceDistance }}</td>
                <td>{{ plan.configuration.programLength }} weeks</td>
                <td>{{ new Date(plan.metadata.createdAt).toLocaleDateString() }}</td>
                <td>
                  <button
                    class="btn btn-xs btn-outline"
                    @click="restoreFromHistory(plan.id)"
                  >
                    Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Plan Comparison -->
    <div v-if="lastComparison" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Plan Comparison</h3>
        <div class="space-y-4">
          <div v-if="lastComparison.changes.length > 0">
            <h4 class="font-semibold">Changes:</h4>
            <div class="space-y-2">
              <div v-for="change in lastComparison.changes" :key="`${change.field}-${change.type}`"
                   class="flex justify-between items-center p-2 bg-base-200 rounded">
                <span>{{ change.description }}</span>
                <span class="badge" :class="{
                  'badge-error': change.impact === 'high',
                  'badge-warning': change.impact === 'medium',
                  'badge-info': change.impact === 'low'
                }">{{ change.impact }}</span>
              </div>
            </div>
          </div>

          <div v-if="lastComparison.impactAssessment.length > 0">
            <h4 class="font-semibold">Impact Assessment:</h4>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="assessment in lastComparison.impactAssessment" :key="assessment">
                {{ assessment }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlanStore } from '@/stores/planStore';
import type { PlanConfiguration } from '@/types/configuration';

const planStore = usePlanStore();

// Reactive references from store
const {
  currentPlan,
  currentConfiguration,
  planHistory,
  lastComparison,
  isGenerating,
  lastGenerationResult,
  autoRegenerate,
  hasCurrentPlan,
  canRegenerate,
  hasChanges,
  planStatistics
} = storeToRefs(planStore);

// Local state
const showHistory = ref(false);

// Local configuration for form binding
const localConfig = ref<PlanConfiguration>({
  raceDistance: '10K',
  programLength: 12,
  trainingDaysPerWeek: 4,
  restDays: ['Monday', 'Friday'],
  longRunDay: 'Sunday',
  deloadFrequency: 4
});

// Computed properties
const configurationChanges = computed(() => {
  return planStore.getConfigurationChanges();
});

// Watch for changes in current configuration and sync with local config
watch(currentConfiguration, (newConfig) => {
  if (newConfig) {
    localConfig.value = { ...newConfig };
  }
}, { immediate: true });

// Methods
function onConfigChange() {
  planStore.updateConfiguration(localConfig.value);
}

function toggleAutoRegenerate() {
  planStore.toggleAutoRegenerate();
}

async function generateNewPlan() {
  await planStore.generateNewPlan(localConfig.value);
}

async function regeneratePlan() {
  await planStore.regenerateCurrentPlan();
}

async function forceFullRegeneration() {
  await planStore.regenerateCurrentPlan({ forceFullRegeneration: true });
}

function restoreFromHistory(planId: string) {
  planStore.restoreFromHistory(planId);
}
</script>

<style scoped>
.plan-regeneration-demo {
  font-family: 'Inter', sans-serif;
}

.stats .stat-value {
  font-size: 1rem;
}

.card {
  border: 1px solid hsl(var(--border-color, var(--fallback-b2)));
}
</style>
