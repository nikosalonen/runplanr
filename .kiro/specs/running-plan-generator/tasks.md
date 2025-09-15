# Implementation Plan

## Implementation Priorities

### MVP Features (Must Have)
- Basic plan generation for 4 race distances
- Weekly mileage progression
- Three core workout types (easy, long, quality)
- Rest day selection
- Simple calendar display

### Phase 2 Features
- Deload week customization
- More workout variety (tempo, hills, intervals)
- Export functionality
- Progress visualization
- Plan saving/loading

### Future Enhancements
- Heart rate zone calculator
- Pace calculator integration
- Training history import
- Injury prevention tips
- Weather-based adjustments
- Social sharing features

---

## MVP Tasks (Priority 1)

- [x] 1. Set up project structure and core interfaces
  - Initialize Vite project with Vue 3 TypeScript template
  - Install and configure TailwindCSS with DaisyUI component library
  - Create directory structure: src/components/, src/composables/, src/types/, src/constants/, src/stores/
  - Set up TypeScript configuration with strict mode and Vue 3 support
  - Define core TypeScript interfaces in src/types/ for PlanConfiguration, TrainingPlan, Workout, WeeklyPlan, PaceData, and TrainingPaces
  - Create constants files in src/constants/: trainingZones.ts, raceDistances.ts, workoutTypes.ts, difficultyLevels.ts, paceInputMethods.ts
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement core data models and validation
  - [ ] 2.1 Create core workout type definitions (MVP)
    - Define basic WorkoutType enum with easy, long, and quality workout types
    - Implement simple workout structure with type, distance, and description
    - Create basic workout template library for MVP (easy runs, long runs, one quality type)
    - Add basic workout descriptions for each type
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ] 2.2 Implement plan configuration model with validation
    - Create PlanConfiguration interface with race distance, program length, training days, rest days, long run day, and deload frequency
    - Implement validation functions for parameter combinations (minimum weeks per race distance, training days limits)
    - Add validation warnings for potentially unsafe configurations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 2.3 Create training plan data structure
    - Implement TrainingPlan, WeeklyPlan, and DailyWorkout interfaces
    - Add metadata tracking for total volume, workout counts, and creation date
    - Create helper methods for plan manipulation and querying
    - _Requirements: 5.1, 5.2_

- [ ] 3. Build training science rules engine
  - [ ] 3.1 Implement base building logic with progressive overload
    - Create algorithm to calculate starting weekly mileage based on race distance
    - Implement maximum 10% weekly volume increase with safety caps (key science principle)
    - Add automatic adjustment for aggressive progression attempts
    - Add deload week volume reduction logic (20-30% decrease)
    - _Requirements: 3.6, 4.3_

  - [ ] 3.2 Implement basic workout distribution algorithm (MVP)
    - Create simple workout distribution templates for 3-7 training days per week
    - Implement basic logic with mostly easy runs, one long run, and one quality workout per week
    - Add race-distance specific mileage scaling
    - _Requirements: 3.1, 3.6_

  - [ ] 3.3 Create phase periodization system
    - Implement base phase logic (weeks 1-4/6) focusing on aerobic development
    - Create build phase algorithm (middle 40-50%) with lactate threshold and VO2 max work
    - Add peak phase logic (final 4-6 weeks) with race-specific training
    - Implement taper phase (final 2-3 weeks) with volume reduction and intensity maintenance
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Develop schedule optimization system
  - [ ] 4.1 Create workout scheduling algorithm
    - Implement quality workout rotation logic (tempo → intervals → hills cycle)
    - Add constraint satisfaction for long run day placement (typically weekends)
    - Create algorithm to distribute easy and recovery runs across remaining training days
    - Implement logic to respect user's rest day preferences in weekly scheduling
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Implement recovery optimization
    - Add logic to ensure minimum 48 hours between high-intensity workouts (key science principle)
    - Implement smart rest day placement around hard sessions
    - Create validation for workout sequence safety and overtraining prevention
    - _Requirements: 4.1, 4.4, 4.5_

  - [ ] 4.3 Build deload week scheduling
    - Implement deload week placement every 3rd or 4th week based on user preference
    - Create deload week workout modification logic
    - Add validation to ensure deload weeks don't conflict with key training phases
    - _Requirements: 4.2, 4.3_

- [ ] 5. Create plan generation engine
  - [ ] 5.1 Implement main plan generation orchestrator
    - Create PlanGenerator class that coordinates all generation steps
    - Implement step-by-step plan creation: validate config → determine phases → calculate distributions → generate sequences → optimize schedules
    - Add comprehensive plan validation before returning results
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

  - [ ] 5.2 Add plan regeneration and modification capabilities
    - Implement logic to regenerate plans when user changes parameters
    - Create incremental update system for minor configuration changes
    - Add plan comparison utilities for showing changes
    - _Requirements: 2.5_

- [ ] 6. Build user interface components
  - [ ] 6.1 Create basic plan configuration form (MVP)
    - Build RaceDistanceSelector.vue component with 4 race distances using DaisyUI radio buttons
    - Implement ProgramLengthSlider.vue component with real-time feedback (8-24 weeks range) using DaisyUI range input
    - Create TrainingDaysSelector.vue component with validation (3-7 days) using DaisyUI select
    - Build simple RestDayPicker.vue component with intuitive day selector using DaisyUI checkboxes
    - Add smart defaults and minimal required inputs for simple configuration
    - Integrate with Vue stores for reactive state management
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

  - [ ] 6.2 Implement basic plan display (MVP)
    - Create CalendarView.vue component showing workouts in weekly format using TailwindCSS grid
    - Build WeeklyCard.vue components with workout summaries using DaisyUI card components
    - Add clear visual indicators for workout types (easy, long, quality) and training phases using TailwindCSS colors
    - Display basic workout information (type, distance, day) with mobile-responsive design
    - Implement ability to modify and regenerate plan with real-time updates using Vue reactivity
    - _Requirements: 5.1, 5.2_

  - [ ] 6.3 Add real-time validation and feedback
    - Implement live validation as user changes parameters
    - Create warning messages for suboptimal configurations
    - Add recommendation system for parameter suggestions
    - Display validation errors with clear, actionable messages
    - _Requirements: 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 7. Add basic plan visualization and progress tracking
  - [ ] 7.1 Implement progress visualization
    - Create basic progress tracking showing weekly mileage progression
    - Add visual indicators for training phases (base, build, peak, taper)
    - Display plan overview with key metrics and milestones
    - _Requirements: 5.7_

  - [ ] 7.2 Add educational workout information
    - Implement basic workout detail display with purpose explanations
    - Add training benefit descriptions for each workout type
    - Create simple tooltips explaining workout intensity and effort levels
    - _Requirements: 5.6_

- [ ] 8. Implement Vue stores and state management
  - [ ] 8.1 Create reactive stores with Vue 3 Composition API
    - Build planStore.ts with reactive state for current training plan
    - Create configStore.ts for user configuration and preferences
    - Implement computed properties for derived state (plan statistics, validation status)
    - Add watchers for automatic plan regeneration when configuration changes
    - _Requirements: 2.5_

  - [ ] 8.2 Add data persistence and user preferences
    - Integrate localStorage with Vue stores for automatic persistence
    - Create functions to save and load user configuration preferences
    - Add plan history storage for previously generated plans
    - Implement preference restoration on page reload
    - Build preference management interface for multiple configuration profiles
    - _Requirements: 2.5_

- [ ] 9. Create comprehensive testing suite
  - [ ] 9.1 Write unit tests for training science algorithms
    - Test workout distribution calculations for accuracy
    - Validate phase periodization logic with various configurations
    - Test deload week placement and volume calculations
    - Verify progressive overload calculations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3_

  - [ ] 9.2 Implement integration tests for plan generation
    - Test complete plan generation flow with various race distances
    - Validate generated plans follow all training science principles
    - Test parameter validation and error handling
    - Verify export functionality produces correct outputs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

---

## Phase 2 Tasks (Enhanced Features)

- [ ] 11. Add advanced workout variety
  - [ ] 11.1 Implement detailed workout types with progressions
    - Add tempo runs with beginner/intermediate/advanced progressions (20-60 min continuous or broken)
    - Implement interval training with race-specific progressions (400m-6000m repeats based on race distance)
    - Create hill repeat progressions with gradient and duration variations (30s-3min repeats)
    - Add fartlek/mixed workouts with unstructured speed play variations
    - Implement heart rate ranges and pace guidance for each workout type
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 11.2 Enhance workout distribution with 80/20 rule
    - Implement precise 80% easy/aerobic and 20% moderate/hard intensity split
    - Add quality workout rotation logic (tempo → intervals → hills cycle)
    - Create advanced workout sequencing with recovery optimization
    - _Requirements: 3.6, 3.7, 4.1, 4.4, 4.5_

- [ ] 12. Add deload week customization
  - [ ] 12.1 Implement deload week scheduling
    - Add DeloadFrequencyToggle component (3 or 4 weeks)
    - Implement deload week placement every 3rd or 4th week based on user preference
    - Create deload week workout modification logic (20-30% volume reduction)
    - _Requirements: 4.2, 4.3_

  - [ ] 12.2 Add LongRunDaySelector component
    - Create LongRunDaySelector dropdown component
    - Implement logic to place long runs on user-specified day
    - Add constraint satisfaction for long run day placement
    - _Requirements: 2.2, 2.3_

- [ ] 13. Implement export functionality
  - [ ] 13.1 Create export components
    - Build PDFGenerator component for client-side PDF generation
    - Add formatted layout with weekly breakdowns and workout details
    - Create printable version with optimized spacing and typography
    - _Requirements: 5.3_

  - [ ] 13.2 Build calendar export functionality
    - Implement CalendarExport component for ICS format generation
    - Add workout details as calendar event descriptions
    - Create recurring event handling for regular workout types
    - _Requirements: 5.3_

- [ ] 14. Add progress visualization
  - [ ] 14.1 Create ProgressChart component
    - Implement chart showing mileage progression over time
    - Add visual indicators for training phases (base, build, peak, taper)
    - Create interactive chart with week-by-week details
    - _Requirements: 5.4_

  - [ ] 14.2 Enhance WorkoutDetail components
    - Implement WorkoutDetail modal components with pace guidance
    - Add detailed workout descriptions and training benefits
    - Create intensity level indicators and heart rate guidance
    - _Requirements: 5.4_

- [ ] 15. Implement plan saving and loading
  - [ ] 15.1 Add localStorage integration
    - Create functions to save and load user configuration preferences
    - Add plan history storage for previously generated plans
    - Implement preference restoration on page reload
    - _Requirements: 2.5_

  - [ ] 15.2 Build preference management system
    - Create interface for managing saved preferences
    - Add ability to create and name multiple configuration profiles
    - Implement preference import/export functionality
    - _Requirements: 2.5_

- [ ] 16. Implement difficulty adjustment system
  - [ ] 16.1 Create DifficultySelector component
    - Build intuitive difficulty slider with 5 levels (veryEasy to veryHard)
    - Add visual indicators with icons and colors for each difficulty level
    - Implement tooltips explaining each difficulty level and target users
    - Create auto-suggestion system based on user profile factors
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 16.2 Implement difficulty adjustment algorithms
    - Create useDifficultyAdjustments.ts composable with volume/intensity multipliers
    - Implement workout modification based on difficulty level (0.7x to 1.3x multipliers)
    - Add progression rate adjustments (5%-15% weekly increases based on difficulty)
    - Create recovery time modifications and workout frequency adjustments
    - _Requirements: 3.1, 3.6, 4.1, 4.4, 4.5_

- [ ] 17. Implement comprehensive pace determination system
  - [ ] 17.1 Create VDOT-based pace calculator
    - Build useVdotCalculator.ts composable implementing Jack Daniels' VDOT system
    - Implement race time to VDOT conversion with oxygen cost calculations
    - Create training pace generation from VDOT (easy, marathon, threshold, interval, repetition)
    - Add race equivalency calculator using Riegel's formula for time predictions
    - _Requirements: 7.2, 7.3_

  - [ ] 17.2 Build PaceInputWizard component system
    - Create PaceInputWizard.vue with multiple input method selection (recent race, time trial, current pace, goal time, fitness level)
    - Build RecentRaceInput.vue component with race distance and time input using DaisyUI form components
    - Implement PaceZonesDisplay.vue showing personalized training zones with heart rate ranges
    - Add pace validation and realistic pace checking with warnings
    - _Requirements: 7.1, 7.4_

  - [ ] 17.3 Implement adaptive pace adjustments
    - Create useAdaptivePaceSystem.ts composable for environmental and phase-based pace adjustments
    - Add temperature adjustment (2% per 5°F above 60°F) and altitude adjustment (2% per 1000ft above 3000ft)
    - Implement training phase adjustments (base: +5%, build: +2%, peak: 0%, taper: -2%)
    - Create usePaceCalculator.ts composable to assign specific paces to workout types
    - _Requirements: 7.5, 7.6_

- [ ] 18. Add educational tooltips and guidance
  - [ ] 18.1 Implement educational tooltips
    - Add tooltips explaining workout purposes and training benefits
    - Create scientific rationale explanations for plan structure
    - Implement guidance on effort levels and pacing for each workout type
    - Add progressive disclosure for advanced training concepts
    - _Requirements: 5.4_

  - [ ] 18.2 Enhance user guidance system
    - Create contextual help for configuration options
    - Add validation messages with educational explanations
    - Implement recommendation system with scientific backing
    - Create onboarding flow explaining training principles
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

---

## Testing and Polish Tasks

- [ ] 19. Create comprehensive testing suite
  - [ ] 19.1 Write unit tests for training science algorithms
    - Test workout distribution calculations for accuracy
    - Validate phase periodization logic with various configurations
    - Test deload week placement and volume calculations
    - Verify progressive overload calculations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3_

  - [ ] 19.2 Implement integration tests for plan generation
    - Test complete plan generation flow with various race distances
    - Validate generated plans follow all training science principles
    - Test parameter validation and error handling
    - Verify export functionality produces correct outputs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 20. Polish user experience and performance
  - [ ] 20.1 Optimize plan generation performance
    - Profile and optimize algorithm performance for large plans
    - Implement progress indicators for plan generation
    - Add caching for frequently used calculations
    - _Requirements: 5.1, 5.2_

  - [ ] 20.2 Enhance responsive design and accessibility
    - Ensure interface works well on mobile and tablet devices
    - Add keyboard navigation support for all interactive elements
    - Implement screen reader compatibility for form elements and plan display
    - Test and optimize for various screen sizes and orientations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 5.1, 5.2_
