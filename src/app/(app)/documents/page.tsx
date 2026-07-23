import Link from 'next/link'
import { FileText, Sparkles, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TicketTabs } from '@/components/ticket-tabs'
import { PropertyFilterSelect } from '@/components/property-filter-select'
import { UploadDocumentLauncher } from '@/components/upload-document-launcher'
import { DeleteDocumentButton } from '@/components/delete-document-button'
import { TenantVisibilityToggle } from '@/components/tenant-visibility-toggle'
import type { DocumentRow, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

const TABS: { value: string; label: string }[] = [
  { value: 'all',           label: 'All' },
  { value: 'leases',        label: 'Leases' },
  { value: 'invoices',      label: 'Invoices' },
  { value: 'receipts',      label: 'Receipts' },
  { value: 'certificates',  label: 'Certificates' },
  { value: 'ids',           label: 'IDs' },
  { value: 'contracts',     label: 'Contracts' },
  { value: 'e_signatures',  label: 'E-Signatures' },
  { value: 'other',         label: 'Other' },
]

const TAB_KINDS: Record<string, string[]> = {
  all:          [],
  leases:       ['tenancy_agreement'],
  invoices:     ['invoice'],
  receipts:     ['invoice'],
  certificates: ['gas_safety', 'eicr', 'epc', 'buildings_insurance', 'legionella', 'ico_registration'],
  ids:          [],
  contracts:    ['tenancy_agreement'],
  e_signatures: [],
  other:        ['deposit_certificate', 'how_to_rent', 'inventory_move_in', 'inventory_move_out', 'other'],
}

function badgeTone(kind: string): 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'accent' {
  if (['gas_safety', 'eicr', 'epc', 'buildings_insurance', 'legionella', 'ico_registration'].includes(kind)) return 'danger'
  if (kind === 'tenancy_agreement') return 'info'
  if (kind === 'invoice') return 'accent'
  return 'neutral'
}

function categoryLabel(kind: string): string {
  const map: Record<string, string> = {
    gas_safety: 'Certificate', eicr: 'Certificate', epc: 'Certificate',
    buildings_insurance: 'Certificate', legionella: 'Certificate', ico_registration: 'Certificate',
    tenancy_agreement: 'Lease',
    invoice: 'Invoice',
    deposit_certificate: 'Other',
    how_to_rent: 'Other',
    inventory_move_in: 'Other', inventory_move_out: 'Other',
    other: 'Other',
  }
  return (map[kind] || 'Other').toUpperCase()
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; property?: string }
}) {
  const supabase = createClient()
  const { data: docs = [] } = await supabase
    .from('documents').select('*').order('created_at', { ascending: false })
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname')

  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]
  const tab = searchParams.status ?? 'all'
  const propertyFilter = searchParams.property ?? 'all'
  const query = (searchParams.q ?? '').toLowerCase()

  let rows = (docs ?? []) as DocumentRow[]
  if (tab !== 'all') {
    const kinds = TAB_KINDS[tab] ?? []
    rows = rows.filter((d) => kinds.includes(d.kind))
  }
  if (propertyFilter !== 'all') rows = rows.filter((d) => d.property_id === propertyFilter)
  if (query) rows = rows.filter((d) =>
    d.title.toLowerCase().includes(query) ||
    (d.ai_summary ?? '').toLowerCase().includes(query)
  )

  return (
    <>
      <PageHeader
        title="Global documents"
        subtitle="Search and manage all documents across your portfolio."
        actions={<UploadDocumentLauncher properties={props} />}
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardBody>
            <TicketTabs tabs={TABS} selected={tab} q={query} />
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs font-medium uppercase tracking-wider text-ink-500">Property</label>
              <PropertyFilterSelect properties={props} selected={propertyFilter} />
            </div>
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-3 text-sm text-ink-600">No documents match.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((d) => {
              const prop = props.find((p) => p.id === d.property_id)
              return (
                <div key={d.id} className="rounded-xl2 bg-white p-4 shadow-card ring-1 ring-ink-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge tone={badgeTone(d.kind)}>{categoryLabel(d.kind)}</Badge>
                      <Link
                        href={`/api/documents/${d.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1 text-ink-400 hover:bg-accent-50 hover:text-accent-700"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <DeleteDocumentButton documentId={d.id} title={d.title} />
                    </div>
                  </div>
                  <p className="mt-3 truncate text-sm font-bold text-ink-900">{d.title}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {d.file_size ? ` · ${(d.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </p>
                  {prop && <p className="mt-1 truncate text-xs text-ink-400">{prop.nickname}</p>}
                  <div className="mt-2">
                    <TenantVisibilityToggle documentId={d.id} initial={!!(d as any).visible_to_tenant} />
                  </div>
                  {d.ai_summary && (
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-accent-50 px-2 py-1.5 text-[11px] text-accent-700">
                      <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{d.ai_summary}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-ink-400">Showing {rows.length} of {(docs ?? []).length}</p>
      </div>
    </>
  )
}
