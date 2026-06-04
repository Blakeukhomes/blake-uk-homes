'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, Home, Search } from 'lucide-react'
import { Button } from './ui/button'

interface PropertyOption {
  id: string
  nickname: string
}

export function UploadDocumentLauncher({ properties }: { properties: PropertyOption[] }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const filtered = q.trim()
    ? properties.filter((p) => p.nickname.toLowerCase().includes(q.toLowerCase()))
    : properties

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />Upload document
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/50 p-4 pt-20"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-ink-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">Which property is this for?</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Documents are attached to a property so they can be linked to compliance, rent, MTD, and tenants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-2 rounded p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {properties.length > 6 && (
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter by property name..."
                  className="block w-full rounded-lg border-0 bg-white pl-9 pr-3 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-accent-500"
                />
              </div>
            )}

            <ul className="mt-4 max-h-80 space-y-1 overflow-auto">
              {filtered.length === 0 && properties.length === 0 ? (
                <li className="rounded-lg bg-warning-50 px-3 py-3 text-sm text-warning-700">
                  You need to add a property first.{' '}
                  <Link href="/properties/new" className="font-semibold underline">Add a property</Link>
                </li>
              ) : filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-500">No properties match "{q}".</li>
              ) : (
                filtered.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/properties/${p.id}/documents`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-accent-50 hover:text-accent-900"
                    >
                      <Home className="h-4 w-4 text-ink-400" />
                      <span>{p.nickname}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
