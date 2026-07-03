'use client'
import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

/**
 * Shown on the MTD page when the current date is within the first 21 days of a
 * new MTD quarter (Apr 6 / Jul 6 / Oct 6 / Jan 6). Prompts the landlord to
 * verify last quarter's numbers before submitting to HMRC.
 * Dismissed choices are stored per-quarter in localStorage.
 */
export function QuarterCheckBanner({
  quarterId,
  daysSinceQuarterStart,
  prevQuarterLabel,
}: {
  quarterId: string
  daysSinceQuarterStart: number
  prevQuarterLabel: string
}) {
  const [dismissed, setDismissed] = useState(true) // hide until we've checked

  useEffect(() => {
    const key = `mtd-quarter-check-${quarterId}`
    const stored = window.localStorage.getItem(key)
    setDismissed(stored === '1')
  }, [quarterId])

  // Show only in the first 21 days of a new quarter, and only if not dismissed
  if (dismissed) return null
  if (daysSinceQuarterStart < 0 || daysSinceQuarterStart > 21) return null

  function dismiss() {
    window.localStorage.setItem(`mtd-quarter-check-${quarterId}`, '1')
    setDismissed(true)
  }

  return (
    <div className="rounded-xl border border-warning-500/40 bg-warning-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900">
            Have you reviewed your {prevQuarterLabel} income?
          </p>
          <p className="mt-1 text-xs text-ink-700">
            A new MTD quarter has just started. Before submitting last quarter's return to HMRC,
            open {prevQuarterLabel} and check every income row and expense row is accurate. Recurring
            monthly expenses (mortgage, letting-agent, insurance) should have appeared automatically —
            confirm they're all there.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-ink-500 hover:bg-warning-100"
          title="Dismiss for this quarter"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
