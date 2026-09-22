# FitFlow Adaptive Rules

## Philosophy

The adaptive system is deterministic and explainable.

It must not use AI or machine learning in the MVP.

The system should make small adjustments instead of constantly rebuilding the entire program.

---

# 1. Progressive Overload

Default rep range:

```text
8–10 reps
```

Example:

```text
3 sets
8–10 reps
RIR target: 1–3
```

## Increase load

Increase load when:

```text
All prescribed sets reach max reps
AND
RIR is within acceptable range
```

Example:

```text
60kg
10 / 10 / 10
RIR 2
```

Next target:

```text
62.5kg
8–10 reps
```

---

# 2. Maintain Load

Keep the same load when:

```text
Performance is within target range
BUT
maximum reps have not consistently been reached.
```

Example:

```text
60kg
9 / 8 / 8
```

Next session:

```text
60kg
8–10 reps
```

---

# 3. Reduce Load

Consider reducing load when:

```text
Performance declines across multiple sessions
OR
RIR repeatedly reaches 0
OR
Recovery is consistently poor
```

Do not reduce load because of one bad set.

---

# 4. Recovery Adjustment

Inputs:

```text
sleepHours
energy
soreness
```

Low recovery may reduce:

* Training volume
* Intensity
* Conditioning

Do not automatically cancel a workout unless the user explicitly chooses rest.

---

# 5. Weekly Volume

Track approximate sets by primary muscle group.

Example:

```text
Chest: 10
Back: 12
Quads: 8
Hamstrings: 8
Shoulders: 8
```

The system should look for:

* Very low volume
* Excessive volume
* Large imbalance
* Repeated fatigue

Do not optimize for exact scientific precision.

The system is a practical personal tool.

---

# 6. Athletic Training

Athletic component may include:

* Running
* Zone 2 cardio
* Intervals
* Conditioning
* Basic mobility

The system should balance resistance training and conditioning.

Do not allow cardio volume to unnecessarily interfere with resistance training recovery.

---

# 7. Nutrition Adaptation

Use trends.

Inputs:

```text
Weight trend
Waist trend
Calorie adherence
Protein adherence
Training performance
Energy
```

Do not react strongly to one day's weight.

---

# 8. Recomposition Signals

Potentially positive pattern:

```text
Weight ↓
Waist ↓
Strength ↑ or stable
```

Potentially positive pattern:

```text
Weight stable
Waist ↓
Strength ↑
```

Potential concern:

```text
Weight ↓ quickly
Strength ↓
Energy ↓
```

Potential concern:

```text
Weight ↑ quickly
Waist ↑
Strength unchanged
```

The system should present these as signals, not medical diagnoses.

---

# 9. Explainability

Every adaptive change should produce a short reason.

Examples:

```text
Bench Press increased by 2.5kg because you reached
the upper rep target for all sets in the previous session.
```

```text
Today's lower-body volume was reduced because your
recent recovery has been low and performance has declined.
```

```text
Calories were kept unchanged because your recent weight
and waist trends are consistent with your current goal.
```

---

# 10. Important Rule

Prefer small changes.

Do not completely redesign the user's program because of small fluctuations.
