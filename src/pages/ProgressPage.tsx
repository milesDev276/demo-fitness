import type { ReactNode } from 'react'
import { CardioProgressCard } from '../features/progress/CardioProgressCard'
import { ConsistencyCard } from '../features/progress/ConsistencyCard'
import { MeasurementTrendCard } from '../features/progress/MeasurementTrendCard'
import { NutritionProgressCard } from '../features/progress/NutritionProgressCard'
import { StrengthProgressCard } from '../features/progress/StrengthProgressCard'
import { WeeklySummaryCard } from '../features/progress/WeeklySummaryCard'
import { listWaistPoints, listWeightPoints } from '../features/progress/repository'

const WEIGHT_RANGES = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
]

const WAIST_RANGES = [
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
]

export function ProgressPage() {
  return (
    <div className="space-y-5 p-4 pb-24">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Progress</h1>

      <Section title="Body">
        <MeasurementTrendCard
          title="Weight"
          unit="kg"
          rangeOptions={WEIGHT_RANGES}
          defaultRange="30"
          fetchPoints={listWeightPoints}
          emptyMessage="Not enough weight data yet. Keep logging your weight to see the trend."
        />
        <MeasurementTrendCard
          title="Waist"
          unit="cm"
          rangeOptions={WAIST_RANGES}
          defaultRange="30"
          fetchPoints={listWaistPoints}
          emptyMessage="Not enough data yet."
        />
      </Section>

      <Section title="Strength">
        <StrengthProgressCard />
      </Section>

      <Section title="Cardio">
        <CardioProgressCard />
      </Section>

      <Section title="Consistency">
        <ConsistencyCard />
      </Section>

      <Section title="Nutrition">
        <NutritionProgressCard />
      </Section>

      <Section title="Weekly Summary">
        <WeeklySummaryCard />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
