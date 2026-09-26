import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDb } from '../../test/dbTestUtils'
import { db } from '../../db/db'
import { addPhoto, deletePhoto, listPhotos } from './repository'

/** Node has no canvas/ImageBitmap, so stub the minimum the downscale step touches. */
function stubBrowserImageApis({ corrupt = false } = {}) {
  vi.stubGlobal(
    'createImageBitmap',
    corrupt ? () => Promise.reject(new Error('bad image')) : () => Promise.resolve({ width: 4000, height: 3000, close() {} }),
  )
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['small'], { type: 'image/jpeg' })),
  }
  vi.stubGlobal('document', { createElement: () => canvas })
  return canvas
}

beforeEach(resetDb)
afterEach(() => vi.unstubAllGlobals())

describe('photo storage', () => {
  it('stores a downscaled copy, not the original', async () => {
    const canvas = stubBrowserImageApis()
    const original = new Blob([new Uint8Array(1000)], { type: 'image/png' })

    const id = await addPhoto('2026-09-01', 'front', original)

    expect(Math.max(canvas.width, canvas.height)).toBe(1280) // 4000×3000 → 1280×960
    const stored = await db.bodyPhotos.get(id)
    expect(stored?.category).toBe('front')
    expect(stored?.blob.type).toBe('image/jpeg')
    expect(stored?.blob.size).toBe(5)
  })

  it('lists newest photos first so they can be compared by date', async () => {
    stubBrowserImageApis()
    await addPhoto('2026-09-01', 'front', new Blob(['a']))
    await addPhoto('2026-12-01', 'front', new Blob(['b']))
    await addPhoto('2026-10-15', 'side', new Blob(['c']))

    const photos = await listPhotos()
    expect(photos.map((p) => p.date)).toEqual(['2026-12-01', '2026-10-15', '2026-09-01'])
  })

  it('deletes only the chosen photo', async () => {
    stubBrowserImageApis()
    const first = await addPhoto('2026-09-01', 'front', new Blob(['a']))
    await addPhoto('2026-12-01', 'back', new Blob(['b']))

    await deletePhoto(first)

    const remaining = await listPhotos()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].category).toBe('back')
  })

  it('rejects a corrupted image without storing anything', async () => {
    stubBrowserImageApis({ corrupt: true })
    await expect(addPhoto('2026-09-01', 'front', new Blob(['not an image']))).rejects.toBeDefined()
    expect(await db.bodyPhotos.count()).toBe(0)
  })
})
