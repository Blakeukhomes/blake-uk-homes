'use client'
import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function PropertyPhotoUploader() {
  const supabase = createClient()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File) {
    setError(null); setBusy(true)
    try {
      // Local preview
      setPreviewUrl(URL.createObjectURL(file))

      // Upload to Supabase Storage (avatars bucket is public)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const path = `properties/${user.id}/${crypto.randomUUID()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
        contentType: file.type, upsert: false,
      })
      if (upErr && !String(upErr.message).includes('Demo')) throw upErr
      const pub = supabase.storage.from('avatars').getPublicUrl(path)
      setStoragePath(pub.data.publicUrl)
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <input type="hidden" name="hero_image_url" value={storagePath} />
      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 p-6 text-center transition-colors hover:border-accent-500 hover:bg-accent-50/30">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        />
        {previewUrl ? (
          <div className="relative inline-block">
            <img src={previewUrl} alt="Preview" className="mx-auto h-32 w-32 rounded-lg object-cover" />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setPreviewUrl(null); setStoragePath('') }}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 ring-1 ring-ink-200 hover:bg-danger-50"
            >
              <X className="h-3.5 w-3.5 text-ink-700" />
            </button>
          </div>
        ) : (
          <>
            <ImagePlus className="mx-auto h-7 w-7 text-ink-400" />
            <p className="mt-2 text-sm font-semibold text-ink-700">Click to upload a photo</p>
            <p className="text-xs text-ink-500">JPG, PNG or WebP, up to 10MB</p>
          </>
        )}
      </label>
      {busy && <p className="mt-2 text-xs text-ink-500">Uploading...</p>}
      {error && <p className="mt-2 text-xs text-danger-700">{error}</p>}
    </div>
  )
}
