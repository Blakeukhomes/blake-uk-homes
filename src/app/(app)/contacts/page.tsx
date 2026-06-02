import Link from 'next/link'
import { Users, Plus, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContactFilters } from '@/components/contact-filters'
import type { Contact, ContactKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

const KIND_TABS: { value: ContactKind | 'all'; label: string }[] = [
  { value: 'all',        label: 'All people' },
  { value: 'tenant',     label: 'Tenants' },
  { value: 'contractor', label: 'Contractors' },
  { value: 'supplier',   label: 'Suppliers' },
  { value: 'agent',      label: 'Agents' },
  { value: 'other',      label: 'Other' },
]

const KIND_LABEL: Record<ContactKind, string> = {
  tenant: 'Tenant',
  contractor: 'Contractor',
  supplier: 'Supplier',
  agent: 'Agent',
  other: 'Other',
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { kind?: string; q?: string; status?: string }
}) {
  const supabase = createClient()
  const { data: contacts = [] } = await supabase
    .from('contacts').select('*').order('full_name')

  const kindFilter = (searchParams.kind ?? 'all') as ContactKind | 'all'
  const statusFilter = searchParams.status ?? 'active'
  const query = (searchParams.q ?? '').toLowerCase()

  let rows = (contacts ?? []) as Contact[]
  if (kindFilter !== 'all') rows = rows.filter((c) => c.kind === kindFilter)
  if (statusFilter === 'active')   rows = rows.filter((c) => c.is_active)
  if (statusFilter === 'inactive') rows = rows.filter((c) => !c.is_active)
  if (query) rows = rows.filter((c) =>
    c.full_name.toLowerCase().includes(query) ||
    (c.company ?? '').toLowerCase().includes(query) ||
    (c.email ?? '').toLowerCase().includes(query)
  )

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Manage tenants, contractors, and partners in one place."
        actions={<Link href="/contacts/new"><Button><Plus className="h-4 w-4" />New contact</Button></Link>}
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardBody>
            <ContactFilters tabs={KIND_TABS} selected={kindFilter} status={statusFilter} q={query} />
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-ink-300" />
              <h3 className="mt-3 text-sm font-semibold text-ink-900">No contacts found</h3>
              <p className="mt-1 text-sm text-ink-500">Adjust the filters or add your first contact.</p>
              <Link href="/contacts/new" className="mt-4 inline-block"><Button>New contact</Button></Link>
            </CardBody>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/contacts/${c.id}`} className="block">
                  <Card className="h-full transition-shadow hover:shadow-elevated">
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700">
                          {c.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900">{c.full_name}</p>
                          {c.company && <p className="truncate text-xs text-ink-500">{c.company}</p>}
                          {c.trade && <p className="text-xs text-ink-400">{c.trade}</p>}
                        </div>
                        <Badge tone={c.kind === 'tenant' ? 'success' : c.kind === 'contractor' ? 'info' : 'neutral'}>
                          {KIND_LABEL[c.kind]}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-ink-500">
                        {c.email && <p className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{c.email}</p>}
                        {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{c.phone}</p>}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
