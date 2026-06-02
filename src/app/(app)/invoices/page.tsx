import Link from 'next/link'
import { Plus, Receipt, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TicketTabs } from '@/components/ticket-tabs'
import { formatGBP } from '@/lib/rent'
import type { Invoice, InvoiceStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const TABS: { value: string; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'draft',   label: 'Draft' },
  { value: 'sent',    label: 'Sent' },
  { value: 'viewed',  label: 'Viewed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid',    label: 'Paid' },
  { value: 'void',    label: 'Void' },
]

function statusTone(s: InvoiceStatus): 'neutral' | 'info' | 'warning' | 'danger' | 'success' {
  if (s === 'paid')    return 'success'
  if (s === 'partial') return 'warning'
  if (s === 'overdue') return 'danger'
  if (s === 'sent' || s === 'viewed') return 'info'
  return 'neutral'
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const supabase = createClient()
  const { data: invoices = [] } = await supabase
    .from('invoices').select('*').order('issue_date', { ascending: false })

  const statusFilter = searchParams.status ?? 'all'
  const query = (searchParams.q ?? '').toLowerCase()
  let rows = (invoices ?? []) as Invoice[]
  if (statusFilter !== 'all') rows = rows.filter((i) => i.status === statusFilter)
  if (query) rows = rows.filter((i) =>
    i.invoice_number.toLowerCase().includes(query) ||
    i.contact_name.toLowerCase().includes(query)
  )

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Create, send, and track invoices for your contacts."
        actions={<Link href="/invoices/new"><Button><Plus className="h-4 w-4" />New invoice</Button></Link>}
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardBody>
            <TicketTabs tabs={TABS} selected={statusFilter} q={query} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <div className="py-16 text-center">
                <Receipt className="mx-auto h-10 w-10 text-ink-300" />
                <p className="mt-3 text-sm font-semibold text-ink-900">No invoices found</p>
                <p className="text-sm text-ink-500">Create your first invoice to get started.</p>
                <Link href="/invoices/new" className="mt-4 inline-block"><Button>New invoice</Button></Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b hairline border-b-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-6 py-2 font-semibold">Invoice #</th>
                    <th className="px-2 py-2 font-semibold">Contact</th>
                    <th className="px-2 py-2 font-semibold">Type</th>
                    <th className="px-2 py-2 text-right font-semibold">Amount</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                    <th className="px-6 py-2 font-semibold">Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr key={i.id} className="border-b hairline border-b-ink-100 hover:bg-ink-50/50">
                      <td className="px-6 py-3"><Link href={`/invoices/${i.id}`} className="font-mono text-xs text-accent-700 hover:underline">{i.invoice_number}</Link></td>
                      <td className="px-2 py-3 text-ink-700">{i.contact_name}</td>
                      <td className="px-2 py-3 text-ink-500 capitalize">{i.type.replace('_', ' ')}</td>
                      <td className="px-2 py-3 text-right font-medium text-ink-900">{formatGBP(i.total)}</td>
                      <td className="px-2 py-3"><Badge tone={statusTone(i.status)}>{i.status}</Badge></td>
                      <td className="px-6 py-3 text-ink-500">{new Date(i.due_date).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
