# Phase 0 — Foundation

## Objective

Build the minimum technical foundation for FitFlow.

Do not implement product features beyond what is required for the foundation.

---

## Tasks

### 1. Project

Create:

```text
React
TypeScript
Vite
```

Configure:

* Tailwind CSS
* ESLint
* TypeScript strict mode

---

### 2. Dependencies

Use:

* Zustand
* Dexie
* Recharts

Do not install additional libraries without a clear reason.

---

### 3. Folder Structure

Create:

```text
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
└── utils/
```

---

### 4. Database

Create Dexie database.

Initial tables:

```text
userProfile
exercises
workoutPlans
workoutSessions
workoutSets
bodyLogs
dailyCheckIns
nutritionLogs
```

Do not add more tables.

---

### 5. Exercise Seed

Create approximately 30–50 useful exercises.

Include:

* Compound movements
* Isolation movements
* Bodyweight movements
* Cardio movements

Each exercise should contain:

```text
name
category
equipment
primaryMuscle
secondaryMuscles
movementPattern
isBodyweight
```

---

### 6. Navigation

Create:

```text
Today
Workout
Progress
Me
```

At this phase pages can contain placeholder content.

---

## Acceptance Criteria

The following must work:

1. `npm run dev`
2. Application loads.
3. Navigation works.
4. Database initializes.
5. Exercise seed is available.
6. No TypeScript errors.
7. No console errors.

---

## Non-Goals

Do NOT implement:

* Workout logging
* Adaptive logic
* Nutrition UI
* Progress charts
* Authentication
* Backend
* AI
* Notifications

---

## Final Response Required

After implementation, report:

1. Files created/changed
2. Dependencies added
3. Database tables
4. Commands used for verification
5. Any known issues

Do not start Phase 1 automatically.
