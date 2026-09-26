# FitFlow UX Audit (Phase 7, Step 1)

Scope: existing Phase 1–6 app, audited by reading every screen's code and by driving the production build at 390px in headless Chrome (screenshots of Today, logger, planner, Progress, Me).
No code was changed before this audit was written.

## The one-paragraph diagnosis

The app has the right *features* but the wrong *shape* for daily use. Today is a long form (five bordered boxes, ~12 inputs) rather than an answer to "what do I do now?". A new plan never lands on today, so Today is a dead end most days. The workout logger makes you leave the exercise after every exercise, loses the rest timer when you do, and never says "set 2 of 4". Inputs save silently on blur, so you can't tell if anything worked. Several jargon terms are never explained, and a few stale developer messages are visible in the UI.

## Primary-flow audit

Open → Today → see workout → start → log set → rest → log set → complete → recovery → nutrition/body → finish.

| Step | What actually happens | Verdict |
|---|---|---|
| Open → see today's workout | Only shows a workout if a generated plan is dated *today*. The planner only generates **next Monday's week**, so for a new user (or any day of the current week) Today says "No workout scheduled… Go to Workout". | **Broken** |
| Start | "Start Workout" button on Today (good) — only when the above works. Otherwise: Workout tab → alphabetical list of every plan ever generated → Start. | Poor |
| Log set | Must open an exercise from an overview list. Weight starts at 0 on first use. No "Set 2 of 4". | Friction |
| Rest | Timer appears *below* Log Set and is lost if you go back to the exercise list. Fixed 90 s. Drifts if the phone sleeps (tick counted by `setTimeout`). | Fragile |
| Next exercise | Must tap "← Back to workout", find the next exercise, tap it. Every exercise. | Friction |
| Complete | Good summary screen. "Finish" returns to the Workout list, not Today, so the next step (recovery) is a manual tab switch. | Dead end |
| Recovery / nutrition / body | Bottom of a long Today page; each field silently saves on blur. Numeric mobile keyboards (iOS) have no Enter key, so the value is only saved if you tap elsewhere. | Uncertain |

## Issues

Each issue: **current** → **why it's a problem** → **fix** → *files*.

### CRITICAL (prevents or seriously interferes with normal use)

**C1. Today is a dead end when no plan is dated today.**
Current: planner always plans next week (`generateWeeklyPlan`: `weekStart = monday + 7`); Today only queries `scheduledDate == today`.
Problem: the app's core promise ("see today's workout") fails for a new user, mid-week, or after a missed day.
Fix: Today shows the *next planned workout* (upcoming, or a missed one from the last 7 days) with a Start button, and the planner can plan *this week* (remaining days) when the current week has no plan. Loading state no longer flashes "No workout".
*Files:* `planner/weeklyPlanner.ts`, `planner/repository.ts`, `planner/types.ts`, `workout/repository.ts`, `TodayWorkoutCard.tsx`, `WeeklyPlanScreen.tsx`.

**C2. Plan screen hides its primary action.**
Current: "Accept Plan" is below the explanation block, below the fold and partly behind the bottom nav.
Problem: the user reads a screen and can't find the button that finishes the task.
Fix: sticky Accept/Regenerate bar; the explanation is collapsed to one line + "Why?" (progressive disclosure).
*Files:* `WeeklyPlanScreen.tsx`.

**C3. Logger has no set/exercise progress and forces a round trip per exercise.**
Current: button says "Log Set"; only already-logged sets are listed; after the last set you must go Back → pick next exercise.
Problem: the user can't tell what set they're on or what's next.
Fix: "Log set 2 of 4"; after the last planned set a primary "Next: <exercise> →" button; the session overview marks the next exercise and shows "3/4 sets" or "✓".
*Files:* `ExerciseLogger.tsx`, `ActiveSession.tsx`.

**C4. Rest timer is fragile.**
Current: state lives inside the logger (lost when leaving the exercise), counts with per-second `setTimeout` (wrong after the phone sleeps), fixed 90 s, sits below the button.
Problem: while training you always leave/re-enter screens and lock the phone.
Fix: timer lives in the session, is a slim sticky bar visible on every session screen, computes from an end timestamp.
*Files:* `RestTimer.tsx`, `ActiveSession.tsx`, `ExerciseLogger.tsx`.

**C5. Switching tabs destroys in-progress work.**
Current: only the active page is mounted; leaving the Workout tab unmounts the logger (weight/reps/RIR draft, open exercise), the plan editor (unsaved plan), and the timer.
Problem: checking Today mid-workout loses state.
Fix: keep the Workout page mounted (hidden) so its state survives tab switches; scroll resets on page change.
*Files:* `App.tsx`.

**C6. Silent saves.**
Current: Body/Nutrition/Recovery/Targets fields save on blur with no indication; iOS decimal keypad has no Enter.
Problem: the user can't tell whether a value is saved; typing then closing the app loses it.
Fix: one shared `QuickField`: shows a **Save** button as soon as the value differs, Enter also saves, blur also saves, a "Saved ✓" state confirms. Replaces four near-identical copies.
*Files:* new `components/QuickField.tsx`; `BodyCard`, `NutritionCard`, `RecoveryCard`, `NutritionTargetsCard`.

**C7. Real bug: a stray "0" is printed in Strength progress.**
Current: `{summary.estimated1RM && (…)}` renders `0` when the estimate is 0. Also shows "0kg × 8" for bodyweight/unweighted sets.
Fix: guard properly; format unweighted sets as "8 reps" everywhere (logger, history, progress).
*Files:* `StrengthProgressCard.tsx`, new `utils/format.ts`, `ExerciseLogger.tsx`, `HistoryDetail.tsx`.

### IMPORTANT (significant friction)

**I1. Today is long and box-heavy.** Five separate cards, four nutrition inputs + meals + waist + a second row of body history — Recovery is below the fold. Fix: the workout is a single prominent card; Body, Nutrition and Recovery become one "Log today" panel with divider sections showing only the essentials (weight; calories + protein with progress vs target; sleep/energy/soreness). Waist, carbs, fat, meals and body history sit under "More". Checklist chips scroll to the matching section. *Files:* `TodayPage.tsx`, `DailyChecklist.tsx`, the three cards.

**I2. "Finish" doesn't return to Today.** After the completion screen the user lands on the Workout list. Fix: Finish → Today (which now says "Workout completed" and shows recovery is next). *Files:* `WorkoutPage.tsx`, `ActiveSession.tsx`.

**I3. Workout tab is a flat alphabetical dump.** Every generated plan from every week is listed with manual plans, Start next to each; "Plan Week" / "History" are tiny text links. Fix: "This week" (dated, with Today/Done/Missed status, sorted by date) then "My workouts"; older generated plans are hidden from the list (still in history); clearer header actions. *Files:* `PlanList.tsx`, `workout/repository.ts`.

**I4. Recommendation is heavy and duplicates "Last time".** Two stacked panels, a "low evidence" jargon badge, a separate "Use 52.5kg" button even when the weight is already applied. Fix: one compact panel — "Last time: 50kg × 10 · 10 · 9, RIR 2 / Suggested: 52.5kg × 3 × 8–10" with "Why?" on demand; "Use" button only when the current weight differs. *Files:* `RecommendationCard.tsx`, `ExerciseLogger.tsx`.

**I5. Jargon is unexplained.** RIR (logger, plan editor), "Estimated 1RM", "evidence", "Min/Max". Fix: a tiny `InfoTip` ("?") with a one-line plain-language explanation; "Estimated 1RM" → "Estimated max (1 rep)". *Files:* new `components/InfoTip.tsx`, `ExerciseLogger.tsx`, `PlanEditor.tsx`, `StrengthProgressCard.tsx`, `RecommendationCard.tsx`.

**I6. Numeric input friction in the logger.** Weight/reps inputs snap to 0 as you clear them and don't select on focus; fixed 2.5 kg step for everything (a 2.5 kg jump is huge for dumbbells). Fix: select-on-focus; step 2.5 for barbell/machine/cable, 1 otherwise. *Files:* `ExerciseLogger.tsx`.

**I7. Accidental set deletion.** A 32px red × sits next to every set. Fix: remove it from the list; tapping a set opens edit mode, where "Delete set" lives. *Files:* `ExerciseLogger.tsx`.

**I8. Progress isn't ordered by "am I improving?"** Seven sections, weekly summary at the *bottom*, empty Waist card, photo upload controls dominating the top of Photos, doubled headings ("Strength" then "STRENGTH"), nutrition shown with no reference to targets. Fix: order = This week → Weight → Strength → Consistency → Nutrition (vs target) → Photos (collapsed add form) → Cardio (only if data); hide Waist until logged; remove duplicate headings; empty states offer an action. *Files:* `ProgressPage.tsx`, progress cards, `PhotosSection.tsx`.

**I9. Stale developer text in the UI.** Consistency card: "Planned-vs-completed adherence isn't tracked yet — that arrives with the weekly planner." Remove. *Files:* `ConsistencyCard.tsx`.

**I10. Manual plan editor fields can't be cleared** (same snap-back bug fixed on Me) and Save has no error handling/feedback. Fix: reuse `NumberField` (compact), wrap save in `safely`. *Files:* `PlanEditor.tsx`, `NumberField.tsx`.

**I11. Misleading copy on Me.** "Available training days … available this week" (it's standing availability); "Sessions per week" vs available days is unexplained. Fix: helper text "FitFlow schedules N of your available days." *Files:* `ProfileCard.tsx`.

**I12. Empty/loading states.** Today flashes "No workout scheduled" while loading. Empty states are "No data" style without an action (Progress weight/waist, photos, strength). Fix: null-vs-undefined loading, and one-line empty states with a button ("Log weight" → Today). *Files:* `TodayWorkoutCard.tsx`, progress cards.

### POLISH

**P1. Contrast and size.** Labels/empty text use `neutral-400` (≈2.5:1 on the page background) at 11px. Fix: `neutral-500`, 12px (`text-xs`). *Files:* global class swap.
**P2. Nav.** Text-only tabs with colour as the only active cue. Fix: active top-bar indicator, `aria-current`, dot on Workout while a session is running. *Files:* `Navigation.tsx`.
**P3. Raw ISO dates** ("2026-09-26") in History. Fix: formatted dates. *Files:* `HistoryList.tsx`, `HistoryDetail.tsx`.
**P4. Session overview state as a 12px dot** (colour only). Fix: text status ("2/4", "✓"). *Files:* `ActiveSession.tsx`.
**P5. Today lacks context.** No date. Fix: "Saturday, Sep 26" subtitle. *Files:* `TodayPage.tsx`.
**P6. Box overload.** Card-in-card everywhere. Fix (partly under I1): flatter sections on Today; remaining screens keep cards where they group data.

## Found while implementing (not visible from reading code alone)

- **"Regenerate" on the plan screen did nothing.** The planner is deterministic, so the same settings always give the same plan. Replaced by a link to the settings that actually change the plan (Me → days / session length).
- **Weight/Reps steppers overflowed their cards at 390px** (the "+" buttons spilled outside the box). Caught by looking at screenshots, not by assertions. Now full-width rows.
- **Recovery scales took two 5×2 grids** and pushed Nutrition and Weight below the fold; now a single row of ten.
- **Save button did nothing after a failed save** if the field had already lost focus (it only called `blur()`). Now commits directly.
- **`<summary>` toggles lost their disclosure marker** once styled as flex rows; a chevron was added so they read as expandable.

## Explicitly not changing (and why)

- Four-tab structure — it matches the product spec and is already minimal; the problems were inside the tabs.
- Desktop/tablet layout stays a centred phone-width column. It is consistent and usable; a wide layout would be new design work for a phone-first tool.
- Cardio logging still uses weight/reps fields (a treadmill run is "0 kg × N"). Proper cardio input (duration/distance) is a feature, not a simplification. Logged as a remaining issue.

## Priority order used for implementation

Critical (C1–C7) → Important (I1–I12) → Polish (P1–P6).

## Addendum — Training Calendar

**Audit finding.** There was nowhere to see the training pattern: past workouts lived in a flat History list inside the Workout tab, the plan lived in a separate "Planned" list, and nothing showed both by day. "What did I train / what's coming / did I miss anything?" required three screens.

**Decision: navigation is now Today | Calendar | Progress | Me.** Workout is no longer a tab; it is a screen reached from where you decide to train:
- Today → Start Workout / Continue Workout (unchanged; Today stays lit while a workout is open, with the in-progress dot).
- Calendar → pick a day → Start Workout, or "My workouts" (the chooser: planned list, hand-made workouts, New Workout) or "Plan week".
- Back from those screens returns to whichever page opened them.
The separate History list/detail screens were removed: the calendar's day detail replaces them (completed workouts by date, with exercises and sets).

**Data.** The calendar has no storage of its own. It reads completed `workoutSessions` and the planner's `workoutPlans` (those with a `scheduledDate`):
- **Completed** — a completed session, shown on the date it was actually done.
- **Planned** — a generated plan dated today or later that no completed session has used.
- **Missed** — a generated plan dated before today that no completed session ever used.
- A plan finished on a different day than planned shows as completed on that day and disappears from its planned day (not "missed").
- **Rest day** — a date with nothing, inside a week that has a plan. Otherwise "No workout planned for this day."
- Starting a workout does not mark it done; only completing it does. Re-planning a week never touches completed sessions or the plans they used.

**Known limits.** Re-planning a week deletes that week's *unstarted* plans (existing planner behaviour), so a "missed" mark can disappear after re-planning. That can only remove a missed mark, never invent one. Because of this the monthly summary shows only "N completed · N planned ahead" — no completion percentage, which would be unreliable. No weekly view was added: the month grid already shows the week rows.

## Addendum — Reset today's workout

**Data model finding.** Completing a workout does not create a separate history record; it flips the same `WorkoutSession` row to `completed`, and sets belong to that session. The plan is a separate row that sessions never modify.

**Behaviour.** "Reset today's workout" (`resetWorkout(sessionId)`) deletes that one session and its sets in a single transaction, so a failure changes nothing. The plan is untouched, so the workout is planned again and starting it makes one new session (no duplicate history). It never touches other sessions, body/nutrition/recovery logs, the profile, exercises or the planner.

**Where it lives.** Behind a quiet "⋯" menu, always followed by a confirmation dialog (Cancel is the default; the destructive button is red): on the open workout screen (top right, away from the Finish button), on Today's completed card, and on the Calendar detail for *today's* completed workout only. Earlier days never offer it. The action itself takes a session id, so it is not hard-coded to "today"; only the UI is gated.

**Related fix.** `WorkoutPage` remembers the session it is showing; deleting that session from elsewhere could leave a stale screen (and a first version caused a render loop, caught in the browser run). It now remembers deleted ids and ignores them.

## Implementation status

All Critical (C1–C7), Important (I1–I12) and Polish (P1–P6) items above were implemented; see the Phase 7 report for before/after flows, files changed, and test results.
Not done, by design: the items under "Explicitly not changing".
