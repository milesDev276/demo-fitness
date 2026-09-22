# Phase 1 — Workout Logger

## Objective

Make FitFlow usable during a real gym session.

The user should be able to replace a notebook with the application.

---

# Core Flow

```text
Today
↓
Today's workout
↓
Start Workout
↓
Exercise
↓
Log sets
↓
Complete exercise
↓
Next exercise
↓
Complete workout
↓
Workout history
```

---

# Features

## 1. Workout Plan

Create a workout containing exercises.

Each planned exercise:

```text
exerciseId
order
targetSets
minReps
maxReps
targetRIR
```

---

## 2. Workout Session

When the user starts a workout:

Create a WorkoutSession.

Track:

```text
startTime
endTime
duration
status
```

---

## 3. Set Logging

Allow:

```text
weight
reps
RIR
```

The user must be able to:

* Add set
* Edit set
* Delete set

---

## 4. Previous Performance

For every exercise, display the most recent completed performance.

Example:

```text
LAST TIME

60kg
8 / 8 / 8
RIR 2
```

This is a high-priority UX feature.

---

## 5. Workout Completion

When completed:

* Save all sets
* Save duration
* Mark session completed
* Update history

---

## 6. History

Display:

```text
Date
Workout
Duration
Exercises
```

Allow the user to open a previous workout.

---

# UX Requirements

The workout screen should require minimal typing.

Use large touch-friendly controls.

Optimize for phone-sized screens even though the application is a web app.

Do not make the user navigate through unnecessary screens.

---

# Acceptance Criteria

A real workout can be completed entirely inside FitFlow.

Example:

```text
Bench Press
60kg × 8 × 3

Lat Pulldown
45kg × 10 × 3

Lateral Raise
8kg × 12 × 3
```

After refreshing the page, all data remains available.

Previous performance appears automatically on the next workout.

---

# Non-Goals

Do NOT implement:

* Progressive overload
* Automatic weekly planning
* Nutrition
* Charts
* AI
* Cardio analytics

Those belong to later phases.

---

# Verification

Test:

1. Start workout
2. Add multiple exercises
3. Add multiple sets
4. Edit a set
5. Delete a set
6. Complete workout
7. Refresh browser
8. Reopen workout history
9. Start the same workout again
10. Verify previous performance appears

Do not start Phase 2 automatically.
