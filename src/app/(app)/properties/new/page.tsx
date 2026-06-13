import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Home, Building } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { PropertyPhotoUploader } from '@/components/property-photo-uploader'
import { AddressFields } from '@/components/address-fields'

export default function NewPropertyPage() {
  async function createProperty(formData: FormData) {
    'use server'
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const payload = {
      owner_id: user.id,
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
      hero_image_url: (formData.get('hero_image_url') as string) || null,
      ownership_type: String(formData.get('ownership_type') ?? 'personal'),
      company_name: (formData.get('company_name') as string) || null,
      company_number: (formData.get('company_number') as string) || null,
      company_year_end_month: Number(formData.get('company_year_end_month') ?? 0) || null,
    }

    const { data, error } = await supabase.from('properties').insert(payload).select('id').single()
    if (error) throw new Error(error.message)
    revalidatePath('/properties')
    revalidatePath('/dashboard')
    redirect(`/properties/${data!.id}`)
  }

  return (
    <>
      <PageHeader title="Add new property" subtitle="Enter the details for your new property." />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={createProperty} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Property photo</Label>
                <PropertyPhotoUploader />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="nickname">Property name *</Label>
                <Input id="nickname" name="nickname" required placeholder="e.g. 42 Oak Avenue" />
              </div>

              <AddressFields />


              <div className="sm:col-span-2">
                <Label>Property type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-4 transition-colors has-[input:checked]:border-ink-900 has-[input:checked]:bg-ink-900 has-[input:checked]:text-white">
                    <input type="radio" name="listing_type" value="single_family" defaultChecked className="sr-only" />
                    <Home className="h-5 w-5" />
                    <p className="mt-2 text-sm font-semibold">Single family</p>
                    <p className="text-xs opacity-80">Detached home, one tenancy</p>
                  </label>
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-4 transition-colors has-[input:checked]:border-ink-900 has-[input:checked]:bg-ink-900 has-[input:checked]:text-white">
                    <input type="radio" name="listing_type" value="multi_unit_hmo" className="sr-only" />
                    <Building className="h-5 w-5" />
                    <p className="mt-2 text-sm font-semibold">Multi-unit / HMO</p>
                    <p className="text-xs opacity-80">Apartments or HMOs</p>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="property_type">Sub-type</Label>
                <Select id="property_type" name="property_type" defaultValue="flat">
                  <option value="flat">Flat</option>
                  <option value="house">House</option>
                  <option value="maisonette">Maisonette</option>
                  <option value="studio">Studio</option>
                  <option value="hmo">HMO</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" min={0} />
              </div>
              <div>
                <Label htmlFor="monthly_rent">Monthly rent (£)</Label>
                <Input id="monthly_rent" name="monthly_rent" type="number" min={0} step="0.01" />
              </div>
              <div>
                <Label htmlFor="rent_due_day">Rent due day</Label>
                <Input id="rent_due_day" name="rent_due_day" type="number" min={1} max={28} defaultValue={1} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue="vacant">
                  <option value="vacant">Vacant</option>
                  <option value="tenanted">Tenanted</option>
                  <option value="legal_proceedings">Legal proceedings</option>
                </Select>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-accent-500/30 bg-accent-50 p-4">
                <Label>Owned by</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-3 transition-colors has-[input:checked]:border-accent-500 has-[input:checked]:bg-accent-500 has-[input:checked]:text-white">
                    <input type="radio" name="ownership_type" value="personal" defaultChecked className="sr-only" />
                    <p className="text-sm font-semibold">Personal</p>
                    <p className="text-xs opacity-80">MTD ITSA quarterly. Section 24 applies.</p>
                  </label>
                  <label className="cursor-pointer rounded-xl border-2 border-ink-200 bg-white p-3 transition-colors has-[input:checked]:border-accent-500 has-[input:checked]:bg-accent-500 has-[input:checked]:text-white">
                    <input type="radio" name="ownership_type" value="limited_company" className="sr-only" />
                    <p className="text-sm font-semibold">Limited Company</p>
                    <p className="text-xs opacity-80">Annual corp tax. Interest is deductible.</p>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="company_name">Company name</Label>
                    <Input id="company_name" name="company_name" placeholder="Blake Properties Ltd" />
                  </div>
                  <div>
                    <Label htmlFor="company_number">Companies House no.</Label>
                    <Input id="company_number" name="company_number" placeholder="12345678" />
                  </div>
                  <div>
                    <Label htmlFor="company_year_end_month">Year-end month</Label>
                    <Select id="company_year_end_month" name="company_year_end_month" defaultValue="3">
                      <option value="1">January</option><option value="2">February</option><option value="3">March</option>
                      <option value="4">April</option><option value="5">May</option><option value="6">June</option>
                      <option value="7">July</option><option value="8">August</option><option value="9">September</option>
                      <option value="10">October</option><option value="11">November</option><option value="12">December</option>
                    </Select>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-ink-500">For limited-company properties, fill in company details so reports are formatted correctly.</p>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="submit" size="lg">Add property</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
