import { DailyChecklist } from '../components/DailyChecklist'
import { BodyCard } from '../features/body/BodyCard'
import { NutritionCard } from '../features/nutrition/NutritionCard'
import { RecoveryCard } from '../features/recovery/RecoveryCard'
import { TodayWorkoutCard } from '../features/workout/TodayWorkoutCard'

export function TodayPage() {
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Today</h1>
        <p className="text-sm text-neutral-500">{dateLabel}</p>
      </header>

      <TodayWorkoutCard />

      <DailyChecklist />

      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 px-4 dark:divide-neutral-800 dark:border-neutral-800">
        <RecoveryCard />
        <NutritionCard />
        <BodyCard />
      </div>
    </div>
  )
}
