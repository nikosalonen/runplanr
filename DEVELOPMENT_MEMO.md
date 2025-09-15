# Development Memo - Running Plan Generator

## Project Overview
Vue 3 + TypeScript + Vite project for generating personalized running training plans using scientific training principles.

## Key Commands

### Testing
- **Run all tests**: `npm run test:unit`
- **Run specific test file**: `npm run test:unit -- --run path/to/test.spec.ts`
- **Run tests with watch mode**: `npm run test:unit` (without --run flag)
- **Example**: `npm run test:unit -- --run src/composables/__tests__/useProgressionRules.spec.ts`

### Development
- **Start dev server**: `npm run dev`
- **Build project**: `npm run build`
- **Preview build**: `npm run preview`
- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`

## Project Structure

### Core Composables (Training Science Engine)
- `src/composables/useProgressionRules.ts` - Progressive overload & volume calculations
- `src/composables/useWorkoutDistribution.ts` - Workout scheduling & distribution
- `src/composables/usePhasePeriodization.ts` - Training phase management

### Types
- `src/types/configuration.ts` - Plan configuration interfaces
- `src/types/workout.ts` - Workout and training plan types
- `src/types/trainingPlan.ts` - Training plan structure

### Constants
- `src/constants/raceDistances.ts` - Race distance definitions
- `src/constants/workoutTypes.ts` - Workout type definitions
- `src/constants/trainingZones.ts` - Training zone constants

### Tests
- All tests in `src/**/__tests__/` directories
- Test files follow `*.spec.ts` naming convention
- Comprehensive test coverage for training science algorithms

## Spec Management

### Spec Location
- Spec files: `.kiro/specs/running-plan-generator/`
- Requirements: `requirements.md`
- Design: `design.md` 
- Tasks: `tasks.md`

### Task Status Updates
Use the taskStatus tool to update task completion:
```
taskStatus({
  taskFilePath: ".kiro/specs/running-plan-generator/tasks.md",
  task: "Task name exactly as written",
  status: "in_progress" | "completed" | "not_started"
})
```

## Key Implementation Notes

### Metric System
- All distances in kilometers (km)
- All paces in minutes per kilometer (min/km)
- No imperial units in current implementation

### Training Science Principles
- 10% max weekly volume increase
- 80/20 training intensity distribution
- 48+ hours between quality workouts
- Deload weeks every 3-4 weeks (20-30% volume reduction)
- Phase periodization: Base → Build → Peak → Taper

### Test Verification
Always run tests after implementing features:
1. Unit tests for individual composables
2. Integration tests for complete workflows
3. All tests should pass before marking tasks complete

## Current Status
- Task 3 "Build training science rules engine" - COMPLETED
- All subtasks (3.1, 3.2, 3.3) implemented and tested
- 50+ passing tests across the training science algorithms

## Next Steps
Refer to `tasks.md` for remaining implementation tasks, focusing on:
- Schedule optimization system (Task 4)
- Plan generation engine (Task 5)
- User interface components (Task 6)
