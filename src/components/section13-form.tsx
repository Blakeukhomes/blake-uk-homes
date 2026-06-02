'use client'
import { useMemo, useState } from 'react'
import { addMonths, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'

export function Section13Form({
  properties, tenants, landlordName,
}: {
  properties: { id: string; nickname: string; address_line_1: string; city: string; postcode: string; monthly_rent: number | null }[]
  tenants: { id: string; full_name: string; property_id: string }[]
  landlordName: string
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [tenantId, setTenantId] = useState(() => tenants.find((t) => t.property_id === properties[0]?.id)?.id ?? '')
  const tenantsForProp = useMemo(() => tenants.filter((t) => t.property_id === propertyId), [tenants, propertyId])
  const prop = properties.find((p) => p.id === propertyId)

  const defaultEffective = format(addMonths(new Date(), 2), 'yyyy-MM-dd')

  return (
    <form action="/api/pdf/section13" method="POST" target="_blank" className="grid gap-4">
      <input type="hidden" name="landlord_name" value={landlordName} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="property_id">Property</Label>
          <Select id="property_id" name="property_id" required value={propertyId} onChange={(e) => {
            setPropertyId(e.target.value)
            const next = tenants.find((t) => t.property_id === e.target.value)?.id ?? ''
            setTenantId(next)
          }}>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="tenant_id">Tenant</Label>
          <Select id="tenant_id" name="tenant_id" required value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            {tenantsForProp.length === 0 && <option value="">No active tenant</option>}
            {tenantsForProp.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="current_rent">Current rent (£/pcm)</Label>
          <Input id="current_rent" name="current_rent" type="number" step="0.01" required defaultValue={prop?.monthly_rent ?? 0} />
        </div>
        <div>
          <Label htmlFor="new_rent">New rent (£/pcm)</Label>
          <Input id="new_rent" name="new_rent" type="number" step="0.01" required />
        </div>
        <div>
          <Label htmlFor="effective_date">Effective date</Label>
          <Input id="effective_date" name="effective_date" type="date" required defaultValue={defaultEffective} />
          <p className="mt-1 text-xs text-ink-500">Defaults to today + 2 months (legal minimum).</p>
        </div>
        <div>
          <Label htmlFor="landlord_address">Your address (for notice)</Label>
          <Input id="landlord_address" name="landlord_address" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="reason">Reason for increase (optional)</Label>
          <Textarea id="reason" name="reason" rows={3} placeholder="e.g. Market rate adjustment after 24 months at the current rent." />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Generate PDF</Button>
      </div>
    </form>
  )
}
