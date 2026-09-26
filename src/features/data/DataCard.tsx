import { useRef, useState } from 'react'
import { useToastStore } from '../../store/useToastStore'
import { downloadJson, exportAllData, importAllData, validateImportPayload } from './exportImport'

export function DataCard() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    try {
      const payload = await exportAllData()
      downloadJson(payload, `fitflow-export-${payload.exportedAt.slice(0, 10)}.json`)
    } catch {
      useToastStore.getState().show("We couldn't export your data. Please try again.")
    }
  }

  async function handleFileSelected(file: File | undefined) {
    if (!file) return
    try {
      const text = await file.text()
      const raw = JSON.parse(text)
      const result = validateImportPayload(raw)
      if (!result.valid) {
        useToastStore.getState().show(result.error)
        return
      }

      const confirmed = confirm(
        'Import data?\n\nThis will replace your existing workouts, body logs, nutrition logs, and settings with the contents of this file. Body photos are not affected.',
      )
      if (!confirmed) return

      setBusy(true)
      await importAllData(result.payload)
      useToastStore.getState().show('Data imported. Reloading…')
      window.location.reload()
    } catch {
      useToastStore.getState().show("We couldn't read that file. Please make sure it's a FitFlow export.")
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Data</h2>
      <p className="mt-1 text-xs text-neutral-400">
        Export includes your profile, workouts, and logs as JSON. Body photos are not included.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
        >
          Export Data
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300"
        >
          {busy ? 'Importing…' : 'Import Data'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
      </div>
    </section>
  )
}
