# Project Structure & Organization

## Root Structure

```
├── src/                    # Main application source
├── .kiro/                  # Kiro configuration and specs
├── public/                 # Static assets
├── dist/                   # Build output
├── node_modules/           # Dependencies
└── config files            # Vite, TypeScript, Tailwind, etc.
```

## Source Code Organization (`src/`)

### Core Directories

- **`composables/`** - Business logic and training science algorithms
- **`types/`** - TypeScript interfaces and type definitions
- **`constants/`** - Static data and configuration values
- **`components/`** - Vue components (currently template components)
- **`views/`** - Page-level Vue components
- **`utils/`** - Helper functions and utilities
- **`stores/`** - Pinia state management
- **`router/`** - Vue Router configuration

### Key Files

- **`main.ts`** - Application entry point
- **`App.vue`** - Root Vue component

## Training Science Engine (`src/composables/`)

Core business logic implemented as Vue 3 composables:

- **`useProgressionRules.ts`** - Progressive overload & volume calculations
- **`useWorkoutDistribution.ts`** - Workout scheduling & distribution logic
- **`usePhasePeriodization.ts`** - Training phase management
- **`useWorkoutScheduling.ts`** - Weekly schedule optimization

### Testing Structure
- **`__tests__/`** directories contain corresponding test files
- Test files follow `*.spec.ts` naming convention
- Comprehensive coverage for all training algorithms

## Type System (`src/types/`)

- **`configuration.ts`** - Plan configuration interfaces and validation
- **`workout.ts`** - Workout and training plan type definitions
- **`trainingPlan.ts`** - Complete training plan structure
- **`index.ts`** - Type exports and re-exports

## Constants (`src/constants/`)

- **`raceDistances.ts`** - Race distance definitions and metadata
- **`workoutTypes.ts`** - Workout type definitions and properties
- **`trainingZones.ts`** - Training zone constants and heart rate ranges
- **`difficultyLevels.ts`** - Difficulty level configurations
- **`paceInputMethods.ts`** - Pace determination method definitions

## Utilities (`src/utils/`)

- **`trainingPlanHelpers.ts`** - Training plan manipulation utilities
- **`configurationValidation.ts`** - Configuration validation logic

## Spec Management (`.kiro/specs/`)

Project specifications organized by feature:
- **`running-plan-generator/`** - Main feature spec
  - `requirements.md` - Detailed requirements
  - `design.md` - Technical design document
  - `tasks.md` - Implementation task tracking

## Naming Conventions

- **Files**: kebab-case (`use-progression-rules.ts`)
- **Components**: PascalCase (`HelloWorld.vue`)
- **Composables**: camelCase with `use` prefix (`useProgressionRules`)
- **Types**: PascalCase interfaces (`PlanConfiguration`)
- **Constants**: UPPER_SNAKE_CASE (`BASE_WEEKLY_DISTANCE`)

## Import Patterns

- Use `@/` alias for src imports: `import type { RaceDistance } from '@/types/configuration'`
- Relative imports for same-directory files
- Explicit type imports: `import type { ... }`
