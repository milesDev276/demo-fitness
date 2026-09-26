import { useLiveQuery } from 'dexie-react-hooks'
import { CardioProgressCard } from '../features/progress/CardioProgressCard'
import { ConsistencyCard } from '../features/progress/ConsistencyCard'
import { MeasurementTrendCard } from '../features/progress/MeasurementTrendCard'
import { NutritionProgressCard } from '../features/progress/NutritionProgressCard'
import { StrengthProgressCard } from '../features/progress/StrengthProgressCard'
import { WeeklySummaryCard } from '../features/progress/WeeklySummaryCard'
import { listWaistPoints, listWeightPoints } from '../features/progress/repository'
import { PhotosSection } from '../features/photos/PhotosSection'
import { useUiStore } from '../store/useUiStore'
import { addDays, todayLocalDate } from '../utils/date'

const WEIGHT_RANGES = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
]

const WAIST_RANGES = [
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
]

/** Ordered by the question this page answers — "Am I improving?": this week, body, strength, consistency, food, photos. */
export function ProgressPage() {
  const setActivePage = useUiStore((s) => s.setActivePage)
  // Waist is optional on Today, so only show its chart once there is something to chart.
  const hasWaist = useLiveQuery(
    () => listWaistPoints(addDays(todayLocalDate(), -365)).then((points) => points.some((p) => p.value !== undefined)),
    [],
  )

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Progress</h1>

      <WeeklySummaryCard />

      <MeasurementTrendCard
        title="Weight"
        unit="kg"
        rangeOptions={WEIGHT_RANGES}
        defaultRange="30"
        fetchPoints={listWeightPoints}
        emptyMessage="No weight logged in this period."
        emptyAction={{ label: 'Log weight', onClick: () => setActivePage('today') }}
      />

      <StrengthProgressCard />
      <ConsistencyCard />
      <NutritionProgressCard />

      {hasWaist && (
        <MeasurementTrendCard
          title="Waist"
          unit="cm"
          rangeOptions={WAIST_RANGES}
          defaultRange="30"
          fetchPoints={listWaistPoints}
          emptyMessage="No waist measurement in this period."
        />
      )}

      <PhotosSection />
      <CardioProgressCard />
    </div>
  )
}
