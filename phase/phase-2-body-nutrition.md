# Phase 2 — Body, Nutrition & Recovery

## Objective

Track the minimum additional information needed to support body recomposition.

---

# Body

Implement:

## Weight

User can log:

```text
date
weight
```

Weight should be quick to enter.

---

## Waist

User can optionally log:

```text
date
waist
```

No requirement to log daily.

---

# Nutrition

Track daily:

```text
calories
protein
carbs
fat
```

Allow manual meal entries.

A meal may contain:

```text
name
calories
protein
carbs
fat
```

Do NOT build an external food database.

---

# Recovery

Daily check-in:

```text
sleepHours
energy
soreness
```

Energy:

```text
1–10
```

Soreness:

```text
1–10
```

---

# Today Integration

Today screen should show:

```text
Weight
Calories
Protein
Sleep
Energy
```

Do not overload the screen.

---

# Acceptance Criteria

User can:

1. Log weight.
2. Log waist.
3. Log daily calories/macros.
4. Add meals manually.
5. Log sleep.
6. Log energy.
7. Log soreness.
8. Reopen the application and retain all data.

---

# Non-Goals

Do NOT implement:

* Calorie recommendations
* Nutrition adaptation
* Body-fat estimation
* AI food recognition
* Barcode scanning
* Food API
* Progress charts

Those belong to later phases.
