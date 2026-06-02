import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { COMPLIANCE_META, complianceState, daysUntilExpiry, expiryFromCompletion } from '@/lib/compliance'
import type { ComplianceCertificate, ComplianceType } from '@/lib/types'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PropertyCompliance({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id, nickname').eq('id', params.id).single()
  const { data: certs = [] } = await supabase
    .from('compliance_certificates').select('*').eq('property_id', params.id).order('completed_on', { ascending: false })

  if (!property) return null

  async function addCertificate(formData: FormData) {
    'use server'
    const supabase = createClient()
    const type = String(formData.get('type')) as ComplianceType
    const completed_on = String(formData.get('completed_on'))
    const expires = expiryFromCompletion(type, completed_on)

    const { error } = await supabase.from('compliance_certificates').insert({
      property_id: params.id,
      type,
      completed_on,
      expires_on: format(expires, 'yyyy-MM-dd'),
      issued_by: (formData.get('issued_by') as string) || null,
      reference: (formData.get('reference') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    if (error) throw new Error(error.message)
    revalidatePath(`/properties/${params.id}/compliance`)
    revalidatePath('/compliance')
    revalidatePath('/dashboard')
  }

  async function deleteCertificate(formData: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(formData.get('cert_id'))
    await supabase.from('compliance_certificates').delete().eq('id', id)
    revalidatePath(`/properties/${params.id}/compliance`)
    revalidatePath('/compliance')
    revalidatePath('/dashboard')
  }

  return (
    <>
      <PageHeader title={`${property.nickname}, Compliance`} subtitle="Add new certificates; expiry is calculated automatically." />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add certificate</CardTitle>
            <CardDescription>Pick the type and completion date. Expiry follows UK rules.</CardDescription>
          </CardHeader>
          <CardBody>
            <form action={addCertificate} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" required>
                  {(Object.keys(COMPLIANCE_META) as ComplianceType[]).map((t) => (
                    <option key={t} value={t}>{COMPLIANCE_META[t].label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="completed_on">Completed on</Label>
                <Input id="completed_on" name="completed_on" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div>
                <Label htmlFor="issued_by">Issued by</Label>
                <Input id="issued_by" name="issued_by" placeholder="Engineer / firm name" />
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" placeholder="Certificate ref" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">Add certificate</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificate history</CardTitle>
            <CardDescription>Most recent first.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {(certs ?? []).length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">No certificates on file.</p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {(certs as ComplianceCertificate[]).map((c) => {
                  const state = complianceState(c)
                  return (
                    <li key={c.id} className="grid gap-2 px-6 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      <div>
                        <p className="font-medium text-ink-900">{COMPLIANCE_META[c.type].shortLabel}</p>
                        <p className="text-xs text-ink-500">
                          Completed {new Date(c.completed_on).toLocaleDateString('en-GB')} ·
                          expires {new Date(c.expires_on).toLocaleDateString('en-GB')}
                          {c.reference ? ` · ref ${c.reference}` : ''}
                        </p>
                      </div>
                      <div className="text-sm text-ink-700 sm:text-right">{daysUntilExpiry(c)} days</div>
                      <Badge tone={state === 'expired' ? 'danger' : state === 'due_soon' ? 'warning' : 'success'}>
                        {state === 'expired' ? 'Expired' : state === 'due_soon' ? 'Due soon' : 'Valid'}
                      </Badge>
                      <form action={deleteCertificate}>
                        <input type="hidden" name="cert_id" value={c.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-danger-700">Delete</Button>
                      </form>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
