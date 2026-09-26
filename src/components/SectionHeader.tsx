export function SectionHeader({ title, status }: { title: string; status?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      {status && <p className="text-sm text-neutral-500">{status}</p>}
    </div>
  )
}
