import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Home, Building } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import type { Property } from '@/lib/types'
import { AddressFields } from '@/components/address-fields'

export const dynamic = 'force-dynamic'

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).maybeSingle()
  if (!property) notFound()
  const p = property as Property & { country?: string; listing_type?: string; property_income_allowance?: boolean; ownership_type?: 'personal' | 'limited_company'; company_name?: string | null; company_number?: string | null; company_year_end_month?: number | null }

  async function update(formData: FormData) {
    'use server'
    const supabase = createClient()
    const payload = {
      nickname: String(formData.get('nickname') ?? ''),
      address_line_1: String(formData.get('address_line_1') ?? ''),
      address_line_2: (formData.get('address_line_2') as string) || null,
      city: String(formData.get('city') ?? ''),
      postcode: String(formData.get('postcode') ?? ''),
      country: String(formData.get('country') ?? 'United Kingdom'),
      listing_type: String(formData.get('listing_type') ?? 'single_family'),
      property_type: String(formData.get('property_type') ?? 'flat'),
      bedrooms: Number(formData.get('bedrooms') ?? 0) || null,
      monthly_rent: Number(formData.get('monthly_rent') ?? 0) || null,
      rent_due_day: Number(formData.get('rent_due_day') ?? 1),
      status: String(formData.get('status') ?? 'vacant') as any,
      notes: (formData.get('notes') as string) || null,
      property_income_allowance: formData.get('property_income_allowance') === 'on',
      ownership_type: String(formData.get('ownership_type') ?? 'personal'),
      company_name: (formData.get('company_name') as string) || null,
      company_number: (formData.get('company_number') as string) || null,
      company_year_end_month: Number(formData.get('company_year_end_month') ?? 0) || null,
    }
    const { error } = await supabase.from('properties').update(payload).eq('id', params.id)
    if (error) throw new Error(error.message)
    revalidatePath('/properties')
    revalidatePath(`/properties/${params.id}`)
    revalidatePath('/dashboard')
    redirect(`/properties/${params.id}`)
  }

  async function remove() {
    'use server'
    const supabase = createClient()
    await supabase.from('properties').delete().eq('id', params.id)
    revalidatePath('/properties')
    revalidatePath('/dashboard')
    redirect('/properties')
  }

  return (
    <>
      <PageHeader
        title={`Edit ${p.nickname}`}
        subtitle="Update property details, or delete this property."
        actions={<Link href={`/properties/${p.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={update} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nickname">Property name</Label>
                <Input id="nickname" name="nickname" required defaultValue={p.nickname} />
              </div>

              <AddressFields
                defaultLine1={p.address_line_1}
                defaultLine2={p.address_line_2 ?? ''}
                defaultCity={p.city}
                defaultPostcode={p.postcode}
                defaultCountry={p.country ?? 'United Kingdom'}
              />


              <div className="sm:col-span-2">
                <Label>Property type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-4 transition-colors has-[input:checked]:border-ink-900 has-[input:checked]:bg-ink-900 has-[input:checked]:text-white">
                    <input type="radio" name="listing_type" value="single_family" defaultChecked={p.listing_type !== 'multi_unit_hmo'} className="sr-only" />
                    <Home className="h-5 w-5" />
                    <p className="mt-2 text-sm font-semibold">Single family</p>
                    <p className="text-xs opacity-80">Detached home, one tenancy</p>
                  </label>
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-4 transition-colors has-[input:checked]:border-ink-900 has-[input:checked]:bg-ink-900 has-[input:checked]:text-white">
                    <input type="radio" name="listing_type" value="multi_unit_hmo" defaultChecked={p.listing_type === 'multi_unit_hmo'} className="sr-only" />
                    <Building className="h-5 w-5" />
                    <p className="mt-2 text-sm font-semibold">Multi-unit / HMO</p>
                    <p className="text-xs opacity-80">Apartments or HMOs</p>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="property_type">Sub-type</Label>
                <Select id="property_type" name="property_type" defaultValue={p.property_type ?? 'flat'}>
                  <option value="flat">Flat</option>
                  <option value="house">House</option>
                  <option value="maisonette">Maisonette</option>
                  <option value="studio">Studio</option>
                  <option value="hmo">HMO</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={p.bedrooms ?? ''} />
              </div>
              <div>
                <Label htmlFor="monthly_rent">Monthly rent (£)</Label>
                <Input id="monthly_rent" name="monthly_rent" type="number" min={0} step="0.01" defaultValue={p.monthly_rent ?? ''} />
              </div>
              <div>
                <Label htmlFor="rent_due_day">Rent due day</Label>
                <Input id="rent_due_day" name="rent_due_day" type="number" min={1} max={28} defaultValue={p.rent_due_day} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={p.status}>
                  <option value="vacant">Vacant</option>
                  <option value="tenanted">Tenanted</option>
                  <option value="legal_proceedings">Legal proceedings</option>
                </Select>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-accent-500/30 bg-accent-50 p-4">
                <Label>Owned by</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-3 transition-colors has-[input:checked]:border-accent-500 has-[input:checked]:bg-accent-500 has-[input:checked]:text-white">
                    <input type="radio" name="ownership_type" value="personal" defaultChecked={(p.ownership_type ?? 'personal') !== 'limited_company'} className="sr-only" />
                    <p className="text-sm font-semibold">Personal</p>
                    <p className="text-xs opacity-80">MTD ITSA quarterly. Section 24 applies (mortgage interest = 20% tax credit).</p>
                  </label>
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-3 transition-colors has-[input:checked]:border-accent-500 has-[input:checked]:bg-accent-500 has-[input:checked]:text-white">
                    <input type="radio" name="ownership_type" value="limited_company" defaultChecked={p.ownership_type === 'limited_company'} className="sr-only" />
                    <p className="text-sm font-semibold">Limited Company</p>
                    <p className="text-xs opacity-80">Annual corporation tax. Mortgage interest is a normal deductible expense.</p>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="company_name">Company name</Label>
                    <Input id="company_name" name="company_name" placeholder="Blake Properties Ltd" defaultValue={p.company_name ?? ''} />
                  </div>
                  <div>
                    <Label htmlFor="company_number">Companies House no.</Label>
                    <Input id="company_number" name="company_number" placeholder="12345678" defaultValue={p.company_number ?? ''} />
                  </div>
                  <div>
                    <Label htmlFor="company_year_end_month">Year-end month</Label>
                    <Select id="company_year_end_month" name="company_year_end_month" defaultValue={String(p.company_year_end_month ?? 3)}>
                      <option value="1">January</option><option value="2">February</option><option value="3">March</option>
                      <option value="4">April</option><option value="5">May</option><option value="6">June</option>
                      <option value="7">July</option><option value="8">August</option><option value="9">September</option>
                      <option value="10">October</option><option value="11">November</option><option value="12">December</option>
                    </Select>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-ink-500">For limited-company properties, the company name + Companies House number + financial year-end are used on annual reports. For personal properties leave blank.</p>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-warning-500/30 bg-warning-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="property_income_allowance"
                    defaultChecked={p.property_income_allowance ?? false}
                    className="mt-1 h-4 w-4 rounded border-ink-300"
                  />
                  <span className="text-sm">
                    <span className="block font-semibold text-ink-900">Claim £1,000 Property Income Allowance (SA105 Box 5.1)</span>
                    <span className="mt-1 block text-xs text-warning-700">
                      If you claim this allowance for this property, you CANNOT deduct any expenses on your tax return. Only enable this if your annual expenses for this property are less than £1,000.
                    </span>
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} defaultValue={p.notes ?? ''} />
              </div>

              <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
                <Button type="submit" formAction={remove} variant="danger" size="sm">Delete property</Button>
                <div className="flex gap-2">
                  <Link href={`/properties/${p.id}`}><Button variant="secondary" type="button">Cancel</Button></Link>
                  <Button type="submit" size="lg">Save changes</Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
