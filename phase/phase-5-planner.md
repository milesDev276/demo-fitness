# Phase 5 — Adaptive Weekly Planner

## Objective

Automatically generate the user's next training week.

The user has:

```text
4 training days/week
60–90 minutes/session
Gym
50% muscular
50% athletic
```

---

# Inputs

The planner should consider:

```text
availableDays
sessionDuration
previousTraining
muscleVolume
exercisePerformance
recovery
cardioLoad
goalBalance
```

---

# Training Components

Use a small number of templates.

Examples:

```text
Upper Strength
Lower Strength
Upper Hypertrophy
Lower Hypertrophy
```

Conditioning/cardio may be attached to sessions.

Do not create dozens of templates.

---

# Planning Rules

The planner should:

1. Respect available days.
2. Avoid training the same muscle group heavily on consecutive days.
3. Balance upper/lower training.
4. Maintain the 50/50 muscular/athletic goal.
5. Respect recent fatigue.
6. Respect session duration.
7. Continue exercise progression.
8. Avoid unnecessary complexity.

---

# Example

Available:

```text
Mon
Tue
Thu
Sat
```

Possible result:

```text
Mon
Upper Strength + short conditioning

Tue
Lower Strength

Thu
Upper Hypertrophy + cardio

Sat
Lower Hypertrophy + athletic conditioning
```

This is an example, not a hard-coded split.

---

# User Review

Before applying the new week:

Show:

```text
NEXT WEEK

Monday
Upper Strength

Tuesday
Lower Strength

Thursday
Upper Hypertrophy

Saturday
Lower + Conditioning
```

Allow:

```text
[ ACCEPT PLAN ]
```

The plan should not silently replace the existing plan.

---

# Acceptance Criteria

Given:

* Availability
* Previous week
* Recovery
* Performance

FitFlow generates a coherent next week.

The plan:

* Uses the requested number of sessions.
* Fits session duration.
* Respects recovery.
* Contains both muscular and athletic components.
* Uses progressive overload where appropriate.

---

# Non-Goals

Do NOT implement:

* AI
* Chat
* Long-term prediction
* Complex optimization algorithms
* Social sharing
