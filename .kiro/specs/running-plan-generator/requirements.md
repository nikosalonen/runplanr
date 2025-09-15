# Requirements Document

## Introduction

The Running Plan Generator is a web-based application that creates personalized training plans for runners based on established running science principles. The system will generate customized training schedules that incorporate different types of workouts (Zone 2, intervals, tempo runs, long runs, hill repeats) while allowing users to specify their preferences for program length, race distance, training frequency, and scheduling constraints.

**Units and Measurements**: The application uses the metric system (kilometers, meters) as the primary unit system. All distances, paces, and measurements are displayed in metric units. Imperial unit support (miles, feet) is planned for future implementation but is not included in the current scope.

## Requirements

### Requirement 1

**User Story:** As a runner, I want to specify my target race distance and training preferences, so that I can receive a personalized training plan tailored to my goals.

#### Acceptance Criteria

1. WHEN a user accesses the plan generator THEN the system SHALL display options for 5K, 10K, Half Marathon, and Marathon race distances
2. WHEN a user selects a race distance THEN the system SHALL provide appropriate program length recommendations based on the selected distance
3. WHEN a user adjusts the program length slider THEN the system SHALL update the plan duration in real-time
4. WHEN a user selects training days per week THEN the system SHALL validate that the selection is between 3-7 days
5. IF a user selects fewer than 4 training days per week THEN the system SHALL display a warning about limited training effectiveness

### Requirement 2

**User Story:** As a runner, I want to customize my weekly schedule preferences, so that my training plan fits my lifestyle and availability.

#### Acceptance Criteria

1. WHEN a user selects rest day preferences THEN the system SHALL allow specification of preferred rest days of the week
2. WHEN a user chooses a long run day THEN the system SHALL schedule all long runs on that selected day throughout the plan
3. WHEN a user specifies training days per week THEN the system SHALL distribute workouts evenly across the selected days
4. IF a user selects consecutive rest days THEN the system SHALL warn about potential training disruption
5. WHEN a user changes schedule preferences THEN the system SHALL regenerate the plan to reflect the new constraints

### Requirement 3

**User Story:** As a runner, I want my training plan to include scientifically-backed workout types, so that I can improve my performance effectively and safely.

#### Acceptance Criteria

1. WHEN the system generates a plan THEN it SHALL include Zone 2 runs for aerobic base building
2. WHEN the system generates a plan THEN it SHALL include high-intensity workouts (intervals, track work) for VO2 max development
3. WHEN the system generates a plan THEN it SHALL include tempo runs for lactate threshold improvement
4. WHEN the system generates a plan THEN it SHALL include hill repeats for strength and power development
5. WHEN the system generates a plan THEN it SHALL include progressive long runs for endurance building
6. WHEN the system generates a plan THEN it SHALL balance workout intensity to prevent overtraining
7. IF the program length is less than 8 weeks THEN the system SHALL prioritize essential workout types based on race distance

### Requirement 4

**User Story:** As a runner, I want my training plan to include proper recovery periods, so that I can avoid overtraining and reduce injury risk.

#### Acceptance Criteria

1. WHEN the system generates a plan THEN it SHALL include designated rest days based on user preferences
2. WHEN the system generates a plan THEN it SHALL include deload weeks every 3rd or 4th week based on user selection
3. WHEN a deload week occurs THEN the system SHALL reduce training volume by 20-30% while maintaining workout variety
4. WHEN the system schedules high-intensity workouts THEN it SHALL ensure adequate recovery time between intense sessions
5. IF consecutive high-intensity days are scheduled THEN the system SHALL automatically adjust to prevent overload

### Requirement 5

**User Story:** As a runner, I want to view and export my complete training plan, so that I can follow it consistently and track my progress.

#### Acceptance Criteria

1. WHEN a plan is generated THEN the system SHALL display a complete weekly breakdown for the entire program
2. WHEN a user views the plan THEN the system SHALL show workout types, durations, and intensity levels for each training day
3. WHEN a user requests plan export THEN the system SHALL provide options for PDF, calendar format, or printable view
4. WHEN displaying workouts THEN the system SHALL include clear descriptions of pace/effort levels for each workout type
5. WHEN showing long runs THEN the system SHALL display progressive distance increases following the 10% rule in kilometers
6. WHEN a user views workout details THEN the system SHALL provide educational information about workout purposes and training benefits
7. WHEN displaying the plan THEN the system SHALL show progress visualization with weekly distance progression over time in kilometers
8. WHEN displaying distances and paces THEN the system SHALL use metric units (kilometers, meters, minutes per kilometer) as the primary measurement system

### Requirement 6

**User Story:** As a runner, I want the system to validate my training plan parameters, so that I receive a safe and effective program.

#### Acceptance Criteria

1. WHEN a user selects program parameters THEN the system SHALL validate that the combination is physiologically sound
2. IF a user selects a program length too short for their race distance THEN the system SHALL display minimum recommended duration warnings
3. WHEN generating a marathon plan THEN the system SHALL require a minimum of 12 weeks program length
4. WHEN generating a 5K plan THEN the system SHALL allow programs as short as 6 weeks
5. IF a user selects more than 6 training days per week THEN the system SHALL warn about overtraining risks
6. WHEN validating parameters THEN the system SHALL ensure adequate time for base building relative to race distance
7. WHEN the system applies the 80/20 training rule THEN it SHALL ensure 80% of training is at easy/aerobic intensity and 20% at moderate/hard intensity
8. WHEN calculating weekly training volumes THEN the system SHALL use kilometers as the base unit for all distance calculations and display

### Requirement 7

**User Story:** As a runner, I want to input my current fitness level through various methods, so that I can receive personalized training paces for my workouts.

#### Acceptance Criteria

1. WHEN a user accesses pace determination THEN the system SHALL offer multiple input methods (recent race, time trial, current training pace, goal time, fitness assessment)
2. WHEN a user enters a recent race result THEN the system SHALL calculate personalized training paces using VDOT methodology
3. WHEN training paces are calculated THEN the system SHALL provide pace ranges for recovery, easy, marathon, threshold, interval, and repetition zones in minutes per kilometer
4. WHEN displaying pace zones THEN the system SHALL include heart rate correlations and effort descriptions with paces shown in metric format (min/km)
5. WHEN environmental conditions change THEN the system SHALL provide pace adjustments for temperature and altitude using metric measurements
6. WHEN training phases change THEN the system SHALL adjust recommended paces accordingly in minutes per kilometer format

### Requirement 8

**User Story:** As a runner, I want to adjust the difficulty level of my training plan, so that it matches my current fitness level and training goals.

#### Acceptance Criteria

1. WHEN a user selects a difficulty level THEN the system SHALL offer 5 levels from very easy to very hard
2. WHEN difficulty is adjusted THEN the system SHALL modify training volume by 0.7x to 1.3x multipliers with distances calculated in kilometers
3. WHEN difficulty affects progression THEN the system SHALL adjust weekly increase rates from 5% to 15% for kilometer-based volume progression
4. WHEN difficulty impacts recovery THEN the system SHALL modify rest periods and workout frequency accordingly
5. WHEN displaying difficulty options THEN the system SHALL provide clear descriptions and target user guidance with all examples using metric units
