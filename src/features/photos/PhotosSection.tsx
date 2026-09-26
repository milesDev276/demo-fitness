import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { BodyPhoto, PhotoCategory } from '../../db/types'
import { todayLocalDate, formatShortDate } from '../../utils/date'
import { useToastStore } from '../../store/useToastStore'
import { addPhoto, deletePhoto, listPhotos } from './repository'
import { PhotoThumbnail } from './PhotoThumbnail'

const CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
]

export function PhotosSection() {
  const photos = useLiveQuery(() => listPhotos(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [date, setDate] = useState(todayLocalDate())
  const [category, setCategory] = useState<PhotoCategory>('front')
  const [compareMode, setCompareMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [beforeId, setBeforeId] = useState<number | null>(null)
  const [afterId, setAfterId] = useState<number | null>(null)

  async function handleFileSelected(file: File | undefined) {
    if (!file) return
    try {
      await addPhoto(date, category, file)
      setShowAdd(false)
    } catch {
      useToastStore.getState().show("We couldn't save this photo. Please try again.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this photo?')) return
    try {
      await deletePhoto(id)
      if (beforeId === id) setBeforeId(null)
      if (afterId === id) setAfterId(null)
    } catch {
      useToastStore.getState().show("We couldn't delete this photo. Please try again.")
    }
  }

  const before = photos?.find((p) => p.id === beforeId)
  const after = photos?.find((p) => p.id === afterId)

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Photos</h3>
        <div className="flex items-center gap-1">
          {photos && photos.length >= 2 && (
            <button
              type="button"
              onClick={() => setCompareMode((v) => !v)}
              className="min-h-10 px-2 text-sm font-medium text-blue-700 dark:text-blue-400"
            >
              {compareMode ? 'Done' : 'Compare'}
            </button>
          )}
          {!compareMode && (
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              aria-expanded={showAdd}
              className="min-h-10 px-2 text-sm font-medium text-blue-700 dark:text-blue-400"
            >
              {showAdd ? 'Cancel' : '+ Add photo'}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-500">Stored only on this device. Never uploaded anywhere.</p>

      {showAdd && !compareMode && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="text-xs uppercase text-neutral-500">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-neutral-500">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PhotoCategory)}
              className="mt-1 block rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
          >
            Choose photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
        </div>
      )}

      {!photos ? null : photos.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          No body photos yet. Add your first photo to compare physical changes over time.
        </p>
      ) : compareMode ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ComparePicker label="Before" photos={photos} selectedId={beforeId} onSelect={setBeforeId} photo={before} />
          <ComparePicker label="After" photos={photos} selectedId={afterId} onSelect={setAfterId} photo={after} />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} onDelete={() => handleDelete(photo.id!)} />
          ))}
        </div>
      )}
    </section>
  )
}

function PhotoTile({ photo, onDelete }: { photo: BodyPhoto; onDelete: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <PhotoThumbnail blob={photo.blob} alt={`${photo.category} photo from ${photo.date}`} className="h-28 w-full object-cover" />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete photo"
        className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white"
      >
        ×
      </button>
      <p className="bg-white/90 px-1.5 py-0.5 text-xs capitalize text-neutral-600 dark:bg-neutral-900/90 dark:text-neutral-300">
        {formatShortDate(photo.date)} · {photo.category}
      </p>
    </div>
  )
}

function ComparePicker({
  label,
  photos,
  selectedId,
  onSelect,
  photo,
}: {
  label: string
  photos: BodyPhoto[]
  selectedId: number | null
  onSelect: (id: number) => void
  photo: BodyPhoto | undefined
}) {
  return (
    <div>
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
      >
        <option value="" disabled>
          Select date
        </option>
        {photos.map((p) => (
          <option key={p.id} value={p.id}>
            {formatShortDate(p.date)} · {p.category}
          </option>
        ))}
      </select>
      <div className="mt-2 aspect-3/4 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
        {photo && (
          <PhotoThumbnail key={photo.id} blob={photo.blob} alt={`${label} photo`} className="h-full w-full object-cover" />
        )}
      </div>
    </div>
  )
}
