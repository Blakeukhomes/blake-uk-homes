'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, X } from 'lucide-react'

/**
 * Inline delete button + confirmation modal for any row across the app
 * (properties, tenants, contacts, documents, etc).
 * Hits DELETE /api/{entity}/{id} and refreshes on success.
 */
export function DeleteRowButton({
  entity,
  id,
  label,
  hint,
  variant = 'icon',
}: {
  entity: 'properties' | 'tenants' | 'contacts' | 'documents'
  id: string
  label: string
  hint?: string
  variant?: 'icon' | 'compact' | 'full'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doDelete() {
    setBusy(true); setError(null)
    try {
      const r = await fetch(`/api/${entity}/${id}`, { method: 'DELETE' })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || 'Delete failed')
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className={
          variant === 'icon'
            ? 'rounded-md p-1.5 text-ink-400 hover:bg-danger-50 hover:text-danger-600'
            : variant === 'compact'
            ? 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-500 hover:bg-danger-50 hover:text-danger-600'
            : 'inline-flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-700 hover:bg-danger-100'
        }
        aria-label={`Delete ${label}`}
        title={`Delete ${label}`}
      >
        <Trash2 className="h-4 w-4" />
        {variant !== 'icon' && <span>Delete</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-ink-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Delete {label}?</h2>
                <p className="mt-1 text-sm text-ink-500">
                  This cannot be undone. {hint}
                </p>
              </div>
              <button type="button" onClick={() => !busy && setOpen(false)} className="ml-2 rounded p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-xs text-danger-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={doDelete} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-2 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {busy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
