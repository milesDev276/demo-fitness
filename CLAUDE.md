# FitFlow — Personal Adaptive Fitness Tool

## 1. Project Overview

FitFlow is a personal fitness web application built primarily for one user.

The purpose is NOT to build a commercial fitness platform.

The purpose is:

> Build the smallest practical tool that helps the owner train consistently, track progress, manage nutrition, and gradually adapt the training plan.

The owner uses FitFlow as a personal supporting tool.

The application should minimize daily friction.

---

## 2. User Profile

Current baseline:

* Age: 24
* Sex: Male
* Height: 170 cm
* Weight: 80 kg
* Body fat: Unknown
* Experience: Beginner
* Push-ups: ~15
* Pull-ups: ~3
* Bodyweight squats: ~20
* 5K running: ~60 minutes
* Typical sleep: ~6 hours
* Work: Mostly sedentary
* Training availability: 4 days/week
* Training duration: 60–90 minutes/session
* Gym access: Yes
* Home equipment: None

Fitness goal:

> Body recomposition with a balanced 50/50 emphasis on lean/muscular physique and athletic performance.

The user currently has no fixed workout routine.

The application should generate and adapt the routine.

---

# 3. Product Philosophy

## Primary principle

> Don't make me think.

When the user opens the application, it should answer:

1. What should I do today?
2. How should I perform it?
3. Am I progressing?
4. What should change next week?

The user should not need to manually calculate progressive overload or design a weekly workout plan.

---

## 4. Scope

FitFlow should focus on only four domains:

### Body

* Weight
* Waist
* Basic body progress

### Workout

* Exercise
* Workout plan
* Sets
* Reps
* Weight
* RIR
* Workout history
* Progressive overload

### Nutrition

* Calories
* Protein
* Carbohydrates
* Fat
* Manual food/meal logging

### Recovery

* Sleep
* Energy
* Soreness

These inputs may later be used to adapt training and nutrition.

---

# 5. Explicitly Out of Scope

Do NOT add these unless explicitly requested:

* Social features
* Following/friends
* Public profiles
* Chat
* AI chatbot
* Authentication
* Multi-user architecture
* Payments
* Subscriptions
* Microservices
* Kafka
* RabbitMQ
* Redis
* Kubernetes
* Cloud infrastructure
* Wearable integrations
* Smart scale integrations
* Automatic food recognition
* Barcode scanning
* Body photo analysis
* Complex machine learning
* Complex recommendation models

Do not introduce infrastructure just because it is technically interesting.

---

# 6. Development Philosophy

This is a personal tool.

Prefer:

* Simple
* Local
* Fast
* Understandable
* Easy to modify
* Easy to debug

Avoid:

* Premature abstraction
* Enterprise architecture
* Excessive design patterns
* Over-engineering
* Unnecessary dependencies
* Complex state management
* Complex backend architecture

Every feature must justify its existence by improving the owner's actual workflow.

---

# 7. Technology Stack

Initial stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* Dexie
* IndexedDB
* Recharts

The application should initially be local-first.

Do not add a backend unless a concrete requirement appears.

---

# 8. Architecture

Use feature-oriented organization.

Preferred structure:

src/
├── components/
├── pages/
├── features/
│   ├── workout/
│   ├── body/
│   ├── nutrition/
│   ├── adaptive/
│   └── progress/
├── data/
├── db/
├── store/
├── utils/
└── App.tsx

Keep domain logic close to the relevant feature.

Do not create generic abstractions unless they are used multiple times.

---

# 9. Core Data

The initial data model should remain small.

Expected entities:

* UserProfile
* Exercise
* WorkoutPlan
* WorkoutSession
* WorkoutSet
* BodyLog
* DailyCheckIn
* NutritionLog

Do not create additional entities unless there is a clear requirement.

---

# 10. Adaptive System Philosophy

The adaptive system must initially be deterministic and rule-based.

Do NOT use AI or machine learning.

Same input should produce predictable results.

Example:

If:

* Target reps = 8–10
* All sets reach 10 reps
* RIR is appropriate

Then:

> Increase load for the next session.

The system should be explainable.

Every adaptive decision should be possible to explain to the user.

Example:

> Bench Press increased from 60kg to 62.5kg because all prescribed sets reached the upper rep range.

---

# 11. Workout Philosophy

The user's goal is balanced:

* 50% muscular development
* 50% athletic development

The system should support:

* Resistance training
* Strength
* Hypertrophy
* Cardio
* Conditioning
* Basic mobility

The user has:

* 4 training days/week
* 60–90 minutes/session
* Gym access
* No home equipment

The workout system must NOT hard-code a permanent weekly split.

The weekly plan should be generated from:

* Available days
* Session duration
* Previous training
* Muscle recovery
* Performance
* Recovery state
* Goal balance

---

# 12. Nutrition Philosophy

Nutrition is for body recomposition.

The user wants manual tracking.

Track:

* Calories
* Protein
* Carbs
* Fat

Nutrition adaptation should use trends rather than reacting to a single day's weight.

Do not claim exact body-fat changes without reliable measurements.

---

# 13. UX Principles

The UI should be:

* Clean
* Minimal
* Fast
* Mobile-friendly
* Desktop-friendly
* Information-dense but not cluttered

Primary navigation:

1. Today
2. Workout
3. Progress
4. Me

The Today screen is the most important screen.

---

# 14. Daily Workflow

The ideal daily flow:

Open app
→ See today's recommendation
→ Start workout
→ Log sets
→ Finish workout
→ Log nutrition
→ Log weight/recovery
→ Close app

The user should not need to navigate through many screens.

---

# 15. Weekly Workflow

At the end of each week:

Workout data
+
Body data
+
Nutrition data
+
Recovery data
+
Performance
↓
Analyze
↓
Generate next week's plan

The user should be able to review the changes before accepting them.

---

# 16. Coding Rules

Before implementing a feature:

1. Understand the current architecture.
2. Inspect existing files.
3. Reuse existing components and utilities.
4. Avoid unnecessary dependencies.
5. Keep changes scoped to the current phase.

After implementation:

1. Run type checking.
2. Run lint if configured.
3. Run tests if available.
4. Fix errors.
5. Verify the actual user flow.
6. Summarize changed files and behavior.

Do not silently modify unrelated features.

---

# 17. Phase Rules

Each phase must have:

* Clear goal
* Explicit scope
* Explicit non-goals
* Acceptance criteria

Do not implement features from future phases unless they are required for the current phase.

If a future feature is discovered, document it instead of implementing it.

---

# 18. Important Rule

When uncertain between:

A. A simple solution that solves the current problem

and

B. A sophisticated generalized solution

Choose A.

FitFlow is a personal tool.

The goal is usefulness, not architectural complexity.
