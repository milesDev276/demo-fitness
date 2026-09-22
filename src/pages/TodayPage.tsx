import { BodyCard } from '../features/body/BodyCard'
import { NutritionCard } from '../features/nutrition/NutritionCard'
import { RecoveryCard } from '../features/recovery/RecoveryCard'

export function TodayPage() {
  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Today</h1>

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Workout</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Go to the Workout tab to start today's session.
        </p>
      </section>

      <BodyCard />
      <NutritionCard />
      <RecoveryCard />
    </div>
  )
}
