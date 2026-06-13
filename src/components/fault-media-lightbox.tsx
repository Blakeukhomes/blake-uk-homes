'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'

export type MediaItem = {
  kind: 'photo' | 'video'
  name: string
  url: string
  size?: number | null
}

/**
 * Photo grid + inline video player with click-to-zoom lightbox.
 * The server passes signed Supabase URLs in `items`.
 */
export function FaultMediaLightbox({ items }: { items: MediaItem[] }) {
  const photos = items.filter((i) => i.kind === 'photo')
  const videos = items.filter((i) => i.kind === 'video')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex === null) return
      if (e.key === 'Escape') setOpenIndex(null)
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length))
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, photos.length])

  if (items.length === 0) {
    return (
      <p className="rounded-lg bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
        No photos or videos were submitted with this fault.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-ink-500">{photos.length} photo{photos.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setOpenIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-lg bg-ink-100 ring-1 ring-ink-200 transition hover:ring-accent-500"
                title={p.name}
              >
                <img src={p.url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
              </button>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-ink-500">{videos.length} video{videos.length === 1 ? '' : 's'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((v) => (
              <div key={v.name} className="overflow-hidden rounded-lg bg-ink-900 ring-1 ring-ink-200">
                <video src={v.url} controls preload="metadata" className="aspect-video w-full bg-black" />
                <div className="flex items-center justify-between gap-2 bg-ink-50 px-3 py-1.5 text-xs">
                  <span className="truncate text-ink-700">{v.name}</span>
                  <a
                    href={v.url}
                    download={v.name}
                    className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700"
                    title="Download video"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {openIndex !== null && photos[openIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpenIndex(null) }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setOpenIndex((openIndex - 1 + photos.length) % photos.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                title="Previous (←)"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setOpenIndex((openIndex + 1) % photos.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                title="Next (→)"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <figure className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[openIndex].url}
              alt={photos[openIndex].name}
              className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
            />
            <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-white">
              <span className="truncate opacity-80">{photos[openIndex].name} ({openIndex + 1} / {photos.length})</span>
              <a
                href={photos[openIndex].url}
                download={photos[openIndex].name}
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                <Download className="h-3 w-3" /> Download
              </a>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  )
}
