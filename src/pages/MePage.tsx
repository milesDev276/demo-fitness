import { DataCard } from '../features/data/DataCard'
import { NutritionTargetsCard } from '../features/profile/NutritionTargetsCard'
import { PersonalCard } from '../features/profile/PersonalCard'
import { ProfileCard } from '../features/profile/ProfileCard'

export function MePage() {
  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Me</h1>
      <PersonalCard />
      <ProfileCard />
      <NutritionTargetsCard />
      <DataCard />
    </div>
  )
}
