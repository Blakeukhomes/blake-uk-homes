import { Sparkles } from 'lucide-react'

export function DemoBanner() {
  return (
    <div className="border-b border-warning-500/30 bg-warning-50 text-warning-700">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-2 text-xs font-medium">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Demo mode, sample portfolio data. Add real Supabase credentials in
          <code className="rounded bg-white px-1 py-0.5 font-mono">.env.local</code>
          to switch to your live data.
        </span>
        <a href="/SETUP.md" className="hidden sm:inline underline decoration-warning-500/30 hover:decoration-warning-500">
          Setup guide
        </a>
      </div>
    </div>
  )
}
