'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { DeleteRowButton } from './delete-row-button'

export function CopyPortalLinkRow({
  tenantId,
  fullName,
  email,
  propertyId,
  propertyName,
  portalToken,
}: {
  tenantId: string
  fullName: string
  email: string | null
  propertyId: string | undefined
  propertyName: string | undefined
  portalToken: string
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copyLink() {
    setError(null)
    const url = `${window.location.origin}/portal/${portalToken}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (e: any) {
      // Fallback for older browsers / non-secure contexts
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        setError('Could not copy. Long-press the chip and copy manually.')
      }
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={copyLink}
        className="group flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-accent-50/50 focus:outline-none focus-visible:bg-accent-50"
      >
        <div className="min-w-0">
          <p className="font-medium text-ink-900">{fullName}</p>
          <p className="text-xs text-ink-500">
            {propertyId && propertyName ? (
              <Link
                onClick={(e) => e.stopPropagation()}
                className="underline hover:text-accent-700"
                href={`/properties/${propertyId}`}
              >
                {propertyName}
              </Link>
            ) : (
              <span className="text-ink-400">No property linked</span>
            )}
            {' · '}{email ?? '-'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {copied ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-1 text-xs font-semibold text-success-700">
              <Check className="h-3.5 w-3.5" /> Copied!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-700 group-hover:bg-accent-100 group-hover:text-accent-700">
              <Copy className="h-3.5 w-3.5" />
              /portal/{portalToken.slice(0, 12)}…
            </span>
          )}
          <Link
            href={`/portal/${portalToken}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            title="Open tenant portal in a new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <span onClick={(e) => e.stopPropagation()}>
            <DeleteRowButton entity="tenants" id={tenantId} label={fullName} hint="The portal link will stop working and the tenancy record will be removed." />
          </span>
        </div>
      </button>
      {error && <p className="px-6 pb-2 text-xs text-danger-700">{error}</p>}
    </li>
  )
}
