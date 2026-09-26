import { useEffect, useState } from 'react'

interface PhotoThumbnailProps {
  blob: Blob
  alt: string
  className?: string
}

/** Assumes `blob` is stable for the component's lifetime — callers key by photo id so a new blob remounts. */
export function PhotoThumbnail({ blob, alt, className }: PhotoThumbnailProps) {
  const [url] = useState(() => URL.createObjectURL(blob))

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return <img src={url} alt={alt} className={className} />
}
