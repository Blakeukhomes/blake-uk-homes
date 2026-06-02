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

export const dynamic = 'force-dynamic'

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).maybeSingle()
  if (!property) notFound()
  const p = property as Property & { country?: string; listing_type?: string }

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

              <div className="sm:col-span-2">
                <Label htmlFor="address_line_1">Address line 1</Label>
                <Input id="address_line_1" name="address_line_1" required defaultValue={p.address_line_1} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address_line_2">Address line 2</Label>
                <Input id="address_line_2" name="address_line_2" defaultValue={p.address_line_2 ?? ''} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" required defaultValue={p.city} />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" name="postcode" required defaultValue={p.postcode} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="country">Country</Label>
                <Select id="country" name="country" defaultValue={p.country ?? 'United Kingdom'}>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Other">Other</option>
                </Select>
              </div>

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
