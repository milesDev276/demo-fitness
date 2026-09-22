# Phase 4 — Adaptive Workout

## Objective

Make FitFlow automatically adjust individual exercises based on actual performance.

This is the first phase where FitFlow becomes an adaptive tool.

---

# Rule 1 — Progressive Overload

Default target:

```text
8–10 reps
RIR 1–3
```

If:

```text
all sets >= 10 reps
AND
RIR is appropriate
```

increase load.

Example:

```text
60kg
10 / 10 / 10
RIR 2
```

Next:

```text
62.5kg
8–10 reps
```

---

# Rule 2 — Maintain

If performance remains within the target range:

Keep the same load.

Example:

```text
60kg
9 / 8 / 8
```

Next:

```text
60kg
8–10 reps
```

---

# Rule 3 — Reduce

If performance declines across multiple sessions:

Consider:

* Lower weight
* Lower sets
* Recovery adjustment

Do not react to one bad workout.

---

# Rule 4 — Recovery

Use:

```text
sleepHours
energy
soreness
```

If recovery is low:

* Reduce volume.
* Reduce intensity.
* Reduce conditioning.

Prefer modification over cancellation.

---

# Rule 5 — Explain Every Change

Every change must have a reason.

Example:

```text
Bench Press:
60kg → 62.5kg

Reason:
You completed all 3 sets at the upper rep target
with RIR 2 in the previous session.
```

---

# Rule Engine Design

Keep rules pure where possible.

Example conceptual API:

```text
calculateNextExerciseTarget(
    exerciseHistory,
    currentTarget,
    recoveryState
)
```

Input → deterministic output.

Do not use AI.

---

# Acceptance Criteria

Given historical workout data, FitFlow can:

1. Recommend the next load.
2. Recommend keeping the current load.
3. Recommend reducing load/volume when justified.
4. Adjust based on recovery.
5. Explain the recommendation.

---

# Non-Goals

Do NOT implement:

* AI
* Machine learning
* Chat
* Automatic weekly schedule generation
* Nutrition adaptation
