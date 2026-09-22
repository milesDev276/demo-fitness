# FitFlow Development Roadmap

## Phase 0 — Foundation

Goal:

> Create a clean local-first application foundation.

Tasks:

* Create React + TypeScript + Vite project
* Configure Tailwind
* Configure Zustand
* Configure Dexie
* Create folder structure
* Create database
* Seed exercises
* Create basic navigation
* Create base layout

Acceptance:

* Application runs
* Database initializes
* Exercises can be loaded
* Navigation works

Do not build adaptive logic.

---

# Phase 1 — Workout Logger

Goal:

> Replace a notebook for actual gym sessions.

Features:

* Exercise list
* Workout creation
* Workout session
* Set logging
* Weight
* Reps
* RIR
* Previous performance
* Workout completion
* Workout history

Acceptance:

User can:

```text
Open app
→ select workout
→ perform exercise
→ log sets
→ complete workout
→ close app
→ reopen app
→ see the saved workout
```

---

# Phase 2 — Body + Nutrition

Goal:

> Track the minimum data needed for recomposition.

Body:

* Weight
* Waist

Nutrition:

* Calories
* Protein
* Carbs
* Fat
* Meal logging

Recovery:

* Sleep
* Energy
* Soreness

Acceptance:

User can log a complete day.

---

# Phase 3 — Progress

Goal:

> Answer "Am I progressing?"

Features:

* Weight chart
* Waist chart
* Exercise progression
* Cardio progression
* Workout consistency
* Weekly summary

Acceptance:

User can understand progress without manually calculating it.

---

# Phase 4 — Adaptive Workout

Goal:

> Automatically adjust individual exercises.

Features:

* Progressive overload
* RIR rules
* Performance trend
* Recovery adjustment
* Exercise substitution

Acceptance:

The application can determine the next target for an exercise.

---

# Phase 5 — Adaptive Weekly Planner

Goal:

> Automatically build the next training week.

Inputs:

* Available days
* Session duration
* Previous training
* Recovery
* Muscle volume
* Athletic workload
* Goal balance

Output:

> Next week's workout schedule.

User must be able to review and accept the plan.

---

# Phase 6 — Real Usage / Polish

Stop adding features.

Use FitFlow in real training for 2–4 weeks.

Record:

* Friction
* Missing information
* Unnecessary information
* Slow workflows
* Annoying interactions

Only fix problems discovered through actual use.

---

# Phase 7 — Optional Future Features

Only consider after real usage:

* PWA
* Cloud backup
* Body photos
* Smart scale
* Wearables
* AI analysis
* Mobile application

These are not part of MVP.
