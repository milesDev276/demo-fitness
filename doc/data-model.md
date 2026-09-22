# FitFlow Product Specification

## 1. Product Statement

FitFlow is a personal adaptive fitness tool for body recomposition.

It helps one user:

* Know what workout to do today.
* Know how to perform the workout.
* Track actual performance.
* Track nutrition.
* Track body progress.
* Automatically adjust future training and nutrition.

---

# 2. Goal

Primary goal:

> Body recomposition.

Secondary goals:

* Develop lean/muscular physique.
* Improve athletic performance.
* Improve strength.
* Improve cardiovascular fitness.
* Maintain training consistency.

Goal balance:

```text
Muscular / Aesthetic: 50%
Athletic / Performance: 50%
```

---

# 3. Current User

```text
Age: 24
Sex: Male
Height: 170 cm
Weight: 80 kg
Experience: Beginner

Push-ups: ~15
Pull-ups: ~3
Squats: ~20
5K: ~60 minutes

Sleep: ~6 hours
Work: Mostly sedentary

Training:
4 days/week
60–90 minutes/session

Equipment:
Gym
No home equipment
```

---

# 4. Core Questions

The product must answer four questions.

### Question 1

> What should I do today?

### Question 2

> How should I do it?

### Question 3

> Am I actually progressing?

### Question 4

> What should change next?

---

# 5. Core Features

## Workout

* Exercise library
* Workout plan
* Workout session
* Set logging
* Weight
* Reps
* RIR
* Previous performance
* Workout history

## Body

* Weight
* Waist
* Trend

## Nutrition

* Calories
* Protein
* Carbs
* Fat
* Manual meal logging

## Recovery

* Sleep
* Energy
* Soreness

## Adaptive

* Progressive overload
* Recovery adjustment
* Weekly planning
* Nutrition adjustment

---

# 6. Primary Screens

## Today

The most important screen.

Must show:

* Today's workout
* Estimated duration
* Current body status
* Nutrition status
* Weekly training status

Primary CTA:

> Start Workout

---

## Workout

Must allow:

* View exercises
* View previous performance
* Log sets
* Edit sets
* Complete exercise
* Complete workout

---

## Progress

Must show:

* Weight trend
* Waist trend
* Strength progression
* Cardio progression
* Workout consistency

Avoid unnecessary charts.

---

## Me

Must contain:

* Goal
* Training availability
* Session duration
* Equipment
* Preferences
* Basic settings

---

# 7. Design Principle

The application should minimize interaction.

A normal daily session should require:

```text
Open
→ Read recommendation
→ Train
→ Log
→ Done
```

Avoid unnecessary forms and confirmations.
