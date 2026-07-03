import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { MtdCategorySelects } from '@/components/mtd-category-selects'
import type { Property } from '@/lib/types'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function NewMtdTransactionPage() {
  const supabase = createClient()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  async function logTransaction(formData: FormData) {
    'use server'
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const kind = String(formData.get('kind')) as 'income' | 'expense'

    const payload: any = {
      property_id: String(formData.get('property_id')),
      kind,
      transaction_date: String(formData.get('transaction_date')),
      amount: Number(formData.get('amount') ?? 0),
      description: (formData.get('description') as string) || null,
      supplier_or_payer: (formData.get('supplier_or_payer') as string) || null,
      notes: (formData.get('notes') as string) || null,
      created_by: user?.id ?? null,
      income_category:  kind === 'income'  ? (formData.get('income_category')  as string) : null,
      expense_category: kind === 'expense' ? (formData.get('expense_category') as string) : null,
      is_recurring: formData.get('is_recurring') === 'on',
    }

    const { error } = await supabase.from('mtd_transactions').insert(payload)
    if (error) throw new Error(error.message)
    revalidatePath('/mtd')
    redirect('/mtd')
  }

  return (
    <>
      <PageHeader title="Log MTD transaction" subtitle="Tag every payment to its HMRC ITSA category." />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={logTransaction} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="property_id">Property</Label>
                <Select id="property_id" name="property_id" required>
                  {props.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="transaction_date">Date</Label>
                <Input id="transaction_date" name="transaction_date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>

              <MtdCategorySelects />

              <div>
                <Label htmlFor="amount">Amount (£)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min={0} required />
              </div>
              <div>
                <Label htmlFor="supplier_or_payer">Supplier or payer</Label>
                <Input id="supplier_or_payer" name="supplier_or_payer" placeholder="e.g. British Gas, Tenant Patel" />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="e.g. Monthly gas bill" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-accent-500/30 bg-accent-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="is_recurring" className="mt-1 h-4 w-4 rounded border-ink-300" />
                  <span className="text-sm">
                    <span className="block font-semibold text-ink-900">This is a recurring monthly expense</span>
                    <span className="mt-1 block text-xs text-ink-600">
                      Tick to auto-log a fresh copy each month (e.g. mortgage, insurance, letting-agent fee, standing charges). You can edit or stop it anytime.
                    </span>
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="submit" size="lg">Log transaction</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
