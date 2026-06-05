'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2, Search } from 'lucide-react'

export interface AddressSelection {
  address_line_1: string
  address_line_2: string | null
  city: string
  postcode: string
  country: string
}

type Suggestion = {
  id: string
  address: string
  main?: string
  secondary?: string
}

export function AddressAutocomplete({
  onSelect,
  placeholder = 'Start typing an address or postcode...',
}: {
  onSelect: (addr: AddressSelection) => void
  placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setBusy(true); setError(null)
      try {
        const r = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q.trim())}`)
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || 'Lookup failed')
        setSuggestions(data.suggestions ?? [])
        setOpen(true)
      } catch (e: any) {
        setError(e?.message ?? 'Lookup failed')
        setSuggestions([])
      } finally {
        setBusy(false)
      }
    }, 300)
  }, [q])

  async function pick(s: Suggestion) {
    setOpen(false); setQ(s.address); setPicking(true); setError(null)
    try {
      const r = await fetch(`/api/places/details/${encodeURIComponent(s.id)}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || 'Could not fetch address')
      onSelect({
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Could not fetch address')
    } finally {
      setPicking(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={q}
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="block w-full rounded-lg border-0 bg-white pl-9 pr-10 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-accent-500"
        />
        {(busy || picking) && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-ink-400" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-ink-200 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-ink-700 hover:bg-accent-50 hover:text-accent-900"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                <span className="leading-tight">
                  {s.main ? (
                    <>
                      <span className="font-medium">{s.main}</span>
                      {s.secondary && <span className="text-ink-500">, {s.secondary}</span>}
                    </>
                  ) : (
                    s.address
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger-600">{error}</p>
      )}
      <p className="mt-1 text-[11px] text-ink-400">Powered by Google Places</p>
    </div>
  )
}
