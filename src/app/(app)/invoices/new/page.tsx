import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { NewInvoiceForm } from '@/components/new-invoice-form'
import type { Contact, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage() {
  const supabase = createClient()
  const { data: contacts = [] } = await supabase.from('contacts').select('*').eq('is_active', true).order('full_name')
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')

  return (
    <>
      <PageHeader title="New invoice" subtitle="Create and send invoices to tenants and contacts." />
      <div className="p-6">
        <Card className="max-w-3xl">
          <CardBody>
            <NewInvoiceForm
              contacts={(contacts ?? []) as Contact[]}
              properties={(properties ?? []) as Pick<Property, 'id' | 'nickname'>[]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
