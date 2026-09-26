import { DailyChecklist } from '../components/DailyChecklist'
import { BodyCard } from '../features/body/BodyCard'
import { NutritionCard } from '../features/nutrition/NutritionCard'
import { RecoveryCard } from '../features/recovery/RecoveryCard'
import { TodayWorkoutCard } from '../features/workout/TodayWorkoutCard'

export function TodayPage() {
  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Today</h1>

      <DailyChecklist />

      <TodayWorkoutCard />
      <BodyCard />
      <NutritionCard />
      <RecoveryCard />
    </div>
  )
}
