import { db } from '../../db/db'
import type { PhotoCategory } from '../../db/types'

/** Keeps stored photos reasonably small — avoids duplicating multi-megabyte camera originals in IndexedDB. */
const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.85

async function downscaleImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    return blob ?? file
  } finally {
    bitmap.close()
  }
}

export async function addPhoto(date: string, category: PhotoCategory, file: Blob): Promise<number> {
  const stored = await downscaleImage(file)
  const id = await db.bodyPhotos.add({ date, category, blob: stored, createdAt: new Date().toISOString() })
  return id as number
}

export function listPhotos() {
  return db.bodyPhotos.orderBy('date').reverse().toArray()
}

export function getPhoto(id: number) {
  return db.bodyPhotos.get(id)
}

export async function deletePhoto(id: number) {
  await db.bodyPhotos.delete(id)
}
