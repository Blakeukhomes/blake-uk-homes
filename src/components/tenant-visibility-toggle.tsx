'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * Inline toggle that flips visible_to_tenant on a document.
 * Optimistic UI — clicks feel instant; if the API rejects we roll back.
 */
export function TenantVisibilityToggle({
  documentId,
  initial,
}: {
  documentId: string
  initial: boolean
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !visible
    setError(null)
    setVisible(next)
    startTransition(async () => {
      try {
        const r = await fetch(`/api/documents/${documentId}/visibility`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ visible_to_tenant: next }),
        })
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new Error(data?.error ?? 'Update failed')
        }
        router.refresh()
      } catch (e: any) {
        setVisible(!next) // roll back
        setError(e?.message ?? 'Update failed')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={visible ? 'Click to hide from tenant' : 'Click to share with tenant'}
      className={
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-colors disabled:opacity-60 ' +
        (visible
          ? 'bg-info-50 text-info-700 ring-info-500/30 hover:bg-info-100'
          : 'bg-ink-50 text-ink-600 ring-ink-200 hover:bg-ink-100')
      }
    >
      {pending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {visible ? 'Shared with tenant' : 'Private'}
      {error && <span className="ml-1 text-danger-700">!</span>}
    </button>
  )
}
