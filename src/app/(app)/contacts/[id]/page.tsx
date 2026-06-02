import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Contact } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: contact } = await supabase.from('contacts').select('*').eq('id', params.id).maybeSingle()
  if (!contact) notFound()
  const c = contact as Contact

  return (
    <>
      <PageHeader
        title={c.full_name}
        subtitle={[c.company, c.trade].filter(Boolean).join(' · ') || 'Contact details'}
        actions={
          <>
            <Link href="/contacts"><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
            <Link href={`/contacts/${c.id}/edit`}><Button variant="secondary">Edit</Button></Link>
            <Link href={`/messages/new?contact=${c.id}`}><Button>Message</Button></Link>
          </>
        }
      />
      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p><Badge tone={c.kind === 'tenant' ? 'success' : c.kind === 'contractor' ? 'info' : 'neutral'}>{c.kind}</Badge></p>
            {c.email && <p className="flex items-center gap-2 text-ink-700"><Mail className="h-4 w-4 text-ink-400" />{c.email}</p>}
            {c.phone && <p className="flex items-center gap-2 text-ink-700"><Phone className="h-4 w-4 text-ink-400" />{c.phone}</p>}
            {c.address && <p className="flex items-center gap-2 text-ink-700"><MapPin className="h-4 w-4 text-ink-400" />{c.address}</p>}
            {c.notes && <p className="text-ink-600">{c.notes}</p>}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
