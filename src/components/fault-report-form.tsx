'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Video, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'

const CATEGORIES = [
  'Plumbing', 'Electrical', 'Heating / Boiler', 'Damp / Mould', 'Locks / Security',
  'Appliances', 'Windows / Doors', 'Pest', 'External / Garden', 'Other',
]

export function FaultReportForm({
  token, tenantId, defaults,
}: {
  token: string
  tenantId: string
  defaults: { name: string; phone: string; email: string }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [videos, setVideos] = useState<FileList | null>(null)
  const [done, setDone] = useState<{ reference: string; reported_at: string } | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!photos || photos.length === 0) {
      setError('Please attach at least one photo before submitting.')
      return
    }
    if (!videos || videos.length === 0) {
      setError('Please attach at least one short video before submitting.')
      return
    }

    setBusy(true)

    const fd = new FormData(e.currentTarget)
    fd.append('token', token)
    fd.append('tenant_id', tenantId)
    Array.from(photos).forEach((f) => fd.append('photo', f))
    Array.from(videos).forEach((f) => fd.append('video', f))

    const res = await fetch('/api/portal/fault', { method: 'POST', body: fd })
    setBusy(false)
    if (!res.ok) { setError(await res.text()); return }
    const data = await res.json()
    setDone(data)
  }

  if (done) {
    return (
      <div className="rounded-xl bg-success-100 p-6 text-success-700">
        <CheckCircle2 className="h-8 w-8" />
        <h3 className="mt-3 text-lg font-semibold">Thanks, your report is logged.</h3>
        <p className="mt-2 text-sm">
          Reference <code className="rounded bg-white px-2 py-0.5 font-mono">{done.reference}</code>
        </p>
        <p className="text-sm">Reported at {new Date(done.reported_at).toLocaleString('en-GB')}</p>
        <p className="mt-4 text-sm">
          Your landlord has been notified. You'll see contractor details here as soon as a visit is scheduled.
        </p>
        <Button className="mt-4" onClick={() => router.push(`/portal/${token}`)}>Back to portal</Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="severity">Severity</Label>
          <Select id="severity" name="severity" required defaultValue="standard">
            <option value="emergency">Emergency, danger to people or property</option>
            <option value="urgent">Urgent, must be fixed within days</option>
            <option value="standard">Standard</option>
            <option value="minor">Minor</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Describe the problem</Label>
        <Textarea id="description" name="description" rows={4} required placeholder="Where in the property, when it started, what you've already tried…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Photos (at least 1)</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-sm text-ink-600 hover:bg-ink-100">
            <Camera className="h-4 w-4" />
            <span>{photos?.length ? `${photos.length} photo(s) attached` : 'Attach photos'}</span>
            <input type="file" accept="image/*" multiple required hidden onChange={(e) => setPhotos(e.target.files)} />
          </label>
        </div>
        <div>
          <Label>Short video (at least 1)</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-sm text-ink-600 hover:bg-ink-100">
            <Video className="h-4 w-4" />
            <span>{videos?.length ? `${videos.length} video(s) attached` : 'Attach video'}</span>
            <input type="file" accept="video/*" multiple required hidden onChange={(e) => setVideos(e.target.files)} />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="reporter_name">Your name</Label>
          <Input id="reporter_name" name="reporter_name" required defaultValue={defaults.name} />
        </div>
        <div>
          <Label htmlFor="reporter_phone">Phone</Label>
          <Input id="reporter_phone" name="reporter_phone" type="tel" defaultValue={defaults.phone} />
        </div>
        <div>
          <Label htmlFor="reporter_email">Email</Label>
          <Input id="reporter_email" name="reporter_email" type="email" defaultValue={defaults.email} />
        </div>
      </div>

      {error && <p className="rounded bg-danger-100 px-3 py-2 text-sm text-danger-700">{error}</p>}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit fault report'}
      </Button>
    </form>
  )
}
