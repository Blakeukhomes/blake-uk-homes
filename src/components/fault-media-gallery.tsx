// Server component: lists Supabase Storage objects under fault-media/{fault_id}/
// and produces signed URLs the lightbox client can render.
import { createServiceClient } from '@/lib/supabase/server'
import { FaultMediaLightbox, type MediaItem } from './fault-media-lightbox'

const BUCKET = 'fault-media'
const URL_TTL_SECONDS = 60 * 60 // 1 hour

type StorageObject = { name: string; metadata?: { size?: number } | null }
type SignedRow = { signedUrl: string; error: string | null; path: string }

async function listKind(sb: ReturnType<typeof createServiceClient>, faultId: string, kind: 'photo' | 'video'): Promise<MediaItem[]> {
  const folder = `${faultId}/${kind}`
  const { data, error } = await sb.storage.from(BUCKET).list(folder, { limit: 200, sortBy: { column: 'name', order: 'asc' } })
  if (error || !data) return []
  const objs = data as StorageObject[]
  const paths = objs.filter((o) => o.name && !o.name.endsWith('/')).map((o) => `${folder}/${o.name}`)
  if (paths.length === 0) return []
  const { data: signed } = await sb.storage.from(BUCKET).createSignedUrls(paths, URL_TTL_SECONDS)
  if (!signed) return []
  return (signed as SignedRow[])
    .filter((s) => !!s.signedUrl && !s.error)
    .map((s, i) => {
      const orig = objs[i]
      const displayName = (orig?.name ?? '').replace(/^[0-9a-f-]{36}-/, '')
      return {
        kind,
        name: displayName || `${kind}-${i + 1}`,
        url: s.signedUrl,
        size: orig?.metadata?.size ?? null,
      } satisfies MediaItem
    })
}

export async function FaultMediaGallery({ faultId }: { faultId: string }) {
  const sb = createServiceClient()
  const [photos, videos] = await Promise.all([
    listKind(sb, faultId, 'photo'),
    listKind(sb, faultId, 'video'),
  ])
  const items = [...photos, ...videos]
  return <FaultMediaLightbox items={items} />
}
