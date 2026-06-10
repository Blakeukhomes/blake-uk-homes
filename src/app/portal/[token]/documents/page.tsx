import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText, Shield, Flame, Leaf, Zap, BookOpen, Key, Droplet } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<string, { label: string; Icon: any; color: string }> = {
  tenancy_agreement:    { label: 'Tenancy Agreement',    Icon: FileText, color: 'text-accent-500' },
  deposit_certificate:  { label: 'Deposit Certificate',  Icon: Key,      color: 'text-accent-500' },
  how_to_rent:          { label: 'How to Rent Guide',    Icon: BookOpen, color: 'text-accent-500' },
  gas_safety:           { label: 'Gas Safety',           Icon: Flame,    color: 'text-danger-500' },
  epc:                  { label: 'EPC Certificate',      Icon: Leaf,     color: 'text-success-500' },
  eicr:                 { label: 'EICR',                 Icon: Zap,      color: 'text-warning-500' },
  legionella:           { label: 'Legionella',           Icon: Droplet,  color: 'text-accent-500' },
  ico_registration:     { label: 'ICO Registration',     Icon: Shield,   color: 'text-accent-500' },
  buildings_insurance:  { label: 'Buildings Insurance',  Icon: Shield,   color: 'text-accent-500' },
  inventory_move_in:    { label: 'Move-in Inventory',    Icon: FileText, color: 'text-accent-500' },
  inventory_move_out:   { label: 'Move-out Inventory',   Icon: FileText, color: 'text-accent-500' },
  invoice:              { label: 'Invoice',              Icon: FileText, color: 'text-ink-400' },
  other:                { label: 'Other',                Icon: FileText, color: 'text-ink-400' },
}

export default async function TenantDocsPage({ params }: { params: { token: string } }) {
  const sb = createServiceClient()
  const { data: tenant } = await sb.from('tenants')
    .select('id, full_name, property_id, properties(nickname, address_line_1, city)')
    .eq('portal_token', params.token).maybeSingle()
  if (!tenant) notFound()

  const { data: docs = [] } = await sb.from('documents')
    .select('id, kind, title, created_at')
    .eq('property_id', (tenant as any).property_id)
    .eq('visible_to_tenant', true)
    .order('created_at', { ascending: false })

  const t = tenant as any

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-ink-900 text-white">
        <div className="mx-auto max-w-2xl px-6 pt-6 pb-4">
          <Link href={`/portal/${params.token}`} className="inline-flex items-center gap-1 text-xs font-bold text-accent-400">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <p className="mt-3 text-lg font-bold">My documents</p>
          <p className="text-xs text-ink-400">{t.properties?.address_line_1}, {t.properties?.city}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">Your tenancy documents</p>
        {(docs ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-ink-500 ring-1 ring-ink-100">
            No documents shared with you yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {(docs as any[]).map((d) => {
              const meta = KIND_LABEL[d.kind] ?? KIND_LABEL.other
              const Icon = meta.Icon
              const href = `/api/portal/${params.token}/documents/${d.id}`
              return (
                <li key={d.id} className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-ink-100">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${meta.color}`} />
                    <div>
                      <p className="text-sm font-bold text-ink-900">{d.title}</p>
                      <p className="text-[11px] text-ink-400">
                        Added {new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-accent-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-accent-600"
                  >
                    View
                  </a>
                </li>
              )
            })}
            <li className="mt-4 rounded-xl border border-success-500/30 bg-success-50 p-3 text-center text-xs text-success-700">
              All required documents are in order
            </li>
          </ul>
        )}
      </main>
    </div>
  )
}
